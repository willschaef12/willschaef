# Overhead Flight Finder (Azure Static Web App)

This repo now contains a new website focused on live overhead-flight lookup.

- Frontend: `index.html`, `styles.css`, `app.js`
- API: `api/overhead-flights` (Azure Function)
- Pipeline: `.github/workflows/azure-static-web-apps-thankful-desert-0b66c4910.yml` (kept as requested)

The app takes coordinates, radius, and altitude filters, then calls `/api/overhead-flights` to return aircraft that are likely to pass overhead.

## Flight Data Provider

By default, the API uses OpenSky Network (no key required):

- `FLIGHT_PROVIDER=opensky` (default)

If you want to use a FlightLog-style provider (Airlabs-compatible), configure:

- `FLIGHT_PROVIDER=flightlog`
- `FLIGHTLOG_API_KEY=<your_api_key>`
- Optional: `FLIGHTLOG_API_URL=https://airlabs.co/api/v9/flights`

## Deploy / Configure in Azure

1. Keep using the existing Static Web App GitHub workflow in `.github/workflows`.
2. In Azure Static Web App -> Configuration -> Application settings, add provider settings if needed.
3. Redeploy or push a commit.

## Local Run (Recommended)

Do not open `index.html` directly with `file://`, because `/api/...` calls will fail in the browser.

Run the app through HTTP with the SWA CLI:

```bash
npx --yes @azure/static-web-apps-cli start . --api-location api --port 4280
```

Then open:

- `http://localhost:4280`
- Use `Use My Location` in the UI (or edit coords). Empty coordinate boxes should not be left blank.

If you see `Unable to find project root. Expecting to find one of host.json, local.settings.json in project root`, make sure `api/host.json` exists and you started SWA from the repo root.

## Local API Test

Example request:

```bash
curl "http://localhost:7071/api/overhead-flights?lat=34.0522&lon=-118.2437&radiusMiles=25&minAltitudeFt=1500&maxAltitudeFt=45000&maxResults=25"
```

## Notes

- Results are scored as `high`, `medium`, or `low` likelihood using distance, heading, altitude, and speed.
- API responses are non-cached (`Cache-Control: no-store`).
