# Startup Legal Toolkit — by ilTuoAvvocato.com

A small static website (Italian by default, with a full English version under `/en/`) with three free interactive tools for
Italian startup founders. It routes them to a lawyer at [iltuoavvocato.com](https://iltuoavvocato.com):

| Route        | Tool |
|--------------|------|
| `/`          | Home: hero, the three tools, "Perché pensarci subito", the five documents, CTA |
| `/equity/`   | **Calcolatore ripartizione quote**: 2–5 cofounders, 5 weighted factors, optional pool/ESOP, donut and bars, copy/print |
| `/vesting/`  | **Simulatore vesting**: stake, duration, cliff, monthly/quarterly/annual frequency, step chart with a draggable leaver marker, good/bad leaver explanation |
| `/quiz/`     | **Quali documenti mi servono?**: 7 questions, then a personalized checklist from the 5 documents with priority badges |
| `/privacy/`  | Privacy notes (no cookies, no tracking, no data sent anywhere; only the language preference is stored) |
| `/match-investitori/…` | **Match investitori** (prototype, see below): landing, `startup/`, `investitore/`, `agente/startup/`, `agente/investitore/`, `doppio-consenso/`, `note-legali/` |
| `/en/…`      | English version of every page (see [Languages](#languages)) |
| anything else | Styled 404 (English under `/en/…`, Italian otherwise, with the disclaimer) |

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

Runtime dependencies: React, react-router and `pdfjs-dist` (bundled, lazy-loaded only when a founder picks a deck in
the matching prototype). There are no trackers and no cookies, and the site makes **no
external requests**. The only thing ever stored is the language chosen with the IT/EN switcher (`localStorage`, key
`lang`). Tool state lives in the URL query string, so results can be shared.

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
node scripts/make-sample-decks.mjs  # regenerate the two fictional sample decks in public/demo/ (pdf-lib, byte-stable)
```

`npm run screenshots` uses Chrome at its default install location (`channel: 'chrome'`). Set
`CHROME_PATH=/path/to/chromium` to use a different binary. The script also fails if it detects console errors,
external requests, any non-GET request (nothing may be uploaded), horizontal overflow, any cookie, a `localStorage` key other than `lang`, or a wrong `<html lang>`.
It captures English pages too (files prefixed `en-`). At the end it clicks the language switcher and checks the
equivalent page, the stored preference and the redirect, which happens only from `/`.

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
- **Pre-render**: `scripts/prerender.mjs` copies `dist/index.html` into `route/index.html` for each route **and language** in
  `src/routes-meta.json`. It sets `<html lang>`, and rewrites `<title>`, description, canonical, hreflang alternates, OG
  and Twitter tags. It also injects a small static fallback (`h1` and description) that React replaces on mount. It also
  writes `404.html` (an SPA fallback with `noindex`), `sitemap.xml` (both languages, with `xhtml:link` alternates) and
  `robots.txt`. The pure helpers are in `scripts/seo.mjs` and are tested in `src/i18n/seo.test.ts`. At runtime
  `usePageMeta` keeps `lang` and the head tags in sync during client-side navigation.

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

## Languages

Italian is the default, and English is the second language. There is no external service and no new dependency: a typed
dictionary plus a React context.

- **URL scheme**: Italian pages keep their original URLs. English pages live under `/en/` with English slugs:

  | Italian | English |
  |---|---|
  | `/` | `/en/` |
  | `/equity/` | `/en/equity/` |
  | `/vesting/` | `/en/vesting/` |
  | `/quiz/` | `/en/quiz/` |
  | `/privacy/` | `/en/privacy/` |
  | `/match-investitori/` | `/en/investor-match/` |
  | `/match-investitori/startup/` | `/en/investor-match/startup/` |
  | `/match-investitori/investitore/` | `/en/investor-match/investor/` |
  | `/match-investitori/agente/startup/` | `/en/investor-match/agent/startup/` |
  | `/match-investitori/agente/investitore/` | `/en/investor-match/agent/investor/` |
  | `/match-investitori/doppio-consenso/` | `/en/investor-match/double-opt-in/` |
  | `/match-investitori/note-legali/` | `/en/investor-match/legal-notes/` |
  | `/match-investitori/varianti/…` (noindex) | `/en/investor-match/variants/…` |

  The mapping, titles and descriptions live in `src/routes-meta.json`, which the app and the prerender both read.
  Every page has `<html lang>`, a self-referencing canonical, and hreflang alternates `it`, `en` and `x-default` (= Italian).
  The sitemap lists both languages. There is one `404.html` (`noindex`) carrying both languages: a tiny inline script in
  its `<head>` switches `<html lang>`, the title and the static copy to English on `/en/…` paths before paint, then the
  app renders the matching "Page not found" (with the disclaimer). Without JavaScript both languages are shown. `NOINDEX=true` applies to every page in both languages.
- **Dictionaries**: `src/i18n/messages/*.ts`. Each module exports `{ it, en }`, and `en` is typed as `typeof it`, so
  TypeScript rejects missing or extra keys. `src/i18n/messages.test.ts` also checks that the two trees have exactly the
  same keys and array lengths. Strings can contain `*emphasis*`, `**bold**` and `[link](@routeId)` (rendered by
  `src/i18n/Rich.tsx`). Strings with parameters are small functions.
- **Hook**: `useI18n()` returns `{ locale, t, f, path }`: the dictionary, locale formatters and localised paths. Pure
  libraries (`quiz.ts`, `matching.ts`, `optin.ts`, `deck.ts`, `matchQuery.ts`) take an optional `locale` (default `it`).
- **Formatting**: Italian uses `it-IT` (`62,5%`, `500.000 €`, `gen 2027`). English uses **`en-GB`** with euros (`62.5%`,
  `€500,000`, `Jan 2027`), because the audience is European and the amounts are in euros.
- **Switcher**: IT/EN links in the header (and in the mobile menu) point to the equivalent page in the other language,
  keeping the query string. They have `lang`, `hreflang` and `aria-current` on the current language.
- **Remembered choice (least surprising behaviour)**: an explicit URL always wins. `localStorage` (key `lang`, value `it`
  or `en`) is **written only when the user clicks the switcher**. It is **read only on the first load of the Italian home
  `/`**: if the stored value is `en`, the visitor is sent to `/en/` (replace, no extra history entry). The prerendered
  Italian home does this in an inline `<head>` script (`homeRedirectScript` in `scripts/seo.mjs`) before the body is
  parsed, so there is no flash of Italian; crawlers have no stored value and still get the Italian page. The same check
  in `Layout` covers the dev server. Nothing else reads it, and if storage is unavailable the switcher still works. The privacy page says this in both languages.
- **Header fit**: with four nav items, the switcher and the CTA, the nav gaps tighten between 900 and 1099px and the
  "Startup Legal Toolkit" subtitle is hidden between 900 and 1023px. Checked at 900/930/959/960/1024/1100/1440px in both languages.

## Match investitori (prototype)

A **front-end-only prototype** of agentic startup–investor matching with **double opt-in**. Working name
**MatchInvStar** (nome provvisorio). Every page shows a "Prototipo dimostrativo" banner and the disclaimer. All
investors and startups are fictional and labelled "Dati di esempio" (`src/data/matchDemo.ts`; emails use the reserved
`.example` domain). The full plan and the default decisions are in `docs/briefs/investor-matching.md`.

- **Startup flow** (`/match-investitori/startup/`): settore, fase, regione, round, descrizione and an optional PDF deck
  (drag and drop, file picker, or **"Prova con un deck di esempio" / "Try a sample deck"**, which loads a fictional
  sample from `public/demo/`). The deck is **read in the browser and never uploaded**:
  - `src/lib/pdfText.ts` lazy-loads pdf.js (`pdfjs-dist`, bundled; worker via Vite `?url`, no CDN) only when a file is
    chosen, and extracts the text page by page with fonts, CMaps and eval disabled, so nothing is fetched. Limits
    (placeholders): PDF only, 20 MB, 40 pages. Encrypted, damaged, too long and image-only/scanned decks (under 60
    characters of text) get a clear message and fall back to the form-only flow.
  - `src/lib/deckExtract.ts` (pure, no AI, IT + EN) proposes **settore** (keyword lists mapped to the 11 taxonomy
    sectors), **fase** (pre-seed / seed / serie A, preferring the stage being raised now over past rounds), **round**
    (the ask: "raising €1.5M", "round da 800k", "1,2 mln", "800.000 €"; market sizes, revenue and past raises are
    ignored), **sede** (Italian cities and regions → region, office lines weigh more), **team size**, **traction**
    (MRR/ARR, revenue, users, customers, growth %, pilots, LOI) and a **tagline** for the anonymous one-liner. Every
    finding has a confidence (alta/media/bassa) and the snippet + page it comes from. Only the findings are kept, not
    the text.
  - Review step **"Cosa abbiamo trovato nel deck" / "What we found in your deck"**: each finding with snippet and page
    and Usa / Modifica / Ignora; nothing is applied without a choice (`src/lib/deckSignals.ts`). Accepted values
    prefill the profile ("Fonte: dal deck, p. 7"), which the founder still confirms.
  - Results: "L'agente ha usato il tuo deck per: …", each reason that rests on a deck value says "(dal tuo deck, p. N)",
    and accepted team/traction signals are quoted under each match (they don't count towards the score).
  Without a readable deck, neither the stepper ("Analisi dei dati" / "Analysing your details") nor the agent checklist
  mentions reading one. The founder then sees ranked investors with score, reasons and exclusions, and can make up to
  `MONTHLY_PROPOSAL_LIMIT = 5` proposals a month (placeholder, "valore provvisorio").
- **Investor flow** (`/match-investitori/investitore/`): settori, fasi, ticket min/max and aree, then anonymous teasers of
  matching startups.
- **Guided intake, "Parla con l'agente" / "Talk to the agent"** (`/match-investitori/agente/startup/` and
  `/match-investitori/agente/investitore/`, EN `/en/investor-match/agent/…`; indexed and in the sitemap like the forms).
  The form stays as **"Compila il modulo" / "Fill in the form"**; a switch at the top of both pages (and links on the
  landing doors) moves between the two. The agent asks one question at a time in chat bubbles: chips (single and
  multi select, as buttons with `aria-pressed`), amounts with suggestions that follow the stage (round size for
  founders, ticket ranges for investors) and formatted read-outs, an optional one-line pitch. Founders can add a PDF
  deck at any point before the search (button, drag and drop or the sample deck): it is read on the device with the
  M3 reader and each finding becomes a chat question ("Nel deck (p. 7) leggo che cercate 800.000 €. Confermi l'importo?")
  with the quoted snippet, page and confidence, and Sì / Modifica / No. Questions the deck answered are skipped; a deck
  value that differs from an earlier answer is shown as a conflict; "Modifica" re-asks the question with the deck value
  as a suggestion. A round that is unusual for the stage gets a follow-up ("È corretto?"). Every answer can be changed
  ("Modifica" on the bubble or in the live profile panel, "Indietro"). The panel (sticky on desktop, collapsible on
  phones) shows each value with its source ("dal deck, p. 7" / "da te") and the anonymous teaser. At the end the same
  `StartupProfile` / `Investor` objects as the forms go through the matching engine and the agent presents each match:
  why it fits, what doesn't, and the double opt-in next step, from IT/EN templates; actions are local only
  (propose within the monthly limit, set aside, simulate the other side's answer, accept or decline the intro; investors
  get anonymous teasers, interest/pass and a simulated startup answer). A "no" is never revealed: it reads exactly like
  no answer yet. Logic: `src/lib/intakeAgent.ts` (pure reducer: questions, plan/skip rules, validation, edit, deck
  confirmations, opt-in per match, explanation and transcript text; 42 unit tests). UI: `src/pages/MatchAgentPage.tsx`,
  `src/components/match/agent/`. Keyboard: focus moves to the new question's first control after each answer and to
  the results when they appear; the transcript is a `role="log"` live region. The typing animation is skipped with
  `prefers-reduced-motion` or "Salta l'animazione". The conversation is kept in **sessionStorage** for this tab only
  (`matchinvstar-agent-startup` / `-investor`) and removed by "Ricomincia" / "Start over"; the stored form never
  contains deck text (no findings, no snippets, the cover sentence only if the founder accepted it as the pitch).
  `npm run screenshots` scripts full conversations (deck and no deck, founder and investor, IT and EN, desktop and
  mobile; `scripts/agent-flows.mjs`) and fails on unexpected sessionStorage keys or deck text in storage.
- **Investor directory** (`/match-investitori/investitori/`, EN `/en/investor-match/investors/`; indexed, in the
  sitemap, linked from the landing): 36 fictional investors (angels, club deals, micro-VCs, corporate VCs, family
  offices, accelerators) labelled **"Dati di esempio fittizi" / "Fictional sample data"**. Filters: stage, sector, the
  startup's region (investors whose area covers it, or all of Italy), investor type, ticket range (overlap, formatted
  amounts), free-text search (accents and case ignored), sort by name, ticket or, when a founder profile exists, fit.
  Filters live in the query string (`?fase=seed&settore=fintech&min=…&ordina=…`, same keys in IT and EN): links are
  shareable, selects and chips add history entries (Back undoes them), typing replaces the entry. Result count,
  removable chips, "Azzera filtri", empty state with "remove this filter (N results)" suggestions. Phones get the
  filters in a bottom sheet (native `<dialog>`). Logic: `src/lib/directory.ts` (pure, tested).
- **Investor profile** (`/match-investitori/investitori/scheda/?id=i01`, noindex): thesis and criteria, fit with the
  founder's profile (same engine as the matches, reasons or why-not), and **"Proponi il tuo profilo"**, which records a
  proposal in the requests inbox (monthly cap, duplicates refused while one is open, pairs the agent wouldn't propose
  explained). Without a profile it offers the agent or the form. No contact details, no public pitch pages.
- **Requests inbox** (`/match-investitori/richieste/`, EN `/en/investor-match/requests/`, noindex): tabs "Come startup"
  / "Come investitore", each with In attesa / Accettate / Scadute. Founder: proposals sent with "Scade tra N giorni",
  investors that said yes (accept the intro or "Non ora"), intros ready (email preview), expired ones; counter
  "3/5 proposte questo mese – limite indicativo da definire". Investor: sample anonymous teasers of fictional startups
  (yes / no; the name appears only at the intro). Placeholders in `src/lib/matchConfig.ts`: `REQUEST_EXPIRY_DAYS = 14`,
  `MONTHLY_PROPOSAL_LIMIT = 5`, `TIME_TRAVEL_DAYS = 7`. The other side's answers are simulated and deterministic; the
  demo control **"Simula +7 giorni"** moves the demo clock to show answers and expiries, "Azzera la demo" clears it.
  **A no is never revealed**: to the side that asked, a declined request stays "in attesa" until its deadline and then
  shows as "scaduta", exactly like no answer, and a no never moves a deadline (`src/lib/inbox.ts`, injectable clock,
  tested at every hour of 30 days). A badge with the number of requests waiting for your answer appears next to
  "Investitori" in the header and on the banner's "Richieste" link (only when there are some). Proposals from the
  startup results and the directory share this inbox (and its monthly counter); the founder profile (enumerated fields
  only) is saved when confirmed in the form or completed with the agent. Stored in **sessionStorage**
  (`matchinvstar-inbox`, this tab only): no names, no descriptions, no deck text.
- **Matching** (`src/lib/matching.ts`): hard filters (fase, settore, area, ticket minimo ≤ round). Then score =
  settore (30) + ticket coverage (30, full from 40% of the round) + fase (20) + area (20), rounded to an integer.
  Ordering is deterministic: score, then ticket part, then sector part, then name, then id. Italian reasons and why-not strings.
- **Double opt-in** (`src/lib/optin.ts`): `proposta → attesa-startup → intro`, or a closed state on either no.
  `viewFor(state, side)` guarantees that a "no" looks exactly like no answer to the other side (tested).
- **URL state**: only enumerated values and amounts go in the query string (never names, descriptions or file names).
  Step state lives in memory; the guided intake and the requests inbox use sessionStorage (see above). There are
  no network calls with user data: the only requests are same-origin static assets (pdf.js chunk and worker, and the sample deck when asked for).

**A real double opt-in with real investor data requires a backend** (accounts, investor identification, sending
proposals and emails) **and a privacy and regulatory review** (Regolamento (UE) 2020/1503, Consob, TUF art. 18, GDPR,
AI Act). Neither is built here; see `/match-investitori/note-legali/`.

### Design variants gallery (internal, noindex)

For comparing design directions (Milestone 2). `/match-investitori/varianti/` (EN `/en/investor-match/variants/`) shows one
card per variant with a preview, description, pros/cons and links to its three screens, plus a **side-by-side compare**
(two iframes; pick left/right variant, screen and desktop/mobile width; the choice is mirrored in `?a=&b=&s=&w=`).
Each screen lives at `…/varianti/vN/{landing,risultati,investitore}/` (EN `…/variants/vN/{landing,results,investor}/`):

| | Direction | Founder results | Investor view |
| --- | --- | --- | --- |
| **V1** | Editoriale / minimal: black and white, gold `#C9A24A` accent, Playfair headlines | numbered "articles" | editorial index of teasers |
| **V2** | Dashboard: filter sidebar, sortable tables, score bars, keyboard (j/k, Enter, `/`, i/p) | profile controls recompute live | bucket tabs + teaser table |
| **V3** | Agent-first chat: the agent presents one match at a time, chip answers | Perché / Proponi / Prossimo / Esclusi | Interessato / Passa / simulated reply |
| **V4** | Card / swipe: stack of cards, buttons, drag, ← → and undo | Interessato = propose profile | Interessato / Passa, undo only for a pass |
| **V5** | Dark premium (ilTuoAvvocato black, mono figures, minimal gold) | master/detail split | dark list + terminal-style intro email |

- All variants use the real engine (`matching.ts`) and the fictional demo data through `src/variants/shared/useDemo.ts`;
  state is in memory only. A startup's "no" looks exactly like no answer (`src/variants/logic/board.ts`, tested, and
  checked end to end by the screenshot script).
- Every screen has the "Variante di design – prototipo" banner, the fictional-data label and the disclaimer, and is
  `noindex, nofollow` in the prerendered HTML (route `robots` in `src/routes-meta.json`) and left out of the sitemap.
- Code is under `src/variants/` and lazy-loaded (separate JS/CSS chunk). CSS is scoped: `.vx-` (shared frame), `.vg-`
  (gallery), `.v1-`…`.v5-` per variant, so existing pages are unaffected. Copy: `src/i18n/messages/variants.ts` and
  `variantCopy/vN.ts`.
- `?embed=1` on a variant screen hides the site header/footer (used by the compare iframes).
- **Decision for Vincenzo**: see `docs/briefs/investor-matching.md`, "Milestone 2" (D14).

## Decisions

- **Quiz**: the optional 8th question (third-party code, content or data) was dropped because it doesn't map cleanly to one of the five allowed services. There are 7 questions.
- **Quiz rules**: patti tra fondatori only for 2+ founders. It is *Prioritario* if the agreements are missing or only verbal, otherwise *Consigliato* or *Da valutare*. Vesting is *Prioritario* for 2+ founders with no exit rule, and *Da valutare* for a solo founder who may raise money. SAFE is *Prioritario* if investors are expected and *Consigliato* if "forse". Work for equity is *Prioritario* for equity collaborators. IP is *Prioritario* for pre-existing assets, *Consigliato* for "non so" or equity collaborators, and *Da valutare* before a round. A solo founder with no investors, collaborators or IP issues gets an "everything OK for now" message.
- **Equity inputs**: idea, competenze and ruolo use 0–10 sliders. Tempo is a 0–100% share of full-time, in steps of 5. Capitale is euros. Capital defaults to 0, so by default that factor is excluded and the page explains why.
- **Vesting**: with a cliff that is not a multiple of the period, the catch-up at the cliff covers the whole periods accrued so far (e.g. quarterly with a 5-month cliff gives 3/48 at month 5). The duration slider covers 6–120 months in 6-month steps, and the cliff covers 0–36 months (never more than the duration).
- **Percent format**: Italian style without a space (`62,5%`), via `Intl.NumberFormat('it-IT')`.
- **Inter** is pinned to optical size 14 and weight 400–700 to keep the font small (46 KB). Playfair keeps its full weight axis.
- On mobile, a compact fixed bar on the equity page shows the live split and links to the result card. It hides once the card is in view.
- **Match investitori**: the default decisions (D1–D11) are recorded in `docs/briefs/investor-matching.md` and still need
  Vincenzo's confirmation. The header gets an "Investitori" item (see [Languages](#languages) for how the nav fits).
  Match styles live in `src/styles/match.css` (all classes `mi-`), loaded after `global.css`. The privacy page was
  later updated only to describe the stored language preference.

## TODO

- [ ] Replace the placeholder `SITE_URL` (`https://toolkit.iltuoavvocato.com`) with the real domain.
- [ ] Add operator details to the privacy page if needed (legal entity name, address, P.IVA). These were left out on purpose and should not be invented.
- [ ] Have a lawyer at ilTuoAvvocato review the legal copy (quiz explanations, good/bad leaver text).
- [ ] Optionally link the CTAs to specific service pages on iltuoavvocato.com instead of the home page.
- [ ] Match investitori: confirm the default decisions with Vincenzo (`docs/briefs/investor-matching.md`, "Decisioni").
- [ ] Match investitori: have a lawyer review the legal notes and the "Da verificare con un avvocato" list before any real version.
- [ ] Match investitori: a real version needs a backend and a privacy/regulatory review; the product name, the score weights, the monthly limit and fees are provisional.
- [ ] Optionally add a real SSR/hydration step if richer pre-rendered content is wanted for SEO.
