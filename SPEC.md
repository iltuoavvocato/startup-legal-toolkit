# SPEC — Startup Legal Toolkit (by ilTuoAvvocato.com)

You are the developer. The project manager / QA is Grok. Build the whole thing in THIS folder
(`/workspace/startup-legal-toolkit`). Do NOT push, publish, deploy or contact any external service
(no `git push`, no `gh`, no Vercel/Netlify CLI, no network uploads). `npm install` is fine.

## 1. Product

A small, polished, **static** website with three free interactive tools for Italian startup founders,
offered by **ilTuoAvvocato.com** (Italian online legal services; lawyers registered with the Ordine degli
Avvocati). Purpose: give real value to founders and route them to a lawyer at https://iltuoavvocato.com.

ilTuoAvvocato's startup services (the ONLY ones you may mention): **SAFE**, **patti tra fondatori
(founders' agreement / patto parasociale)**, **accordo di work for equity**, **vesting**, **cessione /
tutela della proprietà intellettuale (IP)**.

**Site language: ITALIAN** (all UI copy, correct accents: è, perché, più, già, società, attività…;
natural, professional, plain-language Italian, tu-form, no anglicisms where an Italian word is natural,
but keep established startup terms: SAFE, vesting, cliff, good/bad leaver, work for equity, founder).

### Hard content rules
- NO invented statistics, numbers of clients, prices, ratings, testimonials, reviews, awards, response
  times, guarantees, or claims about ilTuoAvvocato beyond: online legal services, avvocati iscritti
  all'Ordine, and the startup services listed above.
- Every tool page shows the disclaimer, verbatim: **"Strumento indicativo: non sostituisce una consulenza legale."**
  (visible near the result + in footer).
- Legal explanations must be accurate for Italy but generic and cautious ("in genere", "di solito").
  E.g. SAFE in Italy is not a typified contract and must be adapted to Italian law (s.r.l./startup innovativa);
  vesting in an s.r.l. is typically implemented through patti parasociali / opzioni call / clausole statutarie;
  don't state specific law articles unless you are sure (better avoid).
- CTA "Parla con un avvocato" → `https://iltuoavvocato.com/?utm_source=toolkit&utm_medium=referral&utm_campaign=<tool>`
  where `<tool>` ∈ `home`, `equity`, `vesting`, `quiz`. External links: `target="_blank" rel="noopener"`.

## 2. Tech

- Vite + React 18 + TypeScript (strict), react-router (HashRouter is NOT wanted: use BrowserRouter with
  `basename = import.meta.env.BASE_URL`) **plus** a `404.html` copy of `index.html` in dist for GitHub
  Pages SPA fallback, **and** pre-render: generate a real static HTML file per route
  (`/`, `/equity/`, `/vesting/`, `/quiz/`, `/privacy/`) at build time so each route has its own
  `<title>`, meta description, canonical and OG tags in the HTML (a simple post-build Node script that
  copies index.html into `route/index.html` and rewrites head tags is enough; full SSR not required).
- Base path configurable via env `BASE_PATH` (default `/`), e.g. `BASE_PATH=/startup-legal-toolkit/ npm run build`
  for GitHub Pages project sites. Site origin for canonical/sitemap/OG via env `SITE_URL`
  (default `https://toolkit.iltuoavvocato.com` as placeholder — document it in README).
- Charts: hand-rolled SVG components (preferred, zero deps) or a tiny lib. Keep JS bundle small (target < 150 KB gzip total).
- Styling: plain CSS / CSS modules with CSS variables (no Tailwind needed, your call). No UI kits.
- Fonts: self-host from `assets-src/` (Inter.ttf, Playfair.ttf, PlayfairItalic.ttf) — convert to woff2 if
  you can (e.g. via a node package) otherwise ttf; `font-display: swap`. NO Google Fonts CDN.
- **Privacy: no trackers, no analytics, no cookies, no localStorage needed** (state may live in the URL
  query string so results are shareable — nice to have). No external requests at runtime at all.
- Scripts: `dev`, `build` (tsc + vite build + prerender + sitemap), `preview`, `test` (vitest run), `lint` (eslint), `screenshots`.
- Put all calculation logic in pure functions in `src/lib/` (equity.ts, vesting.ts, quiz.ts) with
  **vitest unit tests** in `src/lib/*.test.ts`.
- `npm run build`, `npm test`, `npm run lint` must all pass with zero errors and zero warnings.
- SEO: per-page `<title>`, meta description, canonical, OG (og:title, og:description, og:image, og:url,
  og:locale=it_IT, og:type), twitter:card=summary_large_image, `<html lang="it">`, `robots.txt`, `sitemap.xml`.
  Create an OG image 1200×630 PNG (navy + gold, title "Startup Legal Toolkit", light logo) — generate it
  at dev time (e.g. Playwright screenshot of an HTML template) and commit it in `public/`.
- Favicon: `assets-src/favicon.svg` (navy rounded square with white mark) — you may make a gold variant.
- Accessibility: semantic landmarks, one h1 per page, labelled inputs, sliders with visible values and
  keyboard support, focus-visible styles, color contrast ≥ WCAG AA, charts with text alternatives
  (e.g. a summary table / aria-label), `prefers-reduced-motion` respected.
- Mobile-first, works from 360px wide, no horizontal overflow anywhere.

## 3. Brand / visual design

- Client-facing brand: **dark navy + warm gold**. Suggested palette (adjust for contrast):
  navy-950 `#0B1730`, navy-900 `#10224A`, navy-800 `#16305B` (logo navy is `#1C2F58`), ink/white `#F5F2EA`,
  muted `#B8C0D4`, gold `#C9A45C`, gold-light `#E2C88E`. Light sections (cream `#F7F3EA` with navy text)
  are welcome to alternate with dark ones.
- Headings: **Playfair Display** (serif, elegant, can use italic accents in gold). Body/UI: **Inter**.
- Logo: `assets-src/logo_iltuoavvocato_hd.svg` (navy wordmark "IL TUO AVVOCATO", fill `rgb(28, 47, 88)`).
  On dark backgrounds create a light variant (fill `#F5F2EA`) and/or gold variant (`#C9A45C`) by
  rewriting the fill — never stretch or distort it; keep its aspect ratio (≈ 10.8:1).
- Feel: premium law-firm-meets-startup. Generous whitespace, subtle gold hairlines, rounded cards (12–16px),
  soft shadows, tasteful micro-interactions. No stock photos, no emojis in UI, no lorem ipsum.
- Header: logo (links to home), nav: Ripartizione quote · Vesting · Quali documenti? · CTA button
  "Parla con un avvocato". Mobile: compact menu (accessible toggle).
- Footer: logo, short line "Strumenti gratuiti per founder, a cura di ilTuoAvvocato.com", the disclaimer,
  link to Privacy page, © year ilTuoAvvocato.com.

## 4. Pages

### 4.1 Home `/`
- Hero: headline for founders, e.g. "Gli strumenti legali per chi fonda una startup" (you may improve),
  subtitle explaining: three free tools to split equity, simulate vesting and find out which documents
  you need — before talking to a lawyer. Primary CTA → quiz, secondary → equity calculator.
- Three tool cards (title, 1-line description, "Apri lo strumento →").
- "Perché pensarci subito" section: 3 short plain-language points (e.g. quote decise a voce generano
  conflitti; chi esce presto; il codice scritto prima della società) — no statistics.
- Section on the documents (5 mini cards: Patti tra fondatori, SAFE, Work for equity, Vesting, Cessione IP)
  each 1–2 sentences.
- Final CTA band: "Hai bisogno di una mano? Parla con un avvocato di ilTuoAvvocato.com" → UTM link.

### 4.2 Calcolatore ripartizione quote `/equity/`
- 2–5 cofounders (add/remove, editable names default "Founder 1…", min 2 max 5).
- Factors (each with an adjustable **weight** 0–100%, defaults below; weights auto-normalized and shown as %):
  1. Idea e visione — default weight 10
  2. Tempo e impegno (full-time / part-time) — default 30
  3. Capitale investito — default 20
  4. Competenze chiave — default 25
  5. Ruolo e responsabilità — default 15
- For each founder and factor a score input. Use 0–10 sliders for idea, competenze, ruolo; for tempo use
  hours/week or a % of full-time (0–100%); for capitale use € amount. Capital and time contribute
  **proportionally** (founder's share of the total of that factor); slider scores likewise proportional
  to sum of scores. If a factor total is 0 for everyone, that factor is excluded and remaining weights
  renormalized (explain this).
- Formula (show it transparently on the page, in a "Come calcoliamo" box):
  `quota_i = Σ_f peso_f × (punteggio_i,f / Σ_j punteggio_j,f)` with weights normalized to 100%.
- Live result: donut chart + bar list with % to one decimal; results must sum to exactly 100.0% (use a
  largest-remainder rounding for display). Equal inputs ⇒ equal split.
- Optional: "Riserva per pool/ESOP" slider 0–20% (default 0) that reduces founders' total proportionally
  and shows the pool as its own slice — nice to have.
- Actions: "Copia riepilogo" (copies plain-text Italian summary to clipboard, with feedback),
  "Stampa / salva PDF" (window.print with a clean print stylesheet), "Ripristina".
- Educational notes: the split is a starting point for negotiation; pair it with vesting; write it in the
  patti tra fondatori. CTA to lawyer.
- Disclaimer.

### 4.3 Simulatore vesting `/vesting/`
- Inputs: quote totali del founder (% of company, default 25%) or number of shares/quote (let user pick %
  — keep it simple: %), durata (mesi, default 48), cliff (mesi, default 12, 0 allowed, ≤ durata),
  frequenza maturazione (mensile / trimestrale / annuale), data inizio (default today, date input).
- Math (pure function, unit tested): vested(m) = 0 if m < cliff; else total × floor-to-period(m)/durata,
  capped at total, where at the cliff the accumulated amount vests at once ("cliff catch-up"). With
  quarterly/annual frequency, vesting happens only at period boundaries (multiples of 3/12 months
  counted from start), still respecting the cliff. Fully vested at m ≥ durata.
- Interactive timeline: SVG step chart of vested % over months with the cliff marked, date labels
  (Italian month names, e.g. "gen 2027"), and a draggable/slider marker "Il founder esce al mese X".
- "Cosa succede se esce al mese X": show vested vs unvested and an explanation with a toggle
  **Good leaver / Bad leaver** explained simply:
  - Good leaver (es. malattia, licenziamento senza giusta causa, uscita concordata): in genere conserva le
    quote maturate; le quote non maturate tornano alla società/agli altri soci (di solito con riacquisto a
    valore nominale o di mercato, secondo quanto previsto negli accordi).
  - Bad leaver (es. dimissioni prima di un termine, violazione di non concorrenza, giusta causa): gli
    accordi possono prevedere che perda anche parte o tutte le quote maturate, o che debba cederle a un
    prezzo penalizzante (es. valore nominale).
  Make clear these are typical contractual options to be defined in the patti tra fondatori, not law.
- Add a small "Esempio rapido" explainer (4 anni, cliff 1 anno: esce a 11 mesi → 0%; a 12 mesi → 25% del
  suo pacchetto; a 30 mesi → 62,5%).
- Show numbers in Italian format (virgola decimale, e.g. 62,5%). Use Intl with 'it-IT'.
- Disclaimer + CTA.

### 4.4 Quiz "Quali documenti mi servono?" `/quiz/`
- 7–8 questions, one per screen with progress bar, back button, keyboard accessible, radio options.
  Suggested questions:
  1. Quanti siete a fondare la startup? (Da solo / 2 / 3 o più)
  2. Avete già costituito la società? (No, non ancora / Sì, s.r.l. / Sì, startup innovativa / Non so)
  3. Avete messo per iscritto come dividere quote e ruoli? (Sì / No / Solo a voce)
  4. Pensate di raccogliere investimenti nei prossimi 12 mesi (business angel, pre-seed)? (Sì / Forse / No)
  5. Ci sono collaboratori, advisor o dipendenti che vorreste pagare (anche) in equity? (Sì / No)
  6. Codice, brand, design o altri asset sono stati creati prima della società o da singoli founder/freelance? (Sì / No / Non so)
  7. Cosa succede se uno di voi lascia il progetto: l'avete previsto? (Sì / No)
  8. Il prodotto usa codice, contenuti o dati di terzi? — optional; drop it if it doesn't map to a listed service.
- Result: personalized checklist from these 5 documents only: **Patti tra fondatori**, **Clausole di vesting
  (good/bad leaver)**, **SAFE (o strumento equivalente per investitori)**, **Accordo di work for equity**,
  **Cessione/tutela della proprietà intellettuale**. Each item: priority badge ("Prioritario" /
  "Consigliato" / "Da valutare"), 2–3 sentence plain-language explanation of what it is and why the
  answers point to it, and which answer triggered it. Pure function `getRecommendations(answers)` unit
  tested (e.g. solo founder + no investors → no patti tra fondatori; investors yes → SAFE prioritario;
  equity collaborators → work for equity; pre-existing IP → cessione IP prioritario; 2+ founders and
  no exit rule → vesting prioritario).
- If nothing applies, show a sensible message (e.g. keep an eye on IP, come back when things change).
- Actions: "Copia checklist", "Rifai il quiz", CTA "Parla con un avvocato" (UTM campaign=quiz).
- Disclaimer.

### 4.5 Privacy `/privacy/`
- Short page: no cookies, no tracking, no data sent anywhere; all calculations run in the browser; external
  link to iltuoavvocato.com has its own privacy policy. Who operates: ilTuoAvvocato.com (no invented company
  details, address, VAT number — if needed write a TODO in README, not on the page).

### 4.6 404 page (styled, link home).

## 5. Quality bar & process

1. `git init -b main` (if not already), sensible `.gitignore` (node_modules, dist, screenshots/ is OK to commit
   or ignore — ignore it). Commit in meaningful steps (scaffold, lib+tests, pages, polish, docs).
   Use git author `Claude Code <claude-code@iltuoavvocato.local>` if no identity is configured.
2. Write unit tests (vitest) for equity, vesting and quiz logic — cover edge cases (equal inputs ⇒ equal split,
   zero factor excluded, rounding sums to 100, cliff boundary month 11/12, quarterly/annual steps, cliff 0,
   fully vested at durata and beyond, leaver at month 0).
3. `npm run build && npm test && npm run lint` all clean.
4. Screenshots: Playwright (use the system Chrome: `channel: 'chrome'` — Google Chrome is at
   `/usr/bin/google-chrome`; or install chromium via `npx playwright install chromium` if that works).
   Script `npm run screenshots` that serves `dist/` (vite preview) and captures **full-page** screenshots
   of every page at desktop 1440×900 and mobile 390×844 (deviceScaleFactor 2 for mobile is fine) into
   `screenshots/` with names like `home-desktop.png`, `equity-mobile.png`; also capture states: quiz result
   page (answer all questions programmatically), vesting with leaver marker moved, equity with 3 founders
   with different inputs.
5. LOOK at your screenshots (open the PNGs) and fix visual issues: overflow, misalignment, contrast,
   cramped mobile layouts, chart labels overlapping, typos. Iterate until it looks premium.
6. README.md (Italian or English, your call — English is fine): what it is, stack, run/dev/test/build,
   env vars (BASE_PATH, SITE_URL), deploy to **GitHub Pages** (GitHub Actions workflow file included at
   `.github/workflows/deploy.yml` using `actions/deploy-pages`, with BASE_PATH set to `/<repo>/` unless a custom
   domain/CNAME is used), deploy to **Vercel** (framework Vite, output `dist`, BASE_PATH `/`; `vercel.json`
   with clean URLs / SPA rewrites as needed), custom domain notes (CNAME file / DNS records on Aruba: CNAME to
   `<user>.github.io` or Vercel's `cname.vercel-dns.com`), and a TODO list.
7. At the end, print a short report: what was built, test count/results, bundle size, screenshot list,
   known issues.

Do not ask questions — make reasonable decisions and note them in the README.
