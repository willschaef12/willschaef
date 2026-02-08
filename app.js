const lookupForm = document.getElementById("lookup-form");
const latInput = document.getElementById("lat");
const lonInput = document.getElementById("lon");
const radiusInput = document.getElementById("radius");
const radiusValue = document.getElementById("radius-value");
const minAltitudeInput = document.getElementById("min-altitude");
const maxAltitudeInput = document.getElementById("max-altitude");
const maxResultsInput = document.getElementById("max-results");
const locateBtn = document.getElementById("locate-btn");
const lookupBtn = document.getElementById("lookup-btn");
const messageEl = document.getElementById("message");
const flightList = document.getElementById("flight-list");
const lastUpdatedEl = document.getElementById("last-updated");
const template = document.getElementById("flight-template");
const isFileProtocol = window.location.protocol === "file:";

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit"
});

radiusValue.textContent = `${radiusInput.value} mi`;

radiusInput.addEventListener("input", () => {
  radiusValue.textContent = `${radiusInput.value} mi`;
});

locateBtn.addEventListener("click", async () => {
  if (!("geolocation" in navigator)) {
    setMessage("This browser does not support geolocation.", "error");
    return;
  }

  setLoading(true, "Getting your location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      latInput.value = position.coords.latitude.toFixed(5);
      lonInput.value = position.coords.longitude.toFixed(5);
      setLoading(false);
      setMessage("Location loaded. Run lookup to fetch nearby flights.", "ok");
    },
    (error) => {
      setLoading(false);
      setMessage(`Could not access location: ${error.message}`, "error");
    },
    {
      timeout: 10000,
      maximumAge: 30000,
      enableHighAccuracy: true
    }
  );
});

lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isFileProtocol) {
    setMessage(
      "This page was opened with file://. Run it from HTTP (example: npx --yes @azure/static-web-apps-cli start . --api-location api --port 4280).",
      "error"
    );
    return;
  }

  const query = buildQuery();
  if (!query.ok) {
    setMessage(query.error, "error");
    return;
  }

  await fetchFlights(query.value);
});

function buildQuery() {
  const latRaw = String(latInput.value).trim();
  const lonRaw = String(lonInput.value).trim();

  if (!latRaw || !lonRaw) {
    return { ok: false, error: "Latitude and longitude are required." };
  }

  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  const radiusMiles = Number(radiusInput.value);
  const minAltitudeFt = Number(minAltitudeInput.value);
  const maxAltitudeFt = Number(maxAltitudeInput.value);
  const maxResults = Number(maxResultsInput.value);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: "Latitude must be between -90 and 90." };
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { ok: false, error: "Longitude must be between -180 and 180." };
  }

  if (!Number.isFinite(radiusMiles) || radiusMiles < 5 || radiusMiles > 120) {
    return { ok: false, error: "Radius must be between 5 and 120 miles." };
  }

  if (!Number.isFinite(minAltitudeFt) || !Number.isFinite(maxAltitudeFt)) {
    return { ok: false, error: "Altitude filters must be numeric." };
  }

  if (minAltitudeFt < 0 || maxAltitudeFt <= minAltitudeFt) {
    return { ok: false, error: "Max altitude must be greater than min altitude." };
  }

  if (!Number.isFinite(maxResults) || maxResults < 5 || maxResults > 100) {
    return { ok: false, error: "Max flights must be between 5 and 100." };
  }

  return {
    ok: true,
    value: {
      lat,
      lon,
      radiusMiles,
      minAltitudeFt,
      maxAltitudeFt,
      maxResults
    }
  };
}

async function fetchFlights(query) {
  setLoading(true, "Fetching live flights...");
  flightList.innerHTML = "";

  const params = new URLSearchParams({
    lat: query.lat.toString(),
    lon: query.lon.toString(),
    radiusMiles: query.radiusMiles.toString(),
    minAltitudeFt: query.minAltitudeFt.toString(),
    maxAltitudeFt: query.maxAltitudeFt.toString(),
    maxResults: query.maxResults.toString()
  });

  try {
    const response = await fetch(`/api/overhead-flights?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Lookup request failed.");
    }

    renderFlights(payload.flights || []);
    lastUpdatedEl.textContent = `Updated ${timeFormatter.format(new Date())} (${payload.provider})`;

    if ((payload.flights || []).length === 0) {
      if (Math.abs(query.lat) < 0.25 && Math.abs(query.lon) < 0.25) {
        setMessage(
          "No flights near 0,0. Try Use My Location or set coordinates near a city/airport.",
          "warn"
        );
      } else {
        setMessage("No matching flights found for this area and filter window.", "warn");
      }
    } else {
      setMessage(`Showing ${payload.flights.length} possible overhead flights.`, "ok");
    }
  } catch (error) {
    setMessage(error.message || "Unable to fetch flights right now.", "error");
  } finally {
    setLoading(false);
  }
}

function renderFlights(flights) {
  if (!Array.isArray(flights) || flights.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const flight of flights) {
    const node = template.content.firstElementChild.cloneNode(true);
    const name = [flight.callsign, flight.icao24].filter(Boolean).join(" ").trim() || "Unknown Flight";

    node.querySelector('[data-flight="name"]').textContent = name;
    node.querySelector('[data-flight="route"]').textContent = buildRouteText(flight);

    const likelihood = node.querySelector('[data-flight="likelihood"]');
    likelihood.textContent = `${flight.overheadLikelihood || "low"} chance`;
    likelihood.classList.add((flight.overheadLikelihood || "low").toLowerCase());

    node.querySelector('[data-flight="distance"]').textContent = formatDistance(flight.distanceMiles);
    node.querySelector('[data-flight="altitude"]').textContent = formatAltitude(flight.altitudeFt);
    node.querySelector('[data-flight="speed"]').textContent = formatSpeed(flight.speedKnots);
    node.querySelector('[data-flight="heading"]').textContent = formatHeading(flight.headingDegrees);
    node.querySelector('[data-flight="meta"]').textContent = buildMetaText(flight);

    fragment.appendChild(node);
  }

  flightList.appendChild(fragment);
}

function buildRouteText(flight) {
  const route = [flight.departureIcao, flight.arrivalIcao].filter(Boolean).join(" -> ");
  if (route) {
    return route;
  }

  if (flight.originCountry) {
    return `Origin country: ${flight.originCountry}`;
  }

  return "Route unavailable";
}

function buildMetaText(flight) {
  const toward = flight.approachingUser ? "Approaching your location" : "Not clearly approaching";
  const eta = Number.isFinite(flight.estimatedOverheadMinutes)
    ? `ETA about ${numberFormatter.format(flight.estimatedOverheadMinutes)} min`
    : "No ETA";
  return `${toward}. ${eta}. Source age: ${formatAge(flight.secondsSinceSeen)}.`;
}

function formatDistance(value) {
  return Number.isFinite(value) ? `${numberFormatter.format(value)} mi` : "Unknown";
}

function formatAltitude(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()} ft` : "Unknown";
}

function formatSpeed(value) {
  return Number.isFinite(value) ? `${Math.round(value)} kt` : "Unknown";
}

function formatHeading(value) {
  return Number.isFinite(value) ? `${Math.round(value)} deg` : "Unknown";
}

function formatAge(value) {
  if (!Number.isFinite(value)) {
    return "unknown";
  }

  if (value < 60) {
    return `${Math.round(value)}s`;
  }

  return `${Math.round(value / 60)}m`;
}

function setMessage(text, tone = "") {
  messageEl.textContent = text;
  messageEl.className = "message";
  if (tone) {
    messageEl.classList.add(tone);
  }
}

function setLoading(isLoading, loadingText = "") {
  lookupBtn.disabled = isLoading;
  locateBtn.disabled = isLoading;
  lookupBtn.textContent = isLoading ? "Loading..." : "Check Overhead Flights";

  if (isLoading && loadingText) {
    setMessage(loadingText);
  }
}

if (isFileProtocol) {
  setMessage(
    "Open this site over HTTP, not as a file. Use: npx --yes @azure/static-web-apps-cli start . --api-location api --port 4280",
    "warn"
  );
}
