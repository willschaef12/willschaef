# Overhead Flight Finder (Azure Static Web App)

This repo now contains a new website focused on live overhead-flight lookup.

- Frontend: `index.html`, `styles.css`, `app.js`
- API: `api/overhead-flights` (Azure Function)
- Timer API: `api/overhead-alert-timer` (runs every 10 minutes)
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

## Timer Overhead Check (Every 10 Minutes)

The function `api/overhead-alert-timer` runs on this CRON schedule:

- `0 */10 * * * *` (every 10 minutes)

It checks flights around your hardcoded home location and logs candidate flights that could pass overhead in the next 10 minutes.

### Hardcode Your Location

Edit these constants in `api/overhead-alert-timer/index.js`:

- `HOUSE_LAT`
- `HOUSE_LON`

### Optional Settings (Azure App Settings / local.settings.json)

- `OVERHEAD_ALERT_RADIUS_MILES` (default `90`)
- `OVERHEAD_ALERT_LOOKAHEAD_MINUTES` (default `10`)
- `OVERHEAD_ALERT_MAX_RESULTS` (default `10`)
- `OVERHEAD_ALERT_WEBHOOK_URL` (optional; if set, posts JSON when matches are found)

### Mailgun Email Alerts (Optional)

If Mailgun settings are present, the timer sends an email when candidates are found:

- `MAILGUN_API_KEY` (private API key; starts with `key-...`)
- `MAILGUN_DOMAIN` (your Mailgun sending domain, e.g. `mg.yourdomain.com`)
- `MAILGUN_FROM` (sender, e.g. `Flight Alert <alerts@mg.yourdomain.com>`)
- `MAILGUN_TO` (comma- or semicolon-separated recipients)
- `MAILGUN_REGION` (`US` default, or `EU`)
- `MAILGUN_API_BASE_URL` (optional override; otherwise region is used)

If you are using a Mailgun sandbox domain, recipient addresses must be authorized in Mailgun first.

Provider settings are shared with the existing function:

- `FLIGHT_PROVIDER=opensky` (default) or `flightlog`
- `FLIGHTLOG_API_KEY` and optional `FLIGHTLOG_API_URL` when using `flightlog`

## Notes

- Results are scored as `high`, `medium`, or `low` likelihood using distance, heading, altitude, and speed.
- API responses are non-cached (`Cache-Control: no-store`).
