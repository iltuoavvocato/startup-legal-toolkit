# MatchInvStar: review pack for Vincenzo

A one-page entry point to the investor-matching prototype (branch `feature/investor-matching`). Details and history
are in [`investor-matching.md`](investor-matching.md) (the brief, Milestones 1–15). Everything below is a front-end
demo: no backend, no network calls with user data, fictional data only, IT + EN.

To run it locally: `npm install && npm run build && npx vite preview` → <http://localhost:4173/>. All URLs below are
relative to the site root.

---

## 1. What exists

Every route has an Italian path and an English twin. "idx" = indexed and in the sitemap; "noindex" = kept out of
search engines.

### Core flow

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/` | `/en/investor-match/` | Landing: the idea, 4 steps, legal limits, startup / investor doors, "Come funziona il doppio consenso" (idx) |
| `/match-investitori/startup/` | `/en/investor-match/startup/` | Founder form: data + optional PDF deck (read locally) → findings review → profile → ranked investor matches (idx) |
| `/match-investitori/investitore/` | `/en/investor-match/investor/` | Investor form: thesis → anonymous startup teasers, "Allarga criteri" when nothing fits (idx) |
| `/match-investitori/doppio-consenso/` | `/en/investor-match/double-opt-in/` | Double opt-in simulator: both sides on one board, the "doppia chiave" (idx) |
| `/match-investitori/note-legali/` | `/en/investor-match/legal-notes/` | Legal limits and the "Da verificare con un avvocato" list (idx) |

### Agent (guided intake)

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/agente/startup/` | `/en/investor-match/agent/startup/` | Chat, one question at a time; deck findings confirmed in the chat; the agent explains each match (idx) |
| `/match-investitori/agente/investitore/` | `/en/investor-match/agent/investor/` | Same for an investor's thesis; "Mi interessa" / "Non ora" go to the shared inbox (idx) |

### Directory

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/investitori/` | `/en/investor-match/investors/` | 36 fictional investors: filters, search, sort, state in the URL (idx, see D29) |
| `/match-investitori/investitori/scheda/?id=i01` | `/en/investor-match/investors/profile/?id=i01` | One investor's thesis and criteria, fit with your profile, "Proponi il tuo profilo" (noindex) |

### Inbox

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/richieste/` | `/en/investor-match/requests/` | Requests "Come startup" / "Come investitore", deadlines, monthly counter, demo clock "Simula +7 giorni" (noindex) |

### Export

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/esporta/?tipo=startup` | `/en/investor-match/export/?type=startup` | Founder one-pager (anonymous teaser / full), print / PDF, `.md`, copy (noindex, nofollow) |
| `/match-investitori/esporta/?tipo=investitore` | `/en/investor-match/export/?type=investor` | Investor thesis sheet; `&id=i01` for a demo investor's sheet |

### Guided demo

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/demo/` | `/en/investor-match/demo/` | Split screen startup ↔ investor, 6 steps, branch A (intro) / B (a "no" stays invisible), `?step=N&branch=no` (noindex) |

### How it works

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/come-funziona/` | `/en/investor-match/how-it-works/` | Filters, score table from the code constants, bands, double opt-in, cap and expiry, interactive "Prova: perché questo match?" (idx) |

### Variants gallery (internal)

| IT | EN | Purpose |
|---|---|---|
| `/match-investitori/varianti/` | `/en/investor-match/variants/` | Five design directions V1–V5 and a compare mode (noindex, nofollow, out of sitemap) |
| `/match-investitori/varianti/vN/{landing,risultati,investitore,agente,investitori}/` | `/en/investor-match/variants/vN/{landing,results,investor,agent,directory}/` | 5 screens × 5 variants (N = 1…5) |

### Privacy

| IT | EN | Purpose |
|---|---|---|
| `/privacy/` | `/en/privacy/` | Site privacy note, with the "Demo MatchInvStar: dati solo su questo dispositivo" section and the "Cancella i dati della demo" button |

Also touched outside the section: the header nav item "Investitori" / "Investors", a "Nuovo · prototipo" band on the
home page, and the bilingual 404.

## 2. 10-minute walkthrough

Start in a fresh tab (the demo keeps state in sessionStorage, per tab). Italian first; the same path works under
`/en/…`. This is also what the e2e "journey" spec (`e2e/journey.spec.ts`) clicks through, in both languages.

| # | Min | URL | Click | Look for |
|---|---|---|---|---|
| 1 | 1 | `/match-investitori/` | Read the hero, the 4 steps, the legal limits; open "Come funziona il doppio consenso" | Prototype banner, "nome provvisorio", disclaimer at the bottom and in the footer |
| 2 | 1 | → "Sono una startup" (`/match-investitori/startup/`) | "Prova con un deck di esempio", then "Fai leggere il deck all’agente", "Salta" | "8 pagine lette sul tuo dispositivo"; "Il file non lascia il tuo browser" |
| 3 | 1 | same page, step "Cosa abbiamo trovato nel deck" | Look at snippets, pages, confidence; "Usa tutti i suggerimenti", "Applica le scelte e continua", "Conferma il profilo" | Nothing applied before you choose; "Fonte: dal deck, p. N" on the profile |
| 4 | 1.5 | same page, "I tuoi match" | Open "Perché questo match?" on a card; "Proponi il profilo" on one card, then "Le tue richieste" | Points per criterion add up to the score; reasons cite "(dal tuo deck, p. N)"; toast and counter 1/5 |
| 5 | 1.5 | → requests inbox (`/match-investitori/richieste/`) | Tab "Come investitore": answer a teaser "Sì, mi interessa". Back to "Come startup": "Simula +7 giorni" (once or twice) | Teasers have no startup name; a request either becomes "È interessato al tuo profilo" or stays "In attesa" (a no looks exactly like silence) |
| 6 | 0.5 | same page | "Accetta l'intro", open "Vedi l’email di presentazione" | Both fictional names, "via MatchInvStar", no investment advice |
| 7 | 0.5 | same page → "Esporta il one-pager" | Toggle teaser / full, "Scarica .md", "Stampa / Salva PDF" | Anonymous by default; disclaimer on the sheet and in the file |
| 8 | 1 | `/match-investitori/agente/startup/` | Answer a few chips, or add the sample deck | One question at a time; "Modifica" on any answer; same engine as the form |
| 9 | 1 | `/match-investitori/demo/` | "Avanti" through branch A, then switch to branch B (or `?step=5&branch=no`) | Branch B: the founder's card is identical to the "nobody answered" card |
| 10 | 0.5 | `/match-investitori/come-funziona/` | Change the selects in "Prova: perché questo match?" | 66 "Affine" by default; €150,000 excludes on the ticket filter |
| 11 | 0.5 | `/match-investitori/varianti/` | Open the compare view; pick V1 / V3 / V4 / V2 | Input for D14 / D50 / D51 |

Optional: `/match-investitori/investitori/` (filters → URL, Back works), `/match-investitori/note-legali/`,
`/privacy/` ("Cancella i dati della demo"), and the language switcher on any page (same route in the other language).

## 3. Open decisions D1–D51

"Default" is what the prototype does today. "M#" = the Milestone section in
[`investor-matching.md`](investor-matching.md) (D1–D11 are in §13 "Open decisions" and the "Decisioni" table).
Numbering note: D46/D47 were reused once. Milestone 12 first numbered its two decisions D46/D47, which Milestone 11
already used; they were renumbered to **D50/D51** (commit `8b7ba4d`). D46–D49 belong to Milestone 11.

Status: **Open** = needs your call; **Resolved** = settled by later work (how is noted); **Default** = built as
proposed, just confirm.

| # | Question | Default / recommendation | Status | Where |
|---|---|---|---|---|
| D1 | Header nav entry for the section? | "Investitori" in `NAV`; `brand-sub` hidden at 900–959px only | Default (built, checked at 899–1440px) | §13, Impl. notes |
| D2 | Route slug | `/match-investitori/` (generic, survives a rename) | Default | §13 |
| D3 | What the startup sees at the second key | Startup anonymous until both say yes; it sees the investor's name, type, thesis when asked | Default | §13 |
| D4 | Scope of the monthly limit | 5 proposals per startup per month (placeholder) | Default | §13 |
| D5 | Should pending requests expire? | — | Resolved: superseded by M5 (14-day expiry per step built); see D26 | §13, M5 |
| D6 | Score weights | Sector 30 · ticket 30 · stage 20 · area 20; lead at 40% coverage | Default | §13, M11 page shows them |
| D7 | Geography granularity | 20 regions (startup) / 4 macro-areas or all Italy (investor); Italy only | Default | §13 |
| D8 | UTM campaign for lawyer CTAs | `utm_campaign=match` | Default | §13 |
| D9 | Mention the deck on the privacy page? | — | Resolved: M10 added a privacy section on demo data and a clear button | §13, M10 |
| D10 | Taxonomy (11 sectors, 3 stages) | As proposed | Default | §13 |
| D11 | Home placement | Separate "prototipo" band below the 3 tools | Default | §13 |
| D12 | No-deck stepper label | "Analisi dei dati" / "Analysing your details" | Open | M1 |
| D13 | Static 404 without JS shows both languages | Keep both | Open | M1 |
| D14 | Which design direction to build on | V1 base; founder results V3-style; investor view V4 cards on mobile + V2 table on desktop; V5 optional dark theme | Open (main) | M2, refined in M12 |
| D15 | Keep the variants gallery deployed? | Recommendation: keep (noindex) for reviews, remove before a public launch | Open | M2 |
| D16 | V4 swipe gestures | Open; buttons always present | Open | M2 |
| D17 | Privacy page: mention the deck | — | Resolved: M10 privacy section says the PDF is read in the browser only | M3, M10 |
| D18 | Traction in the anonymous teaser? | Not shown (founder's explanations only) | Open | M3 |
| D19 | Deck limits 20 MB / 40 pages / < 60 chars = image-only | Placeholders | Open | M3 |
| D20 | "Usa tutti i suggerimenti" one click vs per-finding choice | Keep one click (nothing applied by default) | Open | M3 |
| D21 | Agent conversation in sessionStorage vs memory | sessionStorage, tab only | Open (storage); privacy-page part resolved in M10 | M4, M10 |
| D22 | Agent as the default entry? | Form stays the default; agent linked next to it | Open | M4 |
| D23 | Typical round sizes per stage, suggested amounts | Placeholders (pre-seed 50k–1.5M, seed 150k–5M, Series A 1M–30M) | Open | M4 |
| D24 | Keep "Simula la risposta" in agent results? | — | Resolved: M6/M9 replaced it with the inbox demo clock on both sides | M4, M6, M9 |
| D25 | Ask startup / founder names in the agent? | No names (neutral placeholders) | Open | M4 |
| D26 | Expiry 14 days per step vs one deadline; tell the founder why? | 14 days per step; never say why | Open | M5 |
| D27 | Does an expired proposal count toward the cap? | Yes (cap counts proposals sent) | Open | M5 |
| D28 | Inbox in sessionStorage vs localStorage | sessionStorage | Open (storage); privacy-page part resolved in M10 | M5, M10 |
| D29 | Index the fictional directory? | Indexed today; consider noindex until real data | Open | M5 |
| D30 | Real version: directory browsable by founders, or only after a match? | Demo shows thesis/criteria only, never contacts | Open | M5 |
| D31 | Route the agent's proposals through the same inbox? | — | Resolved: done in M6 (one inbox, one counter) | M5, M6 |
| D32 | Teaser export includes team/traction? | Included (founder's own document) | Open | M6 |
| D33 | "Tipi di investitore in linea" in exports | Kept; may hint at who the platform has | Open | M6 |
| D34 | QR / link back to the platform on exports | Not done (no public pitch pages) | Open | M6 |
| D35 | Agent's investor mode through the inbox's investor tab? | — | Resolved: done in M9 | M6, M9 |
| D36 | Darker gold #9c7a33 for italic accents on light backgrounds | Keep | Open | M7 |
| D37 | Run `npm run e2e` in CI on every PR | Not set up (workflows untouched) | Open | M7 |
| D38 | Per-language dictionary split for mobile LCP | Skipped (not contained; measured in M9/M12) | Open | M7, M9, M12 |
| D39 | "Allarga criteri": most matches vs cheapest single criterion | Most matches, deterministic tie-break | Open | M8 |
| D40 | Startup side: suggest more than the round? | Round only | Open | M8 |
| D41 | Keep the "/" search shortcut | Keep (desktop only) | Open | M8 |
| D42 | Guided demo autoplay pace; continue into branch B? | 6 s per step (placeholder) | Open | M9 |
| D43 | Guided demo noindex vs public explainer | noindex | Open | M9 |
| D44 | Third branch: founder declines after the investor's yes | Not built | Open | M9 |
| D45 | Trademark / legal clearance of demo names | Web-checked for obvious collisions only | Open (before go-live) | M10 |
| D46 | Link "Come funziona" from investor empty state and directory too? | Landing, results, guided demo only | Open | M11 |
| D47 | "Perché questo match?" on investor results too? | Founder-only | Open | M11 |
| D48 | English "intro" vs "introduction" | "intro" for short labels | Open | M11 |
| D49 | State that weights aren't tuned per investor? | Implied, not stated | Open | M11 |
| D50 | Agent chat in the final product: V3 bubbles everywhere, or V4 cards on phones? | V3 desktop, V4 phones | Open | M12 |
| D51 | Grow the variants gallery further, or freeze? | Freeze at five screens | Open | M12 |

## 4. Hard-rule compliance

| Rule | How it is enforced | How it is tested |
|---|---|---|
| No money handling, no orders | No payment, amount-transfer or order UI exists; amounts are criteria only. Legal notes and `LegalLimits` say so. `copyGuardrails.test.ts` (M14): every match dictionary IT + EN and all demo data, no payment / money-handling / order phrases outside a short allow-list of negations; e2e `how-it-works.spec.ts` (§6 "what matching does not do") |
| No investment advice | The score is described as overlap of stated criteria, "not quality"; intro email carries no advice `copyGuardrails.test.ts` (no "investi ora", "ti consigliamo di investire", "rendimento garantito", "we recommend", "guaranteed return"…); `explain.test.ts`; `optin.test.ts` (intro email content) |
| No public pitch pages | Startups appear only as anonymous teasers to investors; no per-startup URL; exports are local files with no link back (D34) | `exportDoc.test.ts` whitelist (no names in the teaser, no deck text); `guidedDemo.test.ts` (investor never sees the name before the intro) |
| No success fee | Copy: "Tariffe fisse, nessuna success fee" (landing limits, legal notes); no prices shown `copyGuardrails.test.ts` (no "commissione" / "commission" / "success fee" / percentage of the round, except "nessuna success fee" / "no success fee"; asserts those disclaimers are still there); IT/EN parity test |
| Double opt-in, a "no" never revealed | `optin.ts` / `inbox.ts` views: a declined request = an unanswered one, same deadline | `optin.test.ts`, `inbox.test.ts`, `agentInbox.test.ts`, `guidedDemo.test.ts` (day-by-day counterfactuals); e2e `founder-form.spec.ts`, `journey.spec.ts` (`REVEAL` wording never shown) |
| No backend, no external sends | Static build; pdf.js and fonts bundled; the sample deck is a same-origin asset | e2e auto fixture fails any non-localhost request or cookie (every test); `journey.spec.ts` intercepts all requests (off-origin = fail, non-GET = fail); `npm run screenshots` fails on external or non-GET requests |
| No trackers, no cookies | No analytics code; only `lang` in localStorage, demo state in sessionStorage `npm run check:dist` (M14, part of `npm run e2e`): no tracker signatures and no external origins in the built `dist/`; e2e cookie check (every test); language round-trip test asserts only `lang` in localStorage; privacy page clear button (e2e `hardening.spec.ts`) |
| Disclaimer on every page | Footer on every page + `Disclaimer` in tool content; 404 (static and React) and the error boundary include it; export sheet and `.md` too | e2e language-switch sweep on every main route (both languages); variant sweep on 25 × 2 screens; `journey.spec.ts` on each page visited; `seo.test.ts` (static 404); `export.spec.ts` (`.md`) |
| Fictional data, labelled | 36 investors + demo startups with invented names, `.example` emails; "Dati di esempio fittizi" on every demo surface; sample decks say fictional on every page `copyGuardrails.test.ts`: every email literal in `src/` ends with `.example`, no demo name or email domain looks like a real domain; demo-data sanity tests in `matching.test.ts`; variant sweep checks the fictional label |
| IT + EN everywhere | Every string in `src/i18n/messages/*` in both languages; every route has an EN twin with hreflang | `messages.test.ts` (identical keys, array lengths, function signatures; no empty EN strings); `routes.test.ts`, `seo.test.ts`; every e2e flow runs in IT and EN |

## 5. Known issues and limits (all milestones)

Matching and data
- The 36 investors and the startups are fictional; ticket values are illustrative, not market data.
- With the demo data the startup side practically never reaches zero matches; that path is unit-tested only.
- Weights are the same for every investor (D49); the score measures stated-criteria overlap only.

Deck reading
- Keyword heuristics: decks that say little in text (numbers in images, charts) give few findings; sector lists will
  need tuning on real decks.
- pdf.js 4.x needs a recent browser (Safari 17.4+, 2024+ Chrome/Edge/Firefox); older ones get the form-only flow.
  A browser that passes the feature check but fails inside pdf.js gets the generic "can't read" message.
- The worker is a 1.4 MB `.mjs` asset: the host must serve `.mjs` as JavaScript.

Agent
- The investor form's chips keep option order, so "first picked = main sector" only holds in the agent.
- Simulated answers are deterministic per id: a curious user can infer the demo outcome (the wording never says no).
- No names step in the agent (D25): intro emails and the full export stay unnamed from the agent.
- After a reload during the deck review the regular questions take over (the deck must be added again).

Inbox and opt-in
- No investor account: the investor tab shows seeded sample teasers; the other side's answers are simulated.
- Time travel only moves forward; "Azzera la demo" clears everything, profile included.
- The monthly counter follows calendar months: time travel across a month boundary resets it.
- The toast's Escape listener is document-wide (harmless today: the toast and the filter sheet can't be open together).

Export
- The full version can name the startup only when the name was typed in the form during this visit.
- Traction lines stay in the language in which they were accepted.
- Client-side navigation into the export page keeps the previous page's robots meta (the prerendered HTML is
  `noindex, nofollow`).
- Copy uses the Clipboard API; where blocked, the page asks to copy by hand.

Guided demo, how-it-works, variants
- The guided demo's startup is the sample deck of the current language (Vignalume IT / Kelpwise EN), so switching
  language changes the story's startup. The founder's "Non ora" is not a branch (D44).
- The how-it-works example uses one fixed demo investor.
- The M12 variant screens (agent chat, directory) are mock-driven: no free text, no search or full filters. The V2
  directory's results region is labelled with the page title.

Platform and quality
- Mobile LCP about 3 s (the content renders after the JS app; dictionaries for both languages are in the `app` chunk).
  Levers: D38 or real SSR/prerendered content.
- Lighthouse was measured on `vite preview`, not on the real host.
- axe covers automatic checks only; no screen-reader (NVDA/VoiceOver) pass yet.
- "Ricomincia" in the error fallback reloads; if the cause isn't stored data, the fallback shows again.
- The e2e suite takes several minutes on a shared machine; it is not in CI (D37).
- Responsive (M15): checked at 320 / 768 / 1366 px on every match route (overflow, clipped buttons, focus under the
  sticky header, 24 px targets); the variant screens only at 320. 200% zoom is covered as reflow, not text-only zoom.
- Forced colours (M15): checked in Chromium's emulation (light palette) on three screens; no real Windows
  high-contrast pass; the variant screens got no forced-colours work; a checked chip's tick shows as a filled square.
- Flakiness (M15): of three full runs, one test failed once (axe measured a card mid fade-in); fixed with `settle()`.
  The suite has no retries locally, so a loaded machine can still surface timeouts: re-run the spec alone first.

## 6. Before going live

Legal and naming
- Lawyer review of all matching copy: landing limits, legal notes, "Da verificare con un avvocato" (Reg. (UE)
  2020/1503, Consob, TUF art. 18 reserved activities, GDPR, AI Act transparency), intro email, how-it-works.
- Regulatory assessment that an introduction-only service with fixed fees stays outside reserved activities, and of
  the fee model itself (still undefined).
- Trademark / legal clearance of the product name (MatchInvStar is a working name) and of every demo name
  (investors, startups, sample decks), D45, or replace demo data with obviously generic labels.
- Privacy page review: operator details (legal entity, address, P.IVA, deliberately not invented), and a full
  information notice once any data is processed server-side.

Product decisions
- Confirm D1–D11 and close the open decisions above, at least D14/D50 (design), D4/D26/D27 (limits and expiry),
  D18/D32 (what investors see), D29/D30 (directory visibility), D22/D25 (agent role and names).
- Define fees (fixed, no success fee) and what the monthly limit really is.

Real data and backend
- Backend, accounts and investor identification/verification; real investor data with consent; how teasers are
  delivered to investors (still never public).
- Persistence choice (sessionStorage today, D21/D28) becomes server storage: legal basis, retention, DPIA where needed,
  minimisation (the teaser has no names).
- Whether decks are processed server-side or stay in the browser; if an LLM is used, AI Act transparency and human
  oversight wording.
- Real notifications/emails for intros (today: preview only).

Release hygiene
- Remove or protect the variants gallery (D15) and decide on the guided demo (D43) and the directory's indexing (D29).
- Replace the placeholder `SITE_URL`; decide the `NOINDEX` setting for the launch.
- Add `npm run e2e` to CI (D37); run a screen-reader pass; measure Lighthouse on the real host.
