const EARTH_RADIUS_MILES = 3958.7613;
const METERS_TO_FEET = 3.28084;
const MPS_TO_KNOTS = 1.943844;

module.exports = async function (context, req) {
  const lat = parseNumber(req.query?.lat);
  const lon = parseNumber(req.query?.lon);

  if (!isLatitude(lat) || !isLongitude(lon)) {
    return respond(context, 400, { error: "Valid lat/lon query parameters are required." });
  }

  const radiusMiles = clamp(parseNumber(req.query?.radiusMiles, 25), 5, 120);
  const minAltitudeFt = clamp(parseNumber(req.query?.minAltitudeFt, 1500), 0, 60000);
  const maxAltitudeFt = clamp(parseNumber(req.query?.maxAltitudeFt, 45000), minAltitudeFt + 500, 65000);
  const maxResults = clamp(Math.round(parseNumber(req.query?.maxResults, 25)), 5, 100);

  const box = getBoundingBox(lat, lon, radiusMiles);
  const provider = normalizeProvider(process.env.FLIGHT_PROVIDER);

  try {
    const sourceFlights = provider === "flightlog"
      ? await fetchFlightlogFlights(box)
      : await fetchOpenSkyFlights(box);

    const nowSeconds = Math.floor(Date.now() / 1000);

    const flights = sourceFlights
      .map((flight) => enrichFlight(flight, { lat, lon, nowSeconds }))
      .filter((flight) => {
        if (!Number.isFinite(flight.distanceMiles) || flight.distanceMiles > radiusMiles) {
          return false;
        }

        if (flight.onGround) {
          return false;
        }

        if (Number.isFinite(flight.altitudeFt)) {
          return flight.altitudeFt >= minAltitudeFt && flight.altitudeFt <= maxAltitudeFt;
        }

        return true;
      })
      .sort((a, b) => {
        if (b.overheadScore !== a.overheadScore) {
          return b.overheadScore - a.overheadScore;
        }
        return a.distanceMiles - b.distanceMiles;
      })
      .slice(0, maxResults)
      .map((flight) => ({
        icao24: flight.icao24,
        callsign: flight.callsign,
        originCountry: flight.originCountry,
        departureIcao: flight.departureIcao,
        arrivalIcao: flight.arrivalIcao,
        latitude: roundOrNull(flight.latitude, 5),
        longitude: roundOrNull(flight.longitude, 5),
        distanceMiles: roundOrNull(flight.distanceMiles, 2),
        headingDegrees: roundOrNull(flight.headingDegrees, 0),
        altitudeFt: roundOrNull(flight.altitudeFt, 0),
        speedKnots: roundOrNull(flight.speedKnots, 0),
        approachingUser: flight.approachingUser,
        estimatedOverheadMinutes: roundOrNull(flight.estimatedOverheadMinutes, 1),
        overheadScore: flight.overheadScore,
        overheadLikelihood: flight.overheadLikelihood,
        secondsSinceSeen: roundOrNull(flight.secondsSinceSeen, 0)
      }));

    return respond(context, 200, {
      provider,
      requestedAt: new Date().toISOString(),
      location: { lat, lon },
      radiusMiles,
      filters: { minAltitudeFt, maxAltitudeFt, maxResults },
      flights
    });
  } catch (error) {
    context.log?.error?.(error);
    return respond(context, error.statusCode || 500, {
      error: error.message || "Unable to retrieve flight data"
    });
  }
};

function normalizeProvider(value) {
  const fallback = process.env.FLIGHTLOG_API_KEY || process.env.AIRLABS_API_KEY
    ? "flightlog"
    : "opensky";

  const normalized = String(value || fallback).trim().toLowerCase();
  if (normalized === "flightlog" || normalized === "airlabs") {
    return "flightlog";
  }
  return "opensky";
}

async function fetchOpenSkyFlights(box) {
  const url = new URL("https://opensky-network.org/api/states/all");
  url.searchParams.set("lamin", box.south.toFixed(5));
  url.searchParams.set("lomin", box.west.toFixed(5));
  url.searchParams.set("lamax", box.north.toFixed(5));
  url.searchParams.set("lomax", box.east.toFixed(5));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new ErrorWithStatus(`OpenSky lookup failed (${response.status})`, 502);
  }

  const payload = await response.json();
  const states = Array.isArray(payload.states) ? payload.states : [];

  return states
    .map((state) => ({
      icao24: cleanText(state[0]),
      callsign: cleanText(state[1]),
      originCountry: cleanText(state[2]),
      lastContact: parseNumber(state[4]),
      longitude: parseNumber(state[5]),
      latitude: parseNumber(state[6]),
      baroAltitudeFt: toFeet(state[7]),
      onGround: Boolean(state[8]),
      speedKnots: toKnots(state[9]),
      headingDegrees: parseNumber(state[10]),
      geoAltitudeFt: toFeet(state[13]),
      departureIcao: null,
      arrivalIcao: null
    }))
    .filter((flight) => Number.isFinite(flight.latitude) && Number.isFinite(flight.longitude));
}

async function fetchFlightlogFlights(box) {
  const apiKey = process.env.FLIGHTLOG_API_KEY || process.env.AIRLABS_API_KEY;
  if (!apiKey) {
    throw new ErrorWithStatus("FLIGHTLOG_API_KEY (or AIRLABS_API_KEY) is required when FLIGHT_PROVIDER=flightlog", 500);
  }

  const baseUrl = process.env.FLIGHTLOG_API_URL || "https://airlabs.co/api/v9/flights";
  const bbox = `${box.south.toFixed(5)},${box.west.toFixed(5)},${box.north.toFixed(5)},${box.east.toFixed(5)}`;

  const url = new URL(baseUrl);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("bbox", bbox);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new ErrorWithStatus(`FlightLog lookup failed (${response.status})`, 502);
  }

  const payload = await response.json();
  if (payload.error) {
    const message = typeof payload.error === "string"
      ? payload.error
      : payload.error.message || "FlightLog API error";
    throw new ErrorWithStatus(message, 502);
  }

  const flights = Array.isArray(payload.response) ? payload.response : [];

  return flights
    .map((flight) => ({
      icao24: cleanText(flight.hex),
      callsign: cleanText(flight.flight_icao || flight.flight_iata || flight.reg_number),
      originCountry: cleanText(flight.flag),
      lastContact: parseNumber(flight.updated),
      longitude: parseNumber(flight.lng ?? flight.lon),
      latitude: parseNumber(flight.lat),
      baroAltitudeFt: parseNumber(flight.alt),
      onGround: String(flight.status || "").toLowerCase() === "landed",
      speedKnots: toKnotsFromKmH(flight.speed),
      headingDegrees: parseNumber(flight.dir),
      geoAltitudeFt: parseNumber(flight.alt),
      departureIcao: cleanText(flight.dep_icao),
      arrivalIcao: cleanText(flight.arr_icao)
    }))
    .filter((flight) => Number.isFinite(flight.latitude) && Number.isFinite(flight.longitude));
}

function enrichFlight(flight, user) {
  const distanceMiles = haversineMiles(user.lat, user.lon, flight.latitude, flight.longitude);
  const bearingToUser = bearingDegrees(flight.latitude, flight.longitude, user.lat, user.lon);
  const headingDegrees = Number.isFinite(flight.headingDegrees) ? normalizeDegrees(flight.headingDegrees) : null;

  const headingDelta = Number.isFinite(headingDegrees)
    ? degreeDifference(headingDegrees, bearingToUser)
    : null;

  const approachingUser = Number.isFinite(headingDelta) ? headingDelta <= 35 : false;
  const altitudeFt = Number.isFinite(flight.geoAltitudeFt) ? flight.geoAltitudeFt : flight.baroAltitudeFt;
  const speedKnots = Number.isFinite(flight.speedKnots) ? flight.speedKnots : null;
  const speedMph = Number.isFinite(speedKnots) ? speedKnots * 1.15078 : null;

  const estimatedOverheadMinutes = (approachingUser && Number.isFinite(speedMph) && speedMph > 60)
    ? (distanceMiles / speedMph) * 60
    : null;

  const overheadScore = scoreFlight({
    distanceMiles,
    altitudeFt,
    approachingUser,
    headingDelta,
    speedKnots
  });

  return {
    ...flight,
    distanceMiles,
    headingDegrees,
    altitudeFt,
    speedKnots,
    approachingUser,
    estimatedOverheadMinutes,
    overheadScore,
    overheadLikelihood: scoreToBand(overheadScore),
    secondsSinceSeen: Number.isFinite(flight.lastContact)
      ? Math.max(0, user.nowSeconds - flight.lastContact)
      : null
  };
}

function scoreFlight(input) {
  let score = 0;

  if (input.distanceMiles <= 3) score += 45;
  else if (input.distanceMiles <= 7) score += 35;
  else if (input.distanceMiles <= 15) score += 24;
  else score += 12;

  if (input.approachingUser) score += 28;
  else if (Number.isFinite(input.headingDelta) && input.headingDelta <= 70) score += 12;

  if (Number.isFinite(input.altitudeFt)) {
    if (input.altitudeFt >= 1500 && input.altitudeFt <= 18000) score += 16;
    else if (input.altitudeFt > 42000) score -= 8;
    else if (input.altitudeFt < 800) score -= 14;
  }

  if (Number.isFinite(input.speedKnots)) {
    if (input.speedKnots >= 220) score += 10;
    else if (input.speedKnots < 80) score -= 8;
  }

  return clamp(Math.round(score), 0, 100);
}

function scoreToBand(score) {
  if (score >= 72) return "high";
  if (score >= 48) return "medium";
  return "low";
}

function getBoundingBox(lat, lon, radiusMiles) {
  const latDelta = radiansToDegrees(radiusMiles / EARTH_RADIUS_MILES);
  const safeCos = Math.max(Math.cos(degreesToRadians(lat)), 0.01);
  const lonDelta = radiansToDegrees(radiusMiles / (EARTH_RADIUS_MILES * safeCos));

  return {
    south: clamp(lat - latDelta, -89.99, 89.99),
    north: clamp(lat + latDelta, -89.99, 89.99),
    west: clamp(lon - lonDelta, -179.99, 179.99),
    east: clamp(lon + lonDelta, -179.99, 179.99)
  };
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

function bearingDegrees(lat1, lon1, lat2, lon2) {
  const y = Math.sin(degreesToRadians(lon2 - lon1)) * Math.cos(degreesToRadians(lat2));
  const x =
    Math.cos(degreesToRadians(lat1)) * Math.sin(degreesToRadians(lat2)) -
    Math.sin(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.cos(degreesToRadians(lon2 - lon1));

  const degrees = radiansToDegrees(Math.atan2(y, x));
  return normalizeDegrees(degrees);
}

function degreeDifference(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return diff > 180 ? 360 - diff : diff;
}

function toFeet(valueInMeters) {
  const meters = parseNumber(valueInMeters);
  return Number.isFinite(meters) ? meters * METERS_TO_FEET : null;
}

function toKnots(valueInMetersPerSecond) {
  const speed = parseNumber(valueInMetersPerSecond);
  return Number.isFinite(speed) ? speed * MPS_TO_KNOTS : null;
}

function toKnotsFromKmH(valueInKmH) {
  const speed = parseNumber(valueInKmH);
  if (!Number.isFinite(speed)) {
    return null;
  }
  const metersPerSecond = speed / 3.6;
  return metersPerSecond * MPS_TO_KNOTS;
}

function parseNumber(value, fallback = null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function cleanText(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function isLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value) {
  return (value * 180) / Math.PI;
}

function roundOrNull(value, decimals) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function respond(context, status, body) {
  context.res = {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body
  };
}

class ErrorWithStatus extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
