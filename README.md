# Simple Dictionary (Azure Static Web App)

This app gives a very simple, easy-to-understand definition of a word using the OpenAI API. The frontend is a static page and the API key is stored securely in Azure Static Web Apps application settings.

## How it works

- Frontend: `index.html` — a minimal UI to enter a word and display a definition.
- API: `api/define` — an Azure Functions HTTP trigger that calls OpenAI with your key from `OPENAI_API_KEY`.
- CI/CD: GitHub Action deploys to your Azure Static Web App; API folder is wired via `api_location: "api"`.

## Configure in Azure

1. In your Azure Static Web App, open Configuration → Application settings.
2. Add a new setting named `OPENAI_API_KEY` and set it to your OpenAI API key.
3. Save and restart the app (or redeploy).

## Local testing (optional)

If you run locally with the Static Web Apps CLI or Azure Functions Core Tools, set an environment variable before starting the API:

- Windows PowerShell: `setx OPENAI_API_KEY "<your_key>"`
- macOS/Linux: `export OPENAI_API_KEY="<your_key>"`

Then fetch: `GET /api/define?word=example`

## Notes

- The API uses the `gpt-4o-mini` chat completions endpoint with a very constrained prompt to keep definitions short and simple.
- The frontend calls the API at `/api/define`, so no CORS is needed.
- Keep the key only in app settings; never hardcode secrets in the repo.
