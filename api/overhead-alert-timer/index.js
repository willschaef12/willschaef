const EARTH_RADIUS_MILES = 3958.7613;
const METERS_TO_FEET = 3.28084;
const MPS_TO_KNOTS = 1.943844;

// Hardcode your home coordinates here.
const HOUSE_LAT = 34.0522;
const HOUSE_LON = -118.2437;

const DEFAULT_RADIUS_MILES = 90;
const DEFAULT_LOOKAHEAD_MINUTES = 10;
const DEFAULT_MAX_CANDIDATES = 10;
const MAILGUN_US_API_BASE = "https://api.mailgun.net";
const MAILGUN_EU_API_BASE = "https://api.eu.mailgun.net";

module.exports = async function (context, myTimer) {
  const startedAt = new Date().toISOString();

  if (!isLatitude(HOUSE_LAT) || !isLongitude(HOUSE_LON)) {
    context.log.error("Invalid hardcoded HOUSE_LAT/HOUSE_LON in overhead-alert-timer.");
    return;
  }

  const radiusMiles = clamp(
    parseNumber(process.env.OVERHEAD_ALERT_RADIUS_MILES, DEFAULT_RADIUS_MILES),
    5,
    200
  );
  const lookaheadMinutes = clamp(
    parseNumber(process.env.OVERHEAD_ALERT_LOOKAHEAD_MINUTES, DEFAULT_LOOKAHEAD_MINUTES),
    1,
    60
  );
  const maxCandidates = clamp(
    Math.round(parseNumber(process.env.OVERHEAD_ALERT_MAX_RESULTS, DEFAULT_MAX_CANDIDATES)),
    1,
    50
  );

  const provider = normalizeProvider(process.env.FLIGHT_PROVIDER);
  const box = getBoundingBox(HOUSE_LAT, HOUSE_LON, radiusMiles);

  context.log(
    `[overhead-alert-timer] Tick ${startedAt}; provider=${provider}; lat=${HOUSE_LAT}; lon=${HOUSE_LON}; radius=${radiusMiles}mi; lookahead=${lookaheadMinutes}m`
  );

  try {
    const flights = provider === "flightlog"
      ? await fetchFlightlogFlights(box)
      : await fetchOpenSkyFlights(box);

    const candidates = flights
      .map((flight) => enrichFlightForOverheadCheck(flight, { lat: HOUSE_LAT, lon: HOUSE_LON }))
      .filter((flight) => !flight.onGround)
      .filter((flight) => flight.approachingUser)
      .filter((flight) => Number.isFinite(flight.estimatedOverheadMinutes))
      .filter((flight) => flight.estimatedOverheadMinutes >= 0 && flight.estimatedOverheadMinutes <= lookaheadMinutes)
      .sort((a, b) => a.estimatedOverheadMinutes - b.estimatedOverheadMinutes)
      .slice(0, maxCandidates);

    if (!candidates.length) {
      context.log(
        `[overhead-alert-timer] No likely overhead flights in next ${lookaheadMinutes} minute(s).`
      );
      return;
    }

    context.log.warn(
      `[overhead-alert-timer] ${candidates.length} candidate flight(s) could pass overhead in next ${lookaheadMinutes} minute(s).`
    );

    for (const flight of candidates) {
      const callsign = flight.callsign || flight.icao24 || "Unknown";
      const eta = roundOrNull(flight.estimatedOverheadMinutes, 1);
      const distance = roundOrNull(flight.distanceMiles, 1);
      const altitude = roundOrNull(flight.altitudeFt, 0);
      const speed = roundOrNull(flight.speedKnots, 0);

      context.log.warn(
        `[overhead-alert-timer] ${callsign} ETA=${eta}m distance=${distance}mi altitude=${altitude}ft speed=${speed}kt headingDelta=${roundOrNull(flight.headingDelta, 0)}deg`
      );
    }

    const webhookUrl = cleanText(process.env.OVERHEAD_ALERT_WEBHOOK_URL);
    if (webhookUrl) {
      await postWebhook(webhookUrl, {
        event: "overhead_flights_detected",
        detectedAt: startedAt,
        house: { lat: HOUSE_LAT, lon: HOUSE_LON },
        provider,
        lookaheadMinutes,
        radiusMiles,
        candidates: candidates.map((flight) => ({
          callsign: flight.callsign,
          icao24: flight.icao24,
          distanceMiles: roundOrNull(flight.distanceMiles, 2),
          altitudeFt: roundOrNull(flight.altitudeFt, 0),
          speedKnots: roundOrNull(flight.speedKnots, 0),
          estimatedOverheadMinutes: roundOrNull(flight.estimatedOverheadMinutes, 1)
        }))
      });
      context.log("[overhead-alert-timer] Alert payload posted to OVERHEAD_ALERT_WEBHOOK_URL.");
    }

    const mailgunConfig = getMailgunConfigFromEnv();
    if (mailgunConfig?.error) {
      context.log.error(`[overhead-alert-timer] ${mailgunConfig.error}`);
    } else if (mailgunConfig) {
      await sendMailgunAlert(mailgunConfig, {
        detectedAt: startedAt,
        house: { lat: HOUSE_LAT, lon: HOUSE_LON },
        provider,
        lookaheadMinutes,
        radiusMiles,
        candidates
      });
      context.log("[overhead-alert-timer] Alert email sent through Mailgun.");
    }
  } catch (error) {
    context.log.error("[overhead-alert-timer] Check failed:", error?.message || error);
    throw error;
  }
};

async function postWebhook(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed (${response.status}).`);
  }
}

function getMailgunConfigFromEnv() {
  const apiKey = cleanText(process.env.MAILGUN_API_KEY || process.env.MAILGUN_PRIVATE_API_KEY);
  const domain = cleanText(process.env.MAILGUN_DOMAIN);
  const from = cleanText(process.env.MAILGUN_FROM);
  const toRaw = cleanText(process.env.MAILGUN_TO);

  if (!apiKey && !domain && !from && !toRaw) {
    return null;
  }

  const recipients = String(toRaw || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const missing = [];
  if (!apiKey) missing.push("MAILGUN_API_KEY");
  if (!domain) missing.push("MAILGUN_DOMAIN");
  if (!from) missing.push("MAILGUN_FROM");
  if (!recipients.length) missing.push("MAILGUN_TO");

  if (missing.length) {
    return { error: `Mailgun is partially configured. Missing: ${missing.join(", ")}` };
  }

  const baseUrlSetting = cleanText(process.env.MAILGUN_API_BASE_URL);
  const region = String(process.env.MAILGUN_REGION || "US").trim().toUpperCase();
  const baseUrl = baseUrlSetting || (region === "EU" ? MAILGUN_EU_API_BASE : MAILGUN_US_API_BASE);

  return {
    apiKey,
    domain,
    from,
    recipients,
    baseUrl
  };
}

async function sendMailgunAlert(config, payload) {
  const url = `${config.baseUrl}/v3/${config.domain}/messages`;
  const subject = `Overhead Alert: ${payload.candidates.length} flight(s) within ${payload.lookaheadMinutes}m`;
  const textBody = buildAlertText(payload);

  const form = new URLSearchParams();
  form.set("from", config.from);
  form.set("to", config.recipients.join(","));
  form.set("subject", subject);
  form.set("text", textBody);

  const authToken = Buffer.from(`api:${config.apiKey}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mailgun request failed (${response.status}): ${body}`);
  }
}

function buildAlertText(payload) {
  const header = [
    "Flights likely overhead soon",
    `Detected at: ${payload.detectedAt}`,
    `Location: ${payload.house.lat}, ${payload.house.lon}`,
    `Provider: ${payload.provider}`,
    `Lookahead: ${payload.lookaheadMinutes} minute(s)`,
    `Radius: ${payload.radiusMiles} mile(s)`,
    "",
    "Candidates:"
  ];

  const rows = payload.candidates.map((flight, idx) => {
    const callsign = flight.callsign || flight.icao24 || "Unknown";
    const eta = roundOrNull(flight.estimatedOverheadMinutes, 1);
    const distance = roundOrNull(flight.distanceMiles, 1);
    const altitude = roundOrNull(flight.altitudeFt, 0);
    const speed = roundOrNull(flight.speedKnots, 0);
    return `${idx + 1}. ${callsign} | ETA ${eta}m | ${distance}mi | ${altitude}ft | ${speed}kt`;
  });

  return header.concat(rows).join("\n");
}

function enrichFlightForOverheadCheck(flight, user) {
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

  const estimatedOverheadMinutes = (approachingUser && Number.isFinite(speedMph) && speedMph > 20)
    ? (distanceMiles / speedMph) * 60
    : null;

  return {
    ...flight,
    distanceMiles,
    headingDegrees,
    headingDelta,
    altitudeFt,
    speedKnots,
    approachingUser,
    estimatedOverheadMinutes
  };
}

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
    throw new Error(`OpenSky lookup failed (${response.status})`);
  }

  const payload = await response.json();
  const states = Array.isArray(payload.states) ? payload.states : [];

  return states
    .map((state) => ({
      icao24: cleanText(state[0]),
      callsign: cleanText(state[1]),
      originCountry: cleanText(state[2]),
      longitude: parseNumber(state[5]),
      latitude: parseNumber(state[6]),
      baroAltitudeFt: toFeet(state[7]),
      onGround: Boolean(state[8]),
      speedKnots: toKnots(state[9]),
      headingDegrees: parseNumber(state[10]),
      geoAltitudeFt: toFeet(state[13])
    }))
    .filter((flight) => Number.isFinite(flight.latitude) && Number.isFinite(flight.longitude));
}

async function fetchFlightlogFlights(box) {
  const apiKey = process.env.FLIGHTLOG_API_KEY || process.env.AIRLABS_API_KEY;
  if (!apiKey) {
    throw new Error("FLIGHTLOG_API_KEY (or AIRLABS_API_KEY) is required when FLIGHT_PROVIDER=flightlog");
  }

  const baseUrl = process.env.FLIGHTLOG_API_URL || "https://airlabs.co/api/v9/flights";
  const bbox = `${box.south.toFixed(5)},${box.west.toFixed(5)},${box.north.toFixed(5)},${box.east.toFixed(5)}`;

  const url = new URL(baseUrl);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("bbox", bbox);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FlightLog lookup failed (${response.status})`);
  }

  const payload = await response.json();
  if (payload.error) {
    const message = typeof payload.error === "string"
      ? payload.error
      : payload.error.message || "FlightLog API error";
    throw new Error(message);
  }

  const flights = Array.isArray(payload.response) ? payload.response : [];

  return flights
    .map((flight) => ({
      icao24: cleanText(flight.hex),
      callsign: cleanText(flight.flight_icao || flight.flight_iata || flight.reg_number),
      longitude: parseNumber(flight.lng ?? flight.lon),
      latitude: parseNumber(flight.lat),
      baroAltitudeFt: parseNumber(flight.alt),
      onGround: String(flight.status || "").toLowerCase() === "landed",
      speedKnots: toKnotsFromKmH(flight.speed),
      headingDegrees: parseNumber(flight.dir),
      geoAltitudeFt: parseNumber(flight.alt)
    }))
    .filter((flight) => Number.isFinite(flight.latitude) && Number.isFinite(flight.longitude));
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
