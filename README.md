# Startup Legal Toolkit — by ilTuoAvvocato.com

A small static website (in Italian) with three free interactive tools for Italian startup founders. It routes
them to a lawyer at [iltuoavvocato.com](https://iltuoavvocato.com):

| Route        | Tool |
|--------------|------|
| `/`          | Home: hero, the three tools, "Perché pensarci subito", the five documents, CTA |
| `/equity/`   | **Calcolatore ripartizione quote**: 2–5 cofounders, 5 weighted factors, optional pool/ESOP, donut and bars, copy/print |
| `/vesting/`  | **Simulatore vesting**: stake, duration, cliff, monthly/quarterly/annual frequency, step chart with a draggable leaver marker, good/bad leaver explanation |
| `/quiz/`     | **Quali documenti mi servono?**: 7 questions, then a personalized checklist from the 5 documents with priority badges |
| `/privacy/`  | Privacy notes (no cookies, no tracking, no data sent anywhere) |
| `/match-investitori/…` | **Match investitori** (prototype, see below): landing, `startup/`, `investitore/`, `doppio-consenso/`, `note-legali/` |
| anything else | Styled 404 |

Every tool page shows the disclaimer *"Strumento indicativo: non sostituisce una consulenza legale."* (next to
the result and in the footer). Every "Parla con un avvocato" CTA links to
`https://iltuoavvocato.com/?utm_source=toolkit&utm_medium=referral&utm_campaign=<home|equity|vesting|quiz|match>`.

## Stack

- Vite 5, React 18, TypeScript (strict), react-router 6 (`BrowserRouter` with `basename = import.meta.env.BASE_URL`)
- Plain CSS with CSS variables (`src/styles/`), no UI kit, no Tailwind
- Hand-rolled SVG charts (donut, vesting step chart). No chart library.
- Self-hosted fonts: Inter, Playfair Display and Playfair Display Italic, subset to Latin and converted to WOFF2 (`font-display: swap`)
- Vitest for unit tests, ESLint 9 (typescript-eslint and react-hooks)
- playwright-core with the system Google Chrome for screenshots and the OG image

No runtime dependencies beyond React and react-router. There are no trackers, no cookies and no localStorage, and the site
makes **no external requests**. Tool state lives in the URL query string, so results can be shared.

## Scripts

```bash
npm install
npm run dev          # dev server
npm run build        # tsc -b → vite build → scripts/prerender.mjs (per-route HTML, 404.html, sitemap.xml, robots.txt)
npm run preview      # serve dist/
npm test             # vitest run (src/lib/*.test.ts)
npm run lint         # eslint, zero warnings allowed
npm run screenshots  # build first; full-page PNGs at 1440×900 and 390×844@2x into screenshots/ (git-ignored)
npm run og           # re-render public/og-image.png from scripts/og-template.html
```

`npm run screenshots` uses Chrome at its default install location (`channel: 'chrome'`). Set
`CHROME_PATH=/path/to/chromium` to use a different binary. The script also fails if it detects console errors,
external requests or horizontal overflow.

Fonts are generated at dev time by `scripts/build-fonts.sh`, which needs Python with `fonttools` and `brotli`. The WOFF2
files in `src/assets/fonts/` are committed, so a normal build needs no Python.

## Environment variables

| Variable    | Default                              | Used for |
|-------------|--------------------------------------|----------|
| `BASE_PATH` | `/`                                  | Vite `base` and router basename. Use `/<repo>/` for a GitHub Pages project site. |
| `SITE_URL`  | `https://toolkit.iltuoavvocato.com` (**placeholder**) | Origin for canonical, `og:url`, `og:image`, sitemap and robots. Origin only, no path. |
| `NOINDEX`   | unset                                | When `true`, every generated HTML page gets `<meta name="robots" content="noindex, nofollow">` and `robots.txt` omits the `Sitemap` line. `robots.txt` still allows crawling, so search engines can see the tag. Any other value (or unset) = no tag. |

Example: `BASE_PATH=/startup-legal-toolkit/ SITE_URL=https://<user>.github.io npm run build`

## How it is built

- **Logic** lives in pure functions with unit tests:
  - `src/lib/equity.ts`: `quota_i = Σ_f peso_f × (punteggio_i,f / Σ_j punteggio_j,f)`. Weights are normalized to 100% over the factors whose total is > 0, and factors with a zero total are excluded. If nothing can be measured, the split is equal. The pool reduces founders proportionally.
  - `src/lib/rounding.ts`: largest-remainder rounding to one decimal, so the displayed shares always sum to 100,0%.
  - `src/lib/vesting.ts`: cliff with catch-up, vesting only at period boundaries (1/3/12 months from the start), fully vested at ≥ duration.
  - `src/lib/quiz.ts`: the questions and `getRecommendations(answers)`, which returns only the 5 allowed documents.
- **Pre-render**: `scripts/prerender.mjs` copies `dist/index.html` into `route/index.html` for each route in
  `src/routes-meta.json`. It rewrites `<title>`, description, canonical, OG and Twitter tags, and injects a small static
  fallback (`h1` and description) that React replaces on mount. It also writes `404.html` (an SPA fallback with `noindex`),
  `sitemap.xml` and `robots.txt`. At runtime `usePageMeta` keeps the head tags in sync during client-side navigation.

## Deploy: GitHub Pages

`.github/workflows/deploy.yml` builds on every push to `main` (lint → test → build) and publishes `dist/` with
`actions/upload-pages-artifact` and `actions/deploy-pages`.

1. In the repo, go to *Settings → Pages → Source* and choose **GitHub Actions**.
2. By default the workflow sets `BASE_PATH=/<repo-name>/` and `SITE_URL=https://<owner>.github.io` (a project site).
   It also sets `NOINDEX: 'true'`, so the GitHub Pages preview is not indexed. **Remove `NOINDEX` from the workflow
   when the site goes live on its real domain.**
3. With a **custom domain**, add `public/CNAME` containing the domain (e.g. `toolkit.iltuoavvocato.com`) and
   change the workflow env to `BASE_PATH: /` and `SITE_URL: https://toolkit.iltuoavvocato.com`.

Real files exist for every route (`/equity/index.html`, …), so deep links work. Unknown paths get the styled 404 page
through `404.html`.

## Deploy: Vercel

Import the repo with framework **Vite**, build command `npm run build` and output directory `dist`. Leave `BASE_PATH`
unset (it defaults to `/`) and set `SITE_URL` to the production domain in *Project → Settings → Environment Variables*.
`vercel.json` turns on `cleanUrls` and `trailingSlash` (matching the canonical URLs), long-term caching for `/assets/*`,
and a few security headers. Vercel serves `dist/404.html` automatically for unknown paths, so no SPA rewrite is needed.

## Custom domain (DNS on Aruba)

In the Aruba DNS panel for `iltuoavvocato.com`, add a **CNAME** record for the subdomain (e.g. `toolkit`):

- GitHub Pages: `toolkit` → `CNAME` → `<user>.github.io.` Then set the custom domain in *Settings → Pages* (and `public/CNAME`), and enable *Enforce HTTPS*.
- Vercel: `toolkit` → `CNAME` → `cname.vercel-dns.com.` Then add the domain in *Project → Settings → Domains*.

If you use an apex domain instead of a subdomain, follow each provider's A/ALIAS instructions.

## Match investitori (prototype)

A **front-end-only prototype** of agentic startup–investor matching with **double opt-in**. Working name
**MatchInvStar** (nome provvisorio). Every page shows a "Prototipo dimostrativo" banner and the disclaimer. All
investors and startups are fictional and labelled "Dati di esempio" (`src/data/matchDemo.ts`; emails use the reserved
`.example` domain). The full plan and the default decisions are in `docs/briefs/investor-matching.md`.

- **Startup flow** (`/match-investitori/startup/`): settore, fase, regione, round, descrizione and an optional PDF deck
  (drag and drop or file picker). The deck is **never read or uploaded**: only its name, type and size are used. A
  deterministic "l'agente ha letto il deck" step (`src/lib/deck.ts`) drafts the profile from the form and the file name.
  The founder confirms or edits it, then sees ranked investors with score, reasons and exclusions, and can make up to
  `MONTHLY_PROPOSAL_LIMIT = 5` proposals a month (placeholder, "valore provvisorio").
- **Investor flow** (`/match-investitori/investitore/`): settori, fasi, ticket min/max and aree, then anonymous teasers of
  matching startups.
- **Matching** (`src/lib/matching.ts`): hard filters (fase, settore, area, ticket minimo ≤ round). Then score =
  settore (30) + ticket coverage (30, full from 40% of the round) + fase (20) + area (20), rounded to an integer.
  Ordering is deterministic: score, then ticket part, then sector part, then name, then id. Italian reasons and why-not strings.
- **Double opt-in** (`src/lib/optin.ts`): `proposta → attesa-startup → intro`, or a closed state on either no.
  `viewFor(state, side)` guarantees that a "no" looks exactly like no answer to the other side (tested).
- **URL state**: only enumerated values and amounts go in the query string (never names, descriptions or file names).
  Step state and the monthly counter live in memory. There is no storage and there are no network calls.

**A real double opt-in with real investor data requires a backend** (accounts, investor identification, sending
proposals and emails) **and a privacy and regulatory review** (Regolamento (UE) 2020/1503, Consob, TUF art. 18, GDPR,
AI Act). Neither is built here; see `/match-investitori/note-legali/`.

## Decisions

- **Quiz**: the optional 8th question (third-party code, content or data) was dropped because it doesn't map cleanly to one of the five allowed services. There are 7 questions.
- **Quiz rules**: patti tra fondatori only for 2+ founders. It is *Prioritario* if the agreements are missing or only verbal, otherwise *Consigliato* or *Da valutare*. Vesting is *Prioritario* for 2+ founders with no exit rule, and *Da valutare* for a solo founder who may raise money. SAFE is *Prioritario* if investors are expected and *Consigliato* if "forse". Work for equity is *Prioritario* for equity collaborators. IP is *Prioritario* for pre-existing assets, *Consigliato* for "non so" or equity collaborators, and *Da valutare* before a round. A solo founder with no investors, collaborators or IP issues gets an "everything OK for now" message.
- **Equity inputs**: idea, competenze and ruolo use 0–10 sliders. Tempo is a 0–100% share of full-time, in steps of 5. Capitale is euros. Capital defaults to 0, so by default that factor is excluded and the page explains why.
- **Vesting**: with a cliff that is not a multiple of the period, the catch-up at the cliff covers the whole periods accrued so far (e.g. quarterly with a 5-month cliff gives 3/48 at month 5). The duration slider covers 6–120 months in 6-month steps, and the cliff covers 0–36 months (never more than the duration).
- **Percent format**: Italian style without a space (`62,5%`), via `Intl.NumberFormat('it-IT')`.
- **Inter** is pinned to optical size 14 and weight 400–700 to keep the font small (46 KB). Playfair keeps its full weight axis.
- On mobile, a compact fixed bar on the equity page shows the live split and links to the result card. It hides once the card is in view.
- **Match investitori**: the default decisions (D1–D11) are recorded in `docs/briefs/investor-matching.md` and still need
  Vincenzo's confirmation. The header gets an "Investitori" item. To keep the nav on one line, the "Startup Legal Toolkit"
  subtitle is hidden between 900 and 959px only. Match styles live in `src/styles/match.css` (all classes `mi-`),
  loaded after `global.css`. The privacy page is unchanged.

## TODO

- [ ] Replace the placeholder `SITE_URL` (`https://toolkit.iltuoavvocato.com`) with the real domain.
- [ ] Add operator details to the privacy page if needed (legal entity name, address, P.IVA). These were left out on purpose and should not be invented.
- [ ] Have a lawyer at ilTuoAvvocato review the legal copy (quiz explanations, good/bad leaver text).
- [ ] Optionally link the CTAs to specific service pages on iltuoavvocato.com instead of the home page.
- [ ] Match investitori: confirm the default decisions with Vincenzo (`docs/briefs/investor-matching.md`, "Decisioni").
- [ ] Match investitori: have a lawyer review the legal notes and the "Da verificare con un avvocato" list before any real version.
- [ ] Match investitori: a real version needs a backend and a privacy/regulatory review; the product name, the score weights, the monthly limit and fees are provisional.
- [ ] Optionally add a real SSR/hydration step if richer pre-rendered content is wanted for SEO.
