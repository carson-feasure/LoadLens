# LoadLens

LoadLens is a responsive React/TypeScript prototype for exploring how illustrative course workloads overlap across a 15-week semester. It also supports server-side syllabus parsing into structured course and week data. It is not a USC system: no catalog, registration, requirement, student-report, or forecast-accuracy claims are made.

## Live class demo

[Open LoadLens on GitHub Pages](https://carson-feasure.github.io/LoadLens/). Every push to `main` runs the unit suite, creates the production build, and deploys it through the workflow in `.github/workflows/deploy-pages.yml`.

The existing GitHub Pages deployment is static, so it cannot securely hold an OpenAI API key and does not run the syllabus parser. The complete app must be hosted with the included Node server for that feature to work. The rest of the planner remains usable on the static demo.

## Run in PyCharm

Open `app/` in PyCharm or open its terminal from the handoff root:

```powershell
cd app
npm install
npm run dev
```

To enable syllabus parsing, copy `.env.example` to `.env` and put a server-side OpenAI API key in it before starting the app:

```powershell
Copy-Item .env.example .env
# Edit .env and set OPENAI_API_KEY. Never commit .env.
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
npm run preview    Serve the production bundle and API on port 4173
npm run start      Same production server as preview
npm run lint       ESLint
npm run typecheck  TypeScript project check
npm run test:run   Vitest domain and reducer tests
npm run test:e2e   Playwright flows and target screenshots
npm run package:email  Build the offline site and complete source package
```

## Email-friendly offline package

Run `npm run package:email` to create `deliverables/LoadLens-Email-Package/`. The folder contains `Open LoadLens.html`, a self-contained offline site that opens directly in a current browser, plus `source/` with the complete application source, tests, documentation, and package lock. Zip that folder for email; recipients do not need Node or npm unless they want to modify the source.

## Seeded demo and reset

Overview is the default landing page and the first primary navigation tab. Build is the second and only other primary tab; the comparison workflow remains available from Overview's **Compare a change** action.

The production UI reads `src/data/demo-data.json`, derived from the canonical synthetic fixture and expanded to 16 illustrative catalog options for the clarity pass. Every course includes a 15-week base series and demo-labeled interest tags. `src/test/expected-metrics.json` is test-only and independently checks the original Plan A/Plan B calculations; it is never read by production rendering.

On a course's **Syllabus** tab, **Upload Syllabus** accepts PDF, DOC/DOCX, RTF, ODT, TXT, and Markdown files up to 20 MB. The Node endpoint sends the file directly to the OpenAI Responses API, defaults to the efficient `gpt-6-luna` model, and requests strict JSON for course metadata, course matching, week-by-week topics/readings/assignments, grading, policies, and extraction warnings. Uploaded bytes are held in memory only for the request; LoadLens stores the parsed JSON and file metadata in browser storage, not the original document. Replace/remove controls are scoped to the open course.

Planner state is stored under the single browser key `loadlens.demo.v1`. Build edits remain a draft until **Analyze my workload**. Adjust edits remain a scenario until **Use new schedule**. Parsed syllabus JSON is also stored under this app-owned record. The avatar/menu action **Reset demo** asks for confirmation and resets only LoadLens's local plan, preferences, comparison, uploaded syllabus results, and study records.

The default Plan A has 16 units, a 23-hrs Week 7 peak, 240 modeled semester study hrs, and three weeks above the 20-hrs/week limit. The prepared Plan B stays at 16 units while changing the peak to 17 hrs and the overload count to zero. Added catalog choices do not change either prepared plan’s arithmetic.

## Code map

- `src/domain/`: fixture validation, date-only helpers, workload aggregation, search, and comparisons.
- `src/state/`: reducer, current/draft/scenario separation, hydration recovery, and local persistence.
- `src/components/`: shell, dialogs, course controls, shared cards, breakdowns, and Recharts visualizations.
- `src/pages/`: Build, consolidated Overview, Adjust, course tabs, study flow, and not-found states.
- `src/styles/global.css`: design tokens and mobile-first responsive styling.
- `src/test/`: Vitest fixture and state tests.
- `server/`: same-origin Node server, upload validation, OpenAI Responses API call, and strict JSON Schema.
- `e2e/`: Playwright interaction, responsive, recovery, and screenshot checks.
- `docs/screenshots/`: verified 390×844 and 1440×1000 page captures.

## Troubleshooting

- **`node` is not recognized:** install a compatible Node 20 release through your normal managed setup, reopen PyCharm, and confirm `node --version` and `npm --version`. Do not bypass machine security controls.
- **Port 5173 is busy:** stop the other local process or run `npm run dev -- --port 5174`; use the address Vite prints.
- **Syllabus parsing says it is not configured:** set `OPENAI_API_KEY` in an untracked `.env`, then restart `npm run dev`. Do not use a `VITE_` variable for the key because Vite exposes those values to browser code.
- **Syllabus parsing is unavailable on the static host:** use `npm run dev` locally or deploy the included Node server to a host that supports long-running Node processes and secret environment variables. GitHub Pages alone cannot run this endpoint.
- **Playwright browser is unavailable:** run `npx playwright install chromium` from `app/`, then rerun `npm run test:e2e`. The rest of the app and unit suite do not require browser binaries.
- **Stored state was edited or corrupted:** LoadLens recovers valid IDs and shows a recovery notice. Use **Reset demo** for the exact seeded state.

See [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the walkthrough and [TEST_RESULTS.md](docs/TEST_RESULTS.md) for recorded verification.
