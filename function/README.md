# Flight Overhead Timer Function (Python)

This folder is a standalone Azure Functions app with one timer-triggered function:

- Function name: `flight_overhead_timer`
- Trigger: every 15 minutes (`0 */15 * * * *`)
- Mail provider: Mailgun
- From: `flighttracker@tomgorbett.com`
- To: `willschaef12@gmail.com`
- Target location: `41.37249516431758, -81.66006046439117`

## What It Does

On each run, the function:

1. Pulls live flight states (OpenSky by default, FlightLog/Airlabs optional).
2. Filters out on-ground flights and out-of-range altitudes.
3. Projects each aircraft position/heading/speed forward to determine whether it can enter a 25-mile visible radius in the next 15 minutes.
4. Sends a summary email through Mailgun.

## Required Setting

Set this in Azure Function App -> Configuration -> Application settings:

- `MAILGUN_API_KEY`

## Optional Settings

- `FLIGHT_PROVIDER=opensky` (default) or `flightlog`
- `FLIGHTLOG_API_KEY` (required only if `FLIGHT_PROVIDER=flightlog`)
- `FLIGHTLOG_API_URL` (defaults to `https://airlabs.co/api/v9/flights`)

## Local Run

1. Copy `local.settings.sample.json` to `local.settings.json`.
2. Put your real `MAILGUN_API_KEY` in `local.settings.json`.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start Functions host from this `function/` directory:

```bash
func start
```
