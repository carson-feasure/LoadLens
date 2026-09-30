# LoadLens

LoadLens is a responsive React/TypeScript prototype for exploring how illustrative course workloads overlap across a 15-week semester. It is a local demo, not a USC system: no catalog, registration, requirement, student-report, or forecast-accuracy claims are made.

## Live class demo

[Open LoadLens on GitHub Pages](https://carson-feasure.github.io/LoadLens/). Every push to `main` runs the unit suite, creates the production build, and deploys it through the workflow in `.github/workflows/deploy-pages.yml`.

## Run in PyCharm

Open `app/` in PyCharm or open its terminal from the handoff root:

```powershell
cd app
npm install
npm run dev
```

The verified development address is `http://127.0.0.1:5173`. This build was verified with Node `20.10.0` and npm `10.2.3`. The pinned Vite 6 toolchain supports that installed Node version.

For browser tests on a new machine, install Playwright's project browser once:

```powershell
npx playwright install chromium
```

## Scripts

```text
npm run dev        Local Vite server
npm run build      Typecheck and production bundle
npm run preview    Preview the production bundle on port 4173
npm run lint       ESLint
npm run typecheck  TypeScript project check
npm run test:run   Vitest domain and reducer tests
npm run test:e2e   Playwright flows and target screenshots
npm run package:email  Build the offline site and complete source package
```

## Email-friendly offline package

Run `npm run package:email` to create `deliverables/LoadLens-Email-Package/`. The folder contains `Open LoadLens.html`, a self-contained offline site that opens directly in a current browser, plus `source/` with the complete application source, tests, documentation, and package lock. Zip that folder for email; recipients do not need Node or npm unless they want to modify the source.

## Seeded demo and reset

The production UI reads `src/data/demo-data.json`, copied unchanged from the canonical parent fixture. `src/test/expected-metrics.json` is test-only and independently checks the calculations; it is never read by production rendering.

Planner state is stored under the single browser key `loadlens.demo.v1`. Build edits remain a draft until **Analyze my workload**. Adjust edits remain a scenario until **Use new schedule**. The avatar/menu action **Reset demo** asks for confirmation and resets only LoadLens's local plan, preferences, comparison, and study records.

The default Plan A has 16 units, a 23-hour Week 7 peak, 240 modeled semester study hours, and three weeks above the 20-hour limit. The prepared Plan B stays at 16 units while changing the peak to 17 hours and the overload count to zero.

## Code map

- `src/domain/`: fixture validation, date-only helpers, workload aggregation, search, and comparisons.
- `src/state/`: reducer, current/draft/scenario separation, hydration recovery, and local persistence.
- `src/components/`: shell, dialogs, course controls, shared cards, breakdowns, and Recharts visualizations.
- `src/pages/`: Dashboard, Build, Overview, Adjust, course tabs, study flow, and not-found states.
- `src/styles/global.css`: design tokens and mobile-first responsive styling.
- `src/test/`: Vitest fixture and state tests.
- `e2e/`: Playwright interaction, responsive, recovery, and screenshot checks.
- `docs/screenshots/`: verified 390×844 and 1440×1000 page captures.

## Troubleshooting

- **`node` is not recognized:** install a compatible Node 20 release through your normal managed setup, reopen PyCharm, and confirm `node --version` and `npm --version`. Do not bypass machine security controls.
- **Port 5173 is busy:** stop the other local process or run `npm run dev -- --port 5174`; use the address Vite prints.
- **Playwright browser is unavailable:** run `npx playwright install chromium` from `app/`, then rerun `npm run test:e2e`. The rest of the app and unit suite do not require browser binaries.
- **Stored state was edited or corrupted:** LoadLens recovers valid IDs and shows a recovery notice. Use **Reset demo** for the exact seeded state.

See [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the walkthrough and [TEST_RESULTS.md](docs/TEST_RESULTS.md) for recorded verification.
