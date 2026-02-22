import datetime as dt
import logging
import math
import os
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import azure.functions as func
import requests

EARTH_RADIUS_MILES = 3958.7613
METERS_TO_FEET = 3.28084
MPS_TO_KNOTS = 1.943844

TARGET_LAT = 41.37249516431758
TARGET_LON = -81.66006046439117

LOOKAHEAD_MINUTES = 15
LOOKAHEAD_HOURS = LOOKAHEAD_MINUTES / 60.0
SEARCH_RADIUS_MILES = 180.0
VISIBLE_RADIUS_MILES = 25.0
MIN_ALTITUDE_FT = 1500.0
MAX_ALTITUDE_FT = 45000.0
MAX_EMAIL_FLIGHTS = 25

MAILGUN_FROM_EMAIL = "flighttracker@tomgorbett.com"
MAILGUN_TO_EMAIL = "willschaef12@gmail.com"
MAILGUN_DOMAIN = MAILGUN_FROM_EMAIL.split("@", 1)[1]

OPENSKY_URL = "https://opensky-network.org/api/states/all"
FLIGHTLOG_DEFAULT_URL = "https://airlabs.co/api/v9/flights"


def main(mytimer: func.TimerRequest) -> None:
    run_utc = dt.datetime.now(dt.timezone.utc)
    if mytimer.past_due:
        logging.warning("Timer trigger is running behind schedule.")

    api_key = clean_text(os.getenv("MAILGUN_API_KEY"))
    if not api_key:
        logging.error("MAILGUN_API_KEY is not set. Skipping run.")
        return

    provider = normalize_provider(os.getenv("FLIGHT_PROVIDER"))
    bounding_box = get_bounding_box(TARGET_LAT, TARGET_LON, SEARCH_RADIUS_MILES)

    try:
        source_flights = fetch_source_flights(provider, bounding_box)
        candidates = find_visible_candidates(source_flights, run_utc)
        subject, body = build_email(run_utc, provider, candidates)
        send_mailgun_email(api_key, subject, body)
        logging.info("Sent Mailgun report with %d candidate flights.", len(candidates))
    except Exception:
        logging.exception("Flight timer function failed.")


def find_visible_candidates(source_flights: Iterable[Dict[str, Any]], run_utc: dt.datetime) -> List[Dict[str, Any]]:
    now_seconds = int(run_utc.timestamp())
    candidates: List[Dict[str, Any]] = []

    for flight in source_flights:
        enriched = enrich_flight(flight, now_seconds)

        if enriched["on_ground"]:
            continue

        altitude_ft = enriched["altitude_ft"]
        if is_finite(altitude_ft) and (altitude_ft < MIN_ALTITUDE_FT or altitude_ft > MAX_ALTITUDE_FT):
            continue

        projection = project_visibility_window(enriched)
        if not projection["in_window"]:
            continue

        enriched["eta_minutes"] = round_or_none(projection["eta_minutes"], 1)
        enriched["closest_distance_miles"] = round_or_none(projection["closest_distance_miles"], 2)
        candidates.append(enriched)

    candidates.sort(
        key=lambda item: (
            item["eta_minutes"] if is_finite(item["eta_minutes"]) else LOOKAHEAD_MINUTES + 1,
            -item["overhead_score"],
            item["distance_miles"],
        )
    )

    return candidates[:MAX_EMAIL_FLIGHTS]


def fetch_source_flights(provider: str, box: Dict[str, float]) -> List[Dict[str, Any]]:
    if provider == "flightlog":
        return fetch_flightlog_flights(box)
    return fetch_opensky_flights(box)


def normalize_provider(value: Optional[str]) -> str:
    fallback = "flightlog" if (clean_text(os.getenv("FLIGHTLOG_API_KEY")) or clean_text(os.getenv("AIRLABS_API_KEY"))) else "opensky"
    normalized = (value or fallback).strip().lower()
    if normalized in {"flightlog", "airlabs"}:
        return "flightlog"
    return "opensky"


def fetch_opensky_flights(box: Dict[str, float]) -> List[Dict[str, Any]]:
    params = {
        "lamin": f"{box['south']:.5f}",
        "lomin": f"{box['west']:.5f}",
        "lamax": f"{box['north']:.5f}",
        "lomax": f"{box['east']:.5f}",
    }
    response = requests.get(OPENSKY_URL, params=params, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"OpenSky lookup failed ({response.status_code}).")

    payload = response.json()
    states = payload.get("states") if isinstance(payload, dict) else None
    rows = states if isinstance(states, list) else []

    flights: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, list):
            continue

        flight = {
            "icao24": clean_text(get_at(row, 0)),
            "callsign": clean_text(get_at(row, 1)),
            "origin_country": clean_text(get_at(row, 2)),
            "last_contact": parse_number(get_at(row, 4)),
            "longitude": parse_number(get_at(row, 5)),
            "latitude": parse_number(get_at(row, 6)),
            "baro_altitude_ft": to_feet(get_at(row, 7)),
            "on_ground": bool(get_at(row, 8)),
            "speed_knots": to_knots(get_at(row, 9)),
            "heading_degrees": parse_number(get_at(row, 10)),
            "geo_altitude_ft": to_feet(get_at(row, 13)),
            "departure_icao": None,
            "arrival_icao": None,
        }

        if is_finite(flight["latitude"]) and is_finite(flight["longitude"]):
            flights.append(flight)

    return flights


def fetch_flightlog_flights(box: Dict[str, float]) -> List[Dict[str, Any]]:
    api_key = clean_text(os.getenv("FLIGHTLOG_API_KEY")) or clean_text(os.getenv("AIRLABS_API_KEY"))
    if not api_key:
        raise RuntimeError("FLIGHTLOG_API_KEY (or AIRLABS_API_KEY) is required when FLIGHT_PROVIDER=flightlog.")

    base_url = clean_text(os.getenv("FLIGHTLOG_API_URL")) or FLIGHTLOG_DEFAULT_URL
    bbox = f"{box['south']:.5f},{box['west']:.5f},{box['north']:.5f},{box['east']:.5f}"

    response = requests.get(base_url, params={"api_key": api_key, "bbox": bbox}, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"FlightLog lookup failed ({response.status_code}).")

    payload = response.json()
    if isinstance(payload, dict) and payload.get("error"):
        error = payload["error"]
        if isinstance(error, str):
            message = error
        elif isinstance(error, dict):
            message = clean_text(error.get("message")) or "FlightLog API error."
        else:
            message = "FlightLog API error."
        raise RuntimeError(message)

    rows = payload.get("response") if isinstance(payload, dict) else None
    entries = rows if isinstance(rows, list) else []

    flights: List[Dict[str, Any]] = []
    for row in entries:
        if not isinstance(row, dict):
            continue

        flight = {
            "icao24": clean_text(row.get("hex")),
            "callsign": clean_text(row.get("flight_icao") or row.get("flight_iata") or row.get("reg_number")),
            "origin_country": clean_text(row.get("flag")),
            "last_contact": parse_number(row.get("updated")),
            "longitude": parse_number(row.get("lng") if row.get("lng") is not None else row.get("lon")),
            "latitude": parse_number(row.get("lat")),
            "baro_altitude_ft": parse_number(row.get("alt")),
            "on_ground": str(row.get("status") or "").strip().lower() == "landed",
            "speed_knots": to_knots_from_kmh(row.get("speed")),
            "heading_degrees": parse_number(row.get("dir")),
            "geo_altitude_ft": parse_number(row.get("alt")),
            "departure_icao": clean_text(row.get("dep_icao")),
            "arrival_icao": clean_text(row.get("arr_icao")),
        }

        if is_finite(flight["latitude"]) and is_finite(flight["longitude"]):
            flights.append(flight)

    return flights


def enrich_flight(flight: Dict[str, Any], now_seconds: int) -> Dict[str, Any]:
    distance_miles = haversine_miles(TARGET_LAT, TARGET_LON, flight["latitude"], flight["longitude"])
    bearing_to_target = bearing_degrees(flight["latitude"], flight["longitude"], TARGET_LAT, TARGET_LON)
    heading_degrees = normalize_degrees(flight["heading_degrees"]) if is_finite(flight["heading_degrees"]) else None

    heading_delta = degree_difference(heading_degrees, bearing_to_target) if is_finite(heading_degrees) else None
    approaching_target = bool(is_finite(heading_delta) and heading_delta <= 35.0)

    altitude_ft = flight["geo_altitude_ft"] if is_finite(flight["geo_altitude_ft"]) else flight["baro_altitude_ft"]
    speed_knots = flight["speed_knots"] if is_finite(flight["speed_knots"]) else None
    speed_mph = speed_knots * 1.15078 if is_finite(speed_knots) else None

    estimated_overhead_minutes = None
    if approaching_target and is_finite(speed_mph) and speed_mph > 60:
        estimated_overhead_minutes = (distance_miles / speed_mph) * 60

    overhead_score = score_flight(distance_miles, altitude_ft, approaching_target, heading_delta, speed_knots)
    seconds_since_seen = max(0, now_seconds - int(flight["last_contact"])) if is_finite(flight["last_contact"]) else None

    enriched = dict(flight)
    enriched.update(
        {
            "distance_miles": distance_miles,
            "heading_degrees": heading_degrees,
            "altitude_ft": altitude_ft,
            "speed_knots": speed_knots,
            "approaching_target": approaching_target,
            "estimated_overhead_minutes": estimated_overhead_minutes,
            "overhead_score": overhead_score,
            "overhead_likelihood": score_to_band(overhead_score),
            "seconds_since_seen": seconds_since_seen,
        }
    )
    return enriched


def project_visibility_window(flight: Dict[str, Any]) -> Dict[str, Any]:
    current_distance = flight["distance_miles"]
    if current_distance <= VISIBLE_RADIUS_MILES:
        return {"in_window": True, "eta_minutes": 0.0, "closest_distance_miles": current_distance}

    if not (is_finite(flight["speed_knots"]) and is_finite(flight["heading_degrees"])):
        return {"in_window": False, "eta_minutes": None, "closest_distance_miles": current_distance}

    speed_mph = flight["speed_knots"] * 1.15078
    if speed_mph <= 50:
        return {"in_window": False, "eta_minutes": None, "closest_distance_miles": current_distance}

    rel_east, rel_north = vector_flight_to_target_miles(flight["latitude"], flight["longitude"], TARGET_LAT, TARGET_LON)
    vel_east, vel_north = heading_velocity(speed_mph, flight["heading_degrees"])

    vel_sq = vel_east * vel_east + vel_north * vel_north
    if vel_sq <= 1e-9:
        return {"in_window": False, "eta_minutes": None, "closest_distance_miles": current_distance}

    dot = rel_east * vel_east + rel_north * vel_north
    time_closest_hours = clamp(dot / vel_sq, 0.0, LOOKAHEAD_HOURS)

    closest_east = rel_east - vel_east * time_closest_hours
    closest_north = rel_north - vel_north * time_closest_hours
    closest_distance_miles = math.hypot(closest_east, closest_north)

    if closest_distance_miles > VISIBLE_RADIUS_MILES:
        return {"in_window": False, "eta_minutes": None, "closest_distance_miles": closest_distance_miles}

    eta_minutes = estimate_entry_minutes(rel_east, rel_north, vel_east, vel_north, VISIBLE_RADIUS_MILES)
    if not is_finite(eta_minutes) or eta_minutes > LOOKAHEAD_MINUTES:
        return {"in_window": False, "eta_minutes": None, "closest_distance_miles": closest_distance_miles}

    return {"in_window": True, "eta_minutes": eta_minutes, "closest_distance_miles": closest_distance_miles}


def estimate_entry_minutes(
    rel_east: float,
    rel_north: float,
    vel_east: float,
    vel_north: float,
    radius_miles: float,
) -> Optional[float]:
    if math.hypot(rel_east, rel_north) <= radius_miles:
        return 0.0

    a = vel_east * vel_east + vel_north * vel_north
    b = -2.0 * ((rel_east * vel_east) + (rel_north * vel_north))
    c = rel_east * rel_east + rel_north * rel_north - radius_miles * radius_miles

    if a <= 1e-9:
        return None

    discriminant = b * b - 4.0 * a * c
    if discriminant < 0:
        return None

    sqrt_d = math.sqrt(max(0.0, discriminant))
    roots = [(-b - sqrt_d) / (2.0 * a), (-b + sqrt_d) / (2.0 * a)]
    valid = sorted(root for root in roots if root >= 0)

    if not valid:
        return None

    first = valid[0]
    if first > LOOKAHEAD_HOURS:
        return None

    return first * 60.0


def build_email(run_utc: dt.datetime, provider: str, flights: Sequence[Dict[str, Any]]) -> Tuple[str, str]:
    local_run = run_utc.astimezone()
    subject_count = len(flights)
    noun = "flight" if subject_count == 1 else "flights"
    subject = f"Flight Tracker: {subject_count} possible overhead {noun} in next 15 minutes"

    lines = [
        "Overhead flight lookahead report",
        "",
        f"Run time (UTC): {run_utc.isoformat()}",
        f"Run time (local): {local_run.isoformat()}",
        f"Provider: {provider}",
        f"Target coordinates: {TARGET_LAT:.14f}, {TARGET_LON:.14f}",
        f"Lookahead window: next {LOOKAHEAD_MINUTES} minutes",
        f"Visible radius: {VISIBLE_RADIUS_MILES:.0f} miles",
        "",
    ]

    if not flights:
        lines.append("No flights are predicted to enter the visible radius in the next 15 minutes.")
    else:
        lines.append(f"Candidate flights: {len(flights)}")
        lines.append("")

        for index, flight in enumerate(flights, start=1):
            identity = " ".join(part for part in [flight.get("callsign"), flight.get("icao24")] if part) or "Unknown flight"
            route = " -> ".join(part for part in [flight.get("departure_icao"), flight.get("arrival_icao")] if part)
            route_line = route if route else "n/a"

            lines.extend(
                [
                    f"{index}. {identity}",
                    f"   ETA to radius: {format_number(flight.get('eta_minutes'), 1, 'min')}",
                    f"   Closest distance: {format_number(flight.get('closest_distance_miles'), 2, 'mi')}",
                    f"   Current distance: {format_number(flight.get('distance_miles'), 2, 'mi')}",
                    f"   Altitude: {format_number(flight.get('altitude_ft'), 0, 'ft')}",
                    f"   Speed: {format_number(flight.get('speed_knots'), 0, 'kt')}",
                    f"   Heading: {format_number(flight.get('heading_degrees'), 0, 'deg')}",
                    f"   Likelihood: {flight.get('overhead_likelihood') or 'low'} (score {flight.get('overhead_score')})",
                    f"   Route: {route_line}",
                    "",
                ]
            )

    return subject, "\n".join(lines).rstrip()


def send_mailgun_email(api_key: str, subject: str, body: str) -> None:
    endpoint = f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages"
    payload = {
        "from": MAILGUN_FROM_EMAIL,
        "to": MAILGUN_TO_EMAIL,
        "subject": subject,
        "text": body,
    }

    response = requests.post(endpoint, auth=("api", api_key), data=payload, timeout=30)
    if response.status_code >= 400:
        message = response.text.strip()
        if len(message) > 300:
            message = message[:300] + "..."
        raise RuntimeError(f"Mailgun send failed ({response.status_code}): {message}")


def score_flight(
    distance_miles: float,
    altitude_ft: Optional[float],
    approaching_target: bool,
    heading_delta: Optional[float],
    speed_knots: Optional[float],
) -> int:
    score = 0

    if distance_miles <= 3:
        score += 45
    elif distance_miles <= 7:
        score += 35
    elif distance_miles <= 15:
        score += 24
    else:
        score += 12

    if approaching_target:
        score += 28
    elif is_finite(heading_delta) and heading_delta <= 70:
        score += 12

    if is_finite(altitude_ft):
        if 1500 <= altitude_ft <= 18000:
            score += 16
        elif altitude_ft > 42000:
            score -= 8
        elif altitude_ft < 800:
            score -= 14

    if is_finite(speed_knots):
        if speed_knots >= 220:
            score += 10
        elif speed_knots < 80:
            score -= 8

    return int(clamp(round(score), 0, 100))


def score_to_band(score: int) -> str:
    if score >= 72:
        return "high"
    if score >= 48:
        return "medium"
    return "low"


def get_bounding_box(lat: float, lon: float, radius_miles: float) -> Dict[str, float]:
    lat_delta = radians_to_degrees(radius_miles / EARTH_RADIUS_MILES)
    safe_cos = max(math.cos(degrees_to_radians(lat)), 0.01)
    lon_delta = radians_to_degrees(radius_miles / (EARTH_RADIUS_MILES * safe_cos))

    return {
        "south": clamp(lat - lat_delta, -89.99, 89.99),
        "north": clamp(lat + lat_delta, -89.99, 89.99),
        "west": clamp(lon - lon_delta, -179.99, 179.99),
        "east": clamp(lon + lon_delta, -179.99, 179.99),
    }


def vector_flight_to_target_miles(
    flight_lat: float, flight_lon: float, target_lat: float, target_lon: float
) -> Tuple[float, float]:
    mean_lat = (flight_lat + target_lat) / 2.0
    miles_per_degree_lat = 69.0
    miles_per_degree_lon = 69.172 * math.cos(degrees_to_radians(mean_lat))

    east = (target_lon - flight_lon) * miles_per_degree_lon
    north = (target_lat - flight_lat) * miles_per_degree_lat
    return east, north


def heading_velocity(speed_mph: float, heading_degrees: float) -> Tuple[float, float]:
    heading_rad = degrees_to_radians(heading_degrees)
    east = speed_mph * math.sin(heading_rad)
    north = speed_mph * math.cos(heading_rad)
    return east, north


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    d_lat = degrees_to_radians(lat2 - lat1)
    d_lon = degrees_to_radians(lon2 - lon1)

    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(degrees_to_radians(lat1)) * math.cos(degrees_to_radians(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_MILES * c


def bearing_degrees(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    y = math.sin(degrees_to_radians(lon2 - lon1)) * math.cos(degrees_to_radians(lat2))
    x = (
        math.cos(degrees_to_radians(lat1)) * math.sin(degrees_to_radians(lat2))
        - math.sin(degrees_to_radians(lat1))
        * math.cos(degrees_to_radians(lat2))
        * math.cos(degrees_to_radians(lon2 - lon1))
    )
    return normalize_degrees(radians_to_degrees(math.atan2(y, x)))


def degree_difference(a: float, b: float) -> float:
    diff = abs(normalize_degrees(a) - normalize_degrees(b))
    return 360.0 - diff if diff > 180.0 else diff


def to_feet(value_in_meters: Any) -> Optional[float]:
    meters = parse_number(value_in_meters)
    return meters * METERS_TO_FEET if is_finite(meters) else None


def to_knots(value_in_meters_per_second: Any) -> Optional[float]:
    speed = parse_number(value_in_meters_per_second)
    return speed * MPS_TO_KNOTS if is_finite(speed) else None


def to_knots_from_kmh(value_in_kmh: Any) -> Optional[float]:
    speed = parse_number(value_in_kmh)
    if not is_finite(speed):
        return None
    return (speed / 3.6) * MPS_TO_KNOTS


def parse_number(value: Any) -> Optional[float]:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if math.isfinite(numeric):
        return numeric
    return None


def clean_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def round_or_none(value: Optional[float], decimals: int) -> Optional[float]:
    if not is_finite(value):
        return None
    scale = 10 ** decimals
    return round(value * scale) / scale


def format_number(value: Any, decimals: int, unit: str) -> str:
    number = parse_number(value)
    if not is_finite(number):
        return "n/a"
    if decimals == 0:
        rendered = f"{int(round(number))}"
    else:
        rendered = f"{number:.{decimals}f}"
    return f"{rendered} {unit}"


def get_at(row: Sequence[Any], index: int) -> Any:
    if index < 0 or index >= len(row):
        return None
    return row[index]


def is_finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def normalize_degrees(value: float) -> float:
    return (value % 360.0 + 360.0) % 360.0


def degrees_to_radians(value: float) -> float:
    return value * math.pi / 180.0


def radians_to_degrees(value: float) -> float:
    return value * 180.0 / math.pi
