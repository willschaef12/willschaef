# Card & Comic Value Estimator (Azure Static Web App)

This Static Web App helps collectors get a quick market-value estimate for comic books and trading cards. The frontend walks a user through a short wizard to capture item details, then the `/api/last-sold` Azure Function asks OpenAI (gpt-4o-mini) for a structured price estimate.

## How it works

- **Frontend (`index.html`)** – A single-page wizard that gathers details (category, grading, issue/player, etc.), composes a query, and POSTs it to `/api/last-sold`.
- **Azure Function (`api/last-sold`)** – Validates the request, builds a collectibles context prompt, and calls OpenAI’s chat completions API to produce JSON with title, price, currency, soldDate, source, optional notes/url.
- **CI/CD** – `.github/workflows/azure-static-web-apps-*.yml` deploys both the static front-end and `api` folder to Azure Static Web Apps.

## Configure in Azure

1. Deploy this repo as an Azure Static Web App.
2. In the Static Web App → Configuration → Application settings, add `OPENAI_API_KEY` with your OpenAI API key (gpt-4o-mini access).
3. Save & restart the app (or trigger a redeploy) so the Functions runtime picks up the setting.

## Local testing

If you run locally with the Static Web Apps CLI or Azure Functions Core Tools, set the key before starting Functions:

- PowerShell: `setx OPENAI_API_KEY "<your_key>"`
- bash/zsh: `export OPENAI_API_KEY="<your_key>"`

Then test the endpoint:

```bash
curl -X POST http://localhost:7071/api/last-sold ^
  -H "Content-Type: application/json" ^
  -d "{ \"query\": \"Invincible #1 CGC 9.8\", \"category\": \"comics\", \"graded\": true }"
```

## Notes

- All pricing logic now lives in `api/last-sold`; there are no other Functions in the app.
- The frontend no longer uses demo/fake data. If the Function errors, the UI surfaces the message coming back from `/api/last-sold`.
- Keep secrets out of source control—`OPENAI_API_KEY` must only live in Azure settings or your local dev environment variables.
