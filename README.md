# RealPrice

RealPrice is a polished full-stack Next.js MVP that helps shoppers decide whether a product listing is a great deal, a fair price, or overpriced. Users can paste a product name or product URL into the app, get a verdict, review a mock price history chart, inspect a fake-sale detector, and save a starter price alert.

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS
- Route handlers for the analysis backend
- Deterministic mock pricing logic designed to be replaced by real APIs later

## What the app includes

- Premium landing page with hero, features, pricing, FAQ, and footer
- Main analysis page with:
  - product name or URL input
  - polished loading and error states
  - verdict, recommendation, and deal score
  - current price, fair price, recent average, and recent low
  - price history chart
  - fake-sale detector section
  - price alert modal
  - recently checked products
  - trending deals
  - popular categories
- Mock-backed API route at `POST /api/analyze`
- Clean logic layer for fair-price estimation and verdict generation

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Project structure

```text
app/
  analyze/page.tsx              Main app route
  api/analyze/route.ts          Product analysis endpoint
  globals.css                   Global theme and utilities
  layout.tsx                    Root layout and metadata
  page.tsx                      Landing page
components/
  analyze/                      Analysis UI, chart, alert modal, lists
  marketing/                    Landing page sections
  ui/                           Shared UI primitives
lib/realprice/
  analysis.ts                   Product parsing and verdict logic
  mock-data.ts                  Shared exports for app seed data
  types.ts                      Shared types
  utils.ts                      Formatting and seeded randomness helpers
scripts/
  prepare-standalone.mjs        Copies static assets for standalone builds
```

## How the mock analysis works

1. The app accepts a product name or URL.
2. The analysis layer extracts a likely product title, merchant, and category.
3. It matches known product profiles when available, otherwise falls back to category heuristics.
4. It generates a deterministic recent price history, current price, fair-price estimate, and recent low.
5. It assigns:
   - verdict: `Great Deal`, `Fair Price`, or `Overpriced`
   - recommendation: `Buy Now`, `Watch`, or `Wait`
   - fake-sale detector output based on claimed markdown versus modeled market discount

Because the data is deterministic, the same input produces the same result locally, which makes the MVP feel stable while keeping the backend simple.

## Extending it later

- Replace the mock logic in `lib/realprice/analysis.ts` with retailer APIs or scraping results.
- Persist alerts and history in a database.
- Add account auth and saved watchlists.
- Pull real time-series pricing from external providers.
