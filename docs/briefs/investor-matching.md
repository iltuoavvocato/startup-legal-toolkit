# Investor matching: implementation plan (step 1)

Source brief: `/workspace/cc-matching/brief.md`. Branch `feature/investor-matching`, this worktree only.
This is a front-end **prototype**: no backend, no network, no storage, and no LLM. The "agent" is a
deterministic mock. Product working name **MatchInvStar** (always shown as "nome provvisorio"). All UI copy is in Italian.

---

## 0. What I found in the repo (conventions to follow)

- **Pages** are flat in `src/pages/*Page.tsx`. Every tool page is `PageHero` (navy, `h1#page-title` focusable) → `section.section-cream.tool-section` → `.container` → `.card`s → `Disclaimer` → `CtaPanel`.
- **Layout** (`src/components/Layout.tsx`): a `NAV` array (header and footer), `usePageMeta(routeKey(pathname))`, focus moves to `#page-title` on navigation, and the UTM campaign comes from `pathname.includes(...)`.
- **Meta and prerender**: `src/routes-meta.json` → `metaFor()` (runtime) and `scripts/prerender.mjs` (writes `dist/<path>/index.html` with `mkdirSync recursive`, so nested paths work), plus the sitemap (priority 0.8 by default). Nothing else needs to change for new routes.
- **URL state**: `src/hooks/useQueryState.ts` exports `readQuery()` (seeds state once) and `useSyncQuery(params|null)` (replaceState, skips the first render). The brief calls it "useQueryState", but the real API is these two functions.
- **Logic**: pure TS in `src/lib/*.ts` with `*.test.ts` next to each file. The Vitest include is `src/**/*.test.ts`. There are 46 tests today, all passing. Formatting helpers are in `src/lib/format.ts` (`formatEuro`, `formatPercent`, `it-IT`).
- **Styles**: one `src/styles/global.css` (about 2500 lines) with tokens (`--navy-*`, `--gold`, `--gold-dark`, `--cream`, `--line`, `--radius 14px`, `--shadow`) and reusable classes: `.card`, `.card-title`, `.field`, `.input-affix`, `.segmented`, `.option` (radio card), `.pill`, `.badge`, `.notice`, `.details`, `.prose`, `.actions`, `.btn-{gold,navy,outline,ghost,text}`, `.progress`, `.stat-grid`, `.two-col`. A reduced-motion block already exists.
- **TS** is strict with `noUncheckedIndexedAccess`. ESLint runs with `--max-warnings 0` and `react-refresh/only-export-components`, so pages and components must export components only and data goes in `lib`/`data`.
- **Screenshots** (`scripts/screenshots.mjs`): `PAGES` [name, path] plus `STATES` functions. The script fails on console errors, external requests or horizontal overflow, so it doubles as the 390px overflow check.

## 1. Routes

All routes use a trailing slash, like the existing ones. Each is added to `src/routes-meta.json` with an Italian title and description, and to `App.tsx`.

| Route | Page | Content |
|---|---|---|
| `/match-investitori/` | `MatchLandingPage` | Idea, the 4 steps, legal limits, two CTAs, prototype banner |
| `/match-investitori/startup/` | `MatchStartupPage` | Intake + deck → agent → profile confirmation → "I tuoi match" (investors) |
| `/match-investitori/investitore/` | `MatchInvestorPage` | Thesis intake → "I tuoi match" (anonymous startups) |
| `/match-investitori/doppio-consenso/` | `MatchOptInPage` | Double opt-in simulator and monthly counter |
| `/match-investitori/note-legali/` | `MatchLegalPage` | Full legal limits and "Da verificare con un avvocato" |

Suggested meta:
- Landing: "Match con investitori (prototipo) | Startup Legal Toolkit" / "Prototipo dimostrativo di MatchInvStar: un agente propone match tra startup e investitori, con intro solo dopo il doppio consenso."
- Each of the other routes gets a short, specific title and description in the same style.

**State per route**
- Startup flow steps (`dati` → `analisi` → `profilo` → `match`) live in in-memory React state. Once the profile is confirmed, `useSyncQuery` mirrors **only enumerated fields** to the URL (`?settore=fintech&fase=seed&regione=lombardia&round=500000`), so results can be shared and reloaded straight into the `match` step. The free-text description, file name and founder name are **never** put in the URL (data minimisation).
- Investor flow works the same way: `?settori=fintech.saas&fasi=seed&min=25000&max=150000&aree=nord-ovest`.
- Opt-in simulator: `?s=<startupId>&i=<investorId>` (demo IDs, or `s=tu` plus the enumerated profile params when you arrive from your own results). The opt-in state itself stays in memory.

## 2. Files

**New**
```
src/lib/matchTaxonomy.ts      settori, fasi, regioni (20) → macro-aree, investor types; Italian labels
src/lib/matching.ts           filters, score, reasons, ranking (both directions)
src/lib/matching.test.ts
src/lib/optin.ts              opt-in state machine, per-side views, monthly limit
src/lib/optin.test.ts
src/lib/deck.ts               validateDeck(meta), mockExtract(meta, form), AGENT_STEPS, introEmail()
src/lib/deck.test.ts
src/data/matchDemo.ts         DEMO_INVESTORS (15), DEMO_STARTUPS (8), DEMO_LABEL = 'Dati di esempio'
src/pages/MatchLandingPage.tsx
src/pages/MatchStartupPage.tsx
src/pages/MatchInvestorPage.tsx
src/pages/MatchOptInPage.tsx
src/pages/MatchLegalPage.tsx
src/components/match/*.tsx    (see §3)
src/styles/match.css          all classes prefixed `mi-`; imported by the match pages only
```
The Vitest include `src/**/*.test.ts` already picks up the new tests. If `src/data/matchDemo.ts` gets a sanity test (unique IDs, valid enums), it goes in `src/data/matchDemo.test.ts`.

**Touched (additive only)**
- `src/App.tsx`: 5 `<Route>`s.
- `src/routes-meta.json`: 5 entries appended.
- `src/components/Layout.tsx`: one `NAV` item (see decision D1). Campaign detection gains `'match'` before the `'home'` fallback.
- `src/site.ts`: `ToolCampaign` gains `'match'`. Existing campaigns are unchanged.
- `src/pages/HomePage.tsx`: one new band *after* the tools grid ("Nuovo · prototipo"). The 3-card grid and "Tre strumenti…" copy stay untouched, so the copy stays accurate.
- `scripts/screenshots.mjs`: 5 `PAGES` and 3 `STATES` (see §8).
- `README.md`: a routes row, a decisions entry and TODOs (later step).

**Not touched**: `global.css` selectors (new CSS lives only in `match.css`), `prerender.mjs`, `vite.config.ts`, `.github/`, `vercel.json`, `useQueryState.ts`, existing `lib`, and the other pages.

## 3. Components (`src/components/match/`)

| Component | Role |
|---|---|
| `PrototypeBanner` | Full-width strip under the header: "Prototipo dimostrativo · MatchInvStar (nome provvisorio). Nessun dato viene inviato: tutto resta nel tuo browser." Links to the legal notes. On every match page. |
| `MatchSteps` | Section stepper (`<ol>` with `aria-current="step"`): Dati e deck · Profilo · Match · Doppio consenso. |
| `DemoBadge` | `pill` "Dati di esempio" on every list or card with demo data. |
| `ChoiceChips` | Multi-select checkbox chips inside `fieldset/legend` (settori, fasi, aree). Single-select variant uses the existing `.segmented`. |
| `DeckDropzone` | `<label>` wrapping a visually hidden `<input type=file accept="application/pdf,.pdf">`, plus drag and drop as an enhancement. Shows name and size and a "Rimuovi" button. Errors are tied to the input with `aria-describedby`. Never uses `FileReader`, `arrayBuffer` or object URLs. |
| `AgentProcessing` | Deterministic 4-step "L'agente sta leggendo il deck" checklist (setTimeout ≈ 450 ms per step, cleared on unmount). Announced through `aria-live="polite"`, with a "Salta" button. |
| `ProfileReview` | Editable extracted fields. Each field is tagged "dal deck (simulato)" or "dal modulo". Primary action: "Conferma il profilo". Note: "L'agente propone, tu decidi: niente viene usato senza la tua conferma." |
| `TeaserCard` | The anonymous teaser (settore, regione, fase, importo, one-liner, no names). Reused in the startup intake preview, investor results and the opt-in screen. |
| `MatchCard` | Rank, name (startup side) or teaser (investor side), `ScoreMeter`, reasons list and actions. |
| `ScoreMeter` | "82/100" in text, a thin bar (`aria-hidden`) and a label (Molto affine / Affine / Da valutare). |
| `FilterChips` | Summary of the active hard filters plus a "Modifica" button (back to the intake, values kept). |
| `ExcludedList` | `<details>` "Esclusi (n): perché non compaiono" with why-not strings. |
| `OptInBoard` | Two-column board, investor view and startup view, with the "doppia chiave" connector (§6). |
| `IntroEmailPreview` | `<article>` styled as an email: Da / A / Oggetto / body, signed "via MatchInvStar". |
| `ProposalCounter` | "3 di 5 proposte usate a ottobre" plus the "valore provvisorio" tag and a progress bar (existing `.progress`). |
| `LegalLimits` | Compact block (landing and the bottom of each page) with the five limits and a link to the legal notes. |

## 4. Data model (`matchTaxonomy.ts`, `matchDemo.ts`)

```ts
type Settore = 'fintech' | 'healthtech' | 'agritech' | 'cleantech' | 'saas-b2b' | 'edtech'
             | 'deeptech' | 'mobilita' | 'proptech' | 'foodtech' | 'consumer';
type Fase = 'pre-seed' | 'seed' | 'serie-a';
type Regione = 'piemonte' | 'lombardia' | … ;        // 20 regions, Italian labels
type Area = 'nord-ovest' | 'nord-est' | 'centro' | 'sud-isole';
const AREA_DI: Record<Regione, Area>;                 // ISTAT macro-areas (sud + isole merged)
type TipoInvestitore = 'business-angel' | 'club-deal' | 'micro-vc' | 'cvc' | 'family-office' | 'acceleratore';

interface Investor {
  id: string; nome: string; tipo: TipoInvestitore;
  settori: Settore[] | 'tutti';     // array: settori[0] is the main focus
  fasi: Fase[];                     // fasi[0] is the main stage
  ticketMin: number; ticketMax: number;   // € per operation
  aree: Area[] | 'italia';
  sede: Regione;
  tesi: string;                     // one Italian sentence
  referente: string; email: string; // fictional, on the reserved `.example` TLD (RFC 2606), e.g. nome@fondo.example
}

interface StartupProfile {
  id: string; nome: string; settore: Settore; fase: Fase; regione: Regione;
  round: number;                    // € sought
  oneLiner: string;                 // max 140 characters, shown in the teaser
  founder: string; email: string;   // fictional for demos; for "tu" the founder types a name (in memory only)
}
```
- **Demo data**: 15 investors (about 4 business angels, 3 club deals, 3 micro-VCs, 2 CVCs, 2 family offices, 1 accelerator) and 8 startups. All names are invented. I'll keep them clearly fictional and generic (place or nature words plus a type, e.g. "Club Deal Lanterna") and avoid anything that sounds like a known firm or person. They can't be checked against real registries offline, so the "Dati di esempio" label is the safeguard. Ticket values are illustrative and are not market data. The file header and UI say "Dati di esempio".
- The dataset is designed so the default demo ("Usa un esempio": fintech, seed, Lombardia, 500.000 €) yields about 6 matches across all three labels and about 9 exclusions covering **every** filter. That makes both lists meaningful.

## 5. Matching algorithm (`matching.ts`)

One pairwise core used in both directions:
```ts
evaluate(s: StartupProfile, i: Investor): Evaluation
  // { eligible, score, parts: {settore, fase, ticket, area}, reasons: string[], whyNot: string[] }
matchInvestors(s, investors): { matches: Ranked<Investor>[]; excluded: Excluded<Investor>[] }
matchStartups(i, startups):  { matches: Ranked<StartupProfile>[]; excluded: Excluded<StartupProfile>[] }
```
The `perspective` ('startup' | 'investitore') only changes how reasons are worded.

**Hard filters** (all must pass; each failure adds a why-not):
1. **Fase**: `s.fase ∈ i.fasi`
2. **Settore**: `i.settori === 'tutti' || s.settore ∈ i.settori`
3. **Area**: `i.aree === 'italia' || AREA_DI[s.regione] ∈ i.aree`
4. **Ticket ∩ round**: the investor's range `[ticketMin, ticketMax]` must overlap `(0, round]`, which means `i.ticketMin ≤ s.round`. Inputs are validated as `round > 0` and `min ≤ max`.

**Score (0–100), integer**, `score = round(P_settore + P_fase + P_ticket + P_area)`:

| Part | Max | Rule |
|---|---|---|
| Settore | 30 | 30 if `settori[0]` (main focus) · 20 if elsewhere in the list · 15 if `'tutti'` (generalist) |
| Ticket | 30 | `coverage = min(ticketMax, round) / round` → `30 × min(1, coverage / 0.4)`. Covering ≥ 40% of the round (a potential lead) earns full points. |
| Fase | 20 | 20 if `fasi[0]` (main stage) · 12 otherwise |
| Area | 20 | 20 if `i.sede === s.regione` · 14 if the startup's macro-area ∈ `aree` · 8 if only `'italia'` |

Labels: ≥ 80 "Molto affine", 60–79 "Affine", < 60 "Da valutare". The weights, the 0.4 threshold and the label bands are exported constants (`WEIGHTS`, `LEAD_COVERAGE`, `SCORE_BANDS`) and are explained on the results page in a "Come calcoliamo l'affinità" `<details>`, mirroring the equity page's "Come calcoliamo".

**Ordering** (fully deterministic): score ↓, then `P_ticket` ↓, then `P_settore` ↓, then name with `localeCompare('it')`, then `id`. Excluded entries: number of failed filters ↑, then name, then id. The input array order never affects the output.

**Reason strings** (startup perspective; the investor perspective mirrors them, e.g. "Fintech: il tuo settore principale"):
- Settore: "Il fintech è il suo settore principale" · "Investe anche nel fintech" · "Investitore generalista: valuta tutti i settori"
- Fase: "Investe soprattutto in fase seed" · "Investe anche in fase seed"
- Ticket: "Ticket da 25.000 € a 100.000 €: può coprire fino al 20% del round" · "Ticket fino a 600.000 €: potrebbe guidare il round" (coverage ≥ 0.4) · "…potrebbe coprire l'intero round" (coverage = 1)
- Area: "Ha sede in Lombardia, come te" · "Investe nel Nord-Ovest" · "Investe in tutta Italia"

Reasons come in a fixed order (settore, ticket, fase, area). Numbers use `formatEuro` and `formatPercent(…, 0)`.

**Why-not strings**:
- "Non investe in fase serie A (investe in: pre-seed, seed)"
- "Non investe nel settore edtech"
- "Non investe in Sud e Isole"
- "Ticket minimo di 250.000 €, superiore al round di 150.000 €"

## 6. Double opt-in state machine and monthly limit (`optin.ts`)

```
            INVESTOR_YES              STARTUP_YES
 proposta ───────────────▶ attesa-startup ───────────▶ intro
    │                           │
    │ INVESTOR_NO               │ STARTUP_NO
    ▼                           ▼
 chiusa-investitore          chiusa-startup
```
- `transition(state, event): OptInState` is pure. Invalid events are **no-ops** (they return the same state), and `RESET` returns to `proposta` from any state.
- `viewFor(state, side: 'investitore' | 'startup'): SideView` (`{ titolo, testo, azioni[], mostraIntro, rivelaNome… }`) is the "who sees what" contract:

| State | Investor sees | Startup sees |
|---|---|---|
| `proposta` | Anonymous teaser + "Sì, mi interessa" / "No, grazie" | "Il tuo profilo è attivo. Ti scriveremo solo se c'è un interesse reciproco." (neutral) |
| `attesa-startup` | "Interesse inviato. Riceverai un'intro solo se anche la startup accetta." | Investor name, type and thesis + "Accetta l'intro" / "Non ora" |
| `chiusa-investitore` | "Ok, non ti riproporremo questa startup." | **Identical to `proposta`** |
| `chiusa-startup` | **Identical to `attesa-startup`** | "Hai rifiutato. L'investitore non riceverà alcuna notifica del rifiuto." |
| `intro` | Intro email preview | Intro email preview |

  The core invariant (tested): a "no" can't be told apart from silence on the other side.
- `introEmail(startup, investor)`: oggetto "Intro: {startup} ↔ {investitore} (via MatchInvStar)" and a short Italian body. It introduces both parties by their fictional names, says both agreed, contains no investment advice, and closes with "Il team MatchInvStar (nome provvisorio)".
- **Monthly limit**: `MONTHLY_PROPOSAL_LIMIT = 5` (exported, commented "valore provvisorio"). `ProposalCounter = { month: 'YYYY-MM', used: number }`.
  `counterFor(month, prev?)` resets on a month change. `remaining(c, limit)`, `canPropose(c, limit)`, `consume(c, limit) → { ok: true, counter } | { ok: false, reason }`.
  The month is **injected** (no `Date` inside the lib), which keeps tests deterministic. The UI passes the current `YYYY-MM`.
  Default meaning: max N proposals the agent sends **on behalf of one startup** per calendar month (decision D4). From the startup results, "Proponi a questo investitore" consumes one. The 6th is disabled with "Hai raggiunto il limite di 5 proposte per questo mese (valore provvisorio)." The simulator page shows the same counter.

## 7. Deck mock (`deck.ts`)

> Superseded in Milestone 3: the deck is now really read in the browser (see "Milestone 3" below). The file-name
> heuristics and `mockExtract` are gone.

- `validateDeck({ name, type, size })`: PDF only (`type === 'application/pdf'` or `.pdf`) and size ≤ `MAX_DECK_MB = 20` (placeholder). Returns an Italian error string or `null`.
- `AGENT_STEPS`: ["Lettura del deck", "Individuazione di settore e fase", "Stima del round", "Bozza del profilo"].
- `mockExtract(meta | null, form)`: deterministic. Form values win. Missing fields are inferred from file-name keywords (e.g. `fintech`, `seed`, `serie-a`, `milano` → lombardia), then from a fixed demo extraction. The one-liner comes from the description (trimmed to 140 characters at a word boundary) or a fixed demo sentence. Each field carries `fonte: 'deck' | 'modulo' | 'esempio'`. The copy says plainly that this is a simulation: "In questo prototipo l'agente non legge davvero il file: i campi sono ricavati dal modulo e dal nome del file."

## 8. Tests

**`matching.test.ts`**
- Every filter excludes on its own (fase, settore, area, ticket) and produces the right why-not.
- Ticket edge: `ticketMin === round` is eligible; `round + 1` is excluded.
- Generalist (`'tutti'`) passes the settore filter and gets 15 points; `'italia'` passes the area filter and gets 8.
- Score: a perfect investor gets 100. Each part is checked at its tiers (30/20/15, 20/12, 20/14/8), and coverage 0.2 gives 15 ticket points. The score is always an integer in 0–100 across the whole demo dataset.
- Ordering: ties broken by ticket part, then name, then id. **A shuffled input gives the same output.** Excluded entries are sorted.
- Reasons: fixed order, Italian number formatting (`500.000 €`, `20%`), "potrebbe guidare il round" at coverage ≥ 0.4.
- Both directions: `matchStartups(i)` includes startup S iff `matchInvestors(S)` includes i, with the same score.
- Demo sanity: unique IDs, valid enums, `min ≤ max`; the default demo gives ≥ 1 match in every label band and ≥ 1 exclusion per filter.

**`optin.test.ts`**
- Happy path to `intro`. Each "no" path. Invalid events are no-ops (e.g. `STARTUP_YES` in `proposta`, anything after `intro` except RESET). RESET works from every state.
- `viewFor(chiusa-investitore,'startup')` deep-equals `viewFor(proposta,'startup')`. `viewFor(chiusa-startup,'investitore')` deep-equals `viewFor(attesa-startup,'investitore')`.
- The investor never sees the startup name before `intro`. `introEmail` contains both names and "via MatchInvStar".
- Limit: `consume` succeeds 5 times and fails on the 6th. A new month resets the counter. `remaining` is never negative. A custom limit works.

**`deck.test.ts`**
- Rejects non-PDF and files over the size limit; accepts `.PDF` in uppercase.
- `mockExtract` is deterministic: same input, same output. Form values beat file-name keywords, and keywords beat the demo default. The one-liner is ≤ 140 characters, and the `fonte` tags are correct.

**Gates**: `npm run lint`, `npm test` (46 existing tests plus the new ones), `npm run build`, `npm run screenshots`.

New screenshot `STATES`:
- `match-startup-results`: "Usa un esempio", then "Analizza il deck", then "Salta", then "Conferma il profilo"
- `match-investor-results`
- `match-optin-intro`: both "Sì"

## 9. UI and design approach

**Direction**: the brief pins the look to the existing toolkit, so there's no new palette or fonts. I'll use the same tokens, Playfair headings, Inter UI, navy hero, cream tool sections and white cards. Linear/Stripe-level polish comes from discipline: a tight 8px spacing rhythm, consistent card hierarchy (a primary card with `--shadow`, nested items flat with a `--line` border), tabular numbers for scores and euros (`font-variant-numeric: tabular-nums`) and restrained motion.

**One memorable element**: the **"doppia chiave"** on the opt-in screen. Investor and startup panels face each other, joined by a connector with a lock glyph. Each "Sì" turns one half of the connector gold. Only when both halves are gold does the intro email unfold between them, as the single orchestrated motion of the section (disabled with `prefers-reduced-motion`). A "no" leaves the connector grey and quiet. That visually expresses the rule that a no is never revealed. Everything else stays calm.

Copy and typography restraint: no extra eyebrows beyond the house `PageHero` one. Numbered markers appear only where the content really is a sequence (the 4 steps, the stepper). Gold text on cream/white uses `--gold-dark` for AA contrast. Gold on navy is fine.

| Screen | Desktop (≥ 980px) | Mobile (390px) |
|---|---|---|
| **Landing** | Prototype banner → navy hero (one-line idea, two CTAs "Sono una startup" / "Sono un investitore") → cream: the 4 steps as a horizontal sequence on a gold hairline → white: two "door" cards (startup / investor) with what each provides → `LegalLimits` (5 short items + link) → Disclaimer → CtaPanel (campaign `match`) | Steps become a vertical timeline. Doors stack. CTAs are full width. |
| **Startup intake** | `MatchSteps` on top. Two columns, 7/5: form on the left (settore select, fase `.segmented`, regione select, round `input-affix €`, one-liner textarea with a 140-character counter, `DeckDropzone`, "Usa un esempio" as a `btn-text` at the top right of the card). On the right, a sticky "Cosa vede l'investitore" live `TeaserCard` preview, with no name (it teaches the privacy model). | Single column. The teaser preview moves below the form as an open `.details`. The dropzone becomes a "Scegli il PDF" button (drag hint hidden on touch). |
| **Agent processing** | One centred card: the 4 steps tick from muted to done (✓ in gold-dark), short status line, "Salta" | Same, full width |
| **Profile review** | Two-column grid of editable fields with `fonte` pills. Footer bar: "Indietro" / "Conferma il profilo" | One column, sticky bottom action bar (like the equity mobile bar; respects safe-area) |
| **Results** (both sides) | `FilterChips` row + `ProposalCounter` on the right. A ranked list of `MatchCard`s (rank number, name or teaser, score block on the right, 2–4 reasons with check glyphs, actions "Proponi" / "Simula il doppio consenso"). `ExcludedList` below, then the "Come calcoliamo l'affinità" details. `DemoBadge` on the list header. | Cards full width with the score block above the reasons. Chips wrap. The counter moves under the chips. |
| **Opt-in simulator** | Scenario picker (demo pair select) + counter. The `OptInBoard`: investor panel, connector, startup panel; the intro email appears below the connector, spanning both. A state timeline (`proposta → … → intro`) as small text steps. "Ricomincia la simulazione". | Panels stack (investor on top, a vertical connector, then the startup). Each panel has a sticky label "Vista investitore" / "Vista startup" so both sides stay visible at once (no tabs: seeing both is the point). |
| **Legal notes** | `.prose` layout like the privacy page, with a highlighted `.notice` "Da verificare con un avvocato" listing | Same |

## 10. Accessibility

- One `h1` per page through `PageHero` (`#page-title`, so the Layout focus behaviour just works).
- On every internal step change, focus moves to the step heading (`tabIndex=-1`, the quiz pattern) and a visually hidden `aria-live="polite"` region announces "Passo 2 di 4: conferma il profilo". Opt-in state changes are announced as well ("L'investitore ha detto sì. Ora tocca alla startup.").
- All inputs have visible `<label>`s. Groups use `fieldset/legend`. Errors use `aria-describedby` plus `aria-invalid`, and the submit-time summary has `role="alert"`. The ticket min ≤ max check is shown inline.
- The dropzone is a native file input (keyboard and screen reader for free); drag and drop is only an enhancement. Chips are native checkboxes styled like `.option` with `:has(:focus-visible)` rings.
- The score is always in text ("82 su 100, molto affine"); bars are `aria-hidden`. The stepper uses `aria-current="step"`. Buttons are real `<button>`s, and disabled states come with an explanation in text.
- AA contrast (gold-dark on light backgrounds), 44px touch targets, `prefers-reduced-motion` turns off the connector/intro animation and the processing pulse, and nothing overflows at 390px (checked by the screenshots script).

## 11. Legal copy outline

`LegalLimits` (landing and the end of each page) and `MatchLegalPage`. Careful, generic wording ("in genere", "da verificare"):

1. **Cosa fa**: a directory and introduction service only. It shows profiles and makes an intro when both sides agree. It does not judge the merit of a startup or an investment.
2. **Cosa non fa**: no advice on investments (no recommendation to invest or not). It does not receive, hold or transfer money or financial instruments. There are no public fundraising pages and no public offer: teasers are shown only to individual registered investors, never published.
3. **Come guadagna**: fixed fees, no success fee, no percentage on the amount raised. No amounts are shown (prices are not defined).
4. **L'agente** (AI Act, transparency): users are told the matches come from an automated system. In this prototype it's a deterministic simulation with no AI. Human oversight: the agent only proposes; the founder confirms the profile and both sides decide on the intro.
5. **Dati personali** (GDPR): a real version would process founder and investor data. It would need a legal basis, an information notice, minimisation (the teaser has no names), retention periods and, in some cases, a DPIA. In this prototype nothing leaves the browser and the PDF is not read.
6. **Da verificare con un avvocato** (explicit list): Regolamento (UE) 2020/1503 sui fornitori di servizi di crowdfunding; Consob rules and supervision; TUF art. 18 (investment services and activities reserved to authorised entities) and whether the introduction activity could fall within them; GDPR; AI Act.
7. **Prima di una versione reale**: it needs a backend, investor identification, and a privacy and regulatory review. Link to ilTuoAvvocato through `LawyerCta campaign="match"`. Mention only the services already allowed (e.g. SAFE).

`Disclaimer` ("Strumento indicativo: non sostituisce una consulenza legale.") appears on every new page, near the results or decisions and in the footer. "Dati di esempio" appears on every demo surface.

## 12. Keeping existing pages unchanged

- Every change to shared files is **additive**: new routes, new meta entries, a NAV item, one `ToolCampaign` member and one new Home band. No existing component props, `global.css` selectors, lib functions or copy change. Match styles live in `match.css` under the `mi-` prefix, so they can't cascade into other pages.
- The NOINDEX flag works as before because `prerender.mjs` is untouched and new routes inherit the site-wide tag.
- **Regression checks**:
  - The 46 existing tests stay green.
  - Build before and after, then `diff` each existing route's prerendered `<head>` and body fallback in `dist/{,equity,vesting,quiz,privacy}/index.html` and `404.html` (only asset hashes may differ).
  - Build with `NOINDEX=true` and confirm `robots.txt` has no Sitemap line and every page has the noindex meta.
  - Compare existing-page screenshots before and after (only the header/footer nav and the Home band may differ).
  - Check the header at 900, 1024 and 1440px for nav fit.

## 13. Open decisions for Vincenzo

- **D1 Nav entry**: there's limited room in the desktop header between 900 and about 1060px (4 links plus the CTA). Proposal: add "Investitori" (short label) to `NAV`. If it doesn't fit at 900px, hide `brand-sub` only in that range. Alternative: footer link and Home band only, with no header change.
- **D2 Route slug**: `/match-investitori/` (proposed) vs `/investitori/` or `/matchinvstar/`. The name is provisional, so a generic slug avoids renaming later.
- **D3 What the startup sees at the second key**: proposed: the startup stays anonymous until both say yes, but when the startup is asked it sees the investor's name, type and thesis (the investor has already said yes). Alternative: both stay anonymous until the intro.
- **D4 Monthly limit scope**: proposed: 5 proposals per startup per month. Alternatives: teasers received per investor per month, or both. The value stays "valore provvisorio".
- **D5 Expiry**: should a pending request expire (e.g. after N days) so the investor sees "nessuna intro" instead of an indefinite wait? This isn't in the prototype; I'd show only a text note if you want it.
- **D6 Score weights**: settore 30 · ticket 30 · fase 20 · area 20, and "lead" at 40% coverage. These are product choices; please confirm or adjust.
- **D7 Geography granularity**: the startup picks one of 20 regions and the investor picks macro-areas or "tutta Italia". Is that fine, or do you want investors outside Italy or EU (excluded for now)?
- **D8 UTM campaign**: add `utm_campaign=match` for lawyer CTAs from the section, or reuse `home`?
- **D9 Privacy page**: it currently says "ripartizione quote, vesting e quiz". Add one sentence saying the deck in the prototype never leaves the browser? This touches an existing page's copy, so I won't do it by default.
- **D10 Taxonomy**: is the list of 11 sectors and 3 stages OK? (Pre-seed / seed / serie A; is "serie A" relevant for this audience?)
- **D11 Home placement**: a separate "prototipo" band below the 3 tools (proposed, so "Tre strumenti" stays true) vs a 4th tool card plus copy changes.

### Decisioni (default scelto, da confermare con Vincenzo)

| # | Default scelto, da confermare con Vincenzo |
|---|---|
| D1 | "Investitori" added to `NAV`, only if it fits at 900px (`brand-sub` hidden in that range only if necessary). Header checked at 900/1024/1440. |
| D2 | Slug `/match-investitori/`. |
| D3 | As proposed: the startup stays anonymous until both say yes; the startup sees the investor's name, type and thesis when asked. |
| D4 | As proposed: 5 proposals **per startup per month** (`MONTHLY_PROPOSAL_LIMIT`, valore provvisorio). |
| D5 | No expiry logic: text note only. |
| D6 | Weights as proposed: settore 30 · ticket 30 · fase 20 · area 20; lead coverage 40%. |
| D7 | As proposed: 20 regions (startup) / 4 macro-areas or "tutta Italia" (investor); Italy only. |
| D8 | `utm_campaign=match`. |
| D9 | Privacy page **not** changed. |
| D10 | Taxonomy as proposed (11 sectors; pre-seed / seed / serie A). |
| D11 | Separate home band below the 3 tools. |

---

**Build order (step 2, after approval)**: taxonomy + demo data → `matching.ts` + tests → `optin.ts`/`deck.ts` + tests → shared match components and `match.css` → pages (landing → startup → investor → opt-in → legal) → routes/meta/nav/home band → screenshots and visual QA at 1440 and 390 → regression diff → README.

## Implementation notes (step 2)

These are the differences from the plan above, decided while building:
- `src/lib/matchQuery.ts` (+ tests) holds the URL encoding and decoding and the investor form validation.
- `Investor.sede` is `Regione | null`. The investor form asks for the base region as an optional field, so there's no
  same-region bonus when it's missing.
- `match.css` is imported once in `src/main.tsx` **after** `global.css`. Importing it from pages put it before the
  global styles in the bundle.
- D1 outcome: at 900–939px the 4-item nav wrapped, so `.brand-sub` is hidden at 900–959px only (one additive rule in
  `global.css`). Checked at 899/900/930/959/960/1024/1440.
- Profile review shows the source of each field as text ("Fonte: dal deck (simulato)", "dal modulo", "esempio").
- Opt-in simulator: a pair the agent wouldn't propose (a filter fails) can't be sent, and the reason is shown.
- Regression: the prerendered HTML of `/`, `/equity/`, `/vesting/`, `/quiz/`, `/privacy/`, `404.html` and `robots.txt`
  is identical to the baseline (default and `NOINDEX=true` builds, asset hashes normalised). The existing CSS is
  identical apart from the one additive header rule. In screenshots of existing pages, only the header and footer nav
  rows differ, plus the new band on Home.

## Milestone 1 fixes (2026-10-24)

- **No-deck copy**: without a deck, the stepper's second step reads "Analisi dei dati" / "Analysing your details"
  (`startupFlowSteps(locale, hasDeck)` in `deck.ts`, tested), as the agent checklist and headings already did. The first
  step stays "Dati e deck", since that is where the deck can be uploaded.
- **No Italian flash for English visitors**: the prerendered Italian home has an inline `<head>` script that, when
  `localStorage.lang === 'en'`, calls `location.replace('/en/' + query + hash)` before the body is parsed. SEO is
  unchanged (crawlers have no stored value). Unit tests run the script against stubs (base path, storage errors);
  `npm run screenshots` checks end to end that only the English document reaches DOMContentLoaded.
- **Bilingual 404**: the React 404 page adds the disclaimer band. The static `404.html` contains both languages and
  picks English on `/en/…` paths before paint (lang, title, copy). Without JavaScript both are shown. The screenshot
  script serves `404.html` for unknown paths, as GitHub Pages and Vercel do, and checks IT and EN with JS on and off.

Open decisions for Vincenzo:
- **D12**: the no-deck stepper label ("Analisi dei dati" / "Analysing your details"). Is that wording OK, or should the
  step be hidden when there's no deck?
- **D13**: the static 404 shows both languages when JavaScript is off. Is that OK, or should it be Italian only?

## Milestone 2: UI variants gallery (2026-10-24)

What exists: a gallery at `/match-investitori/varianti/` (EN `/en/investor-match/variants/`) with five design
directions, each applied to the landing, the founder results and the investor view (15 screens × IT/EN), plus a
side-by-side compare mode. All screens are functional on the real engine and fictional data (filters/sort in V2, chat
steps in V3, swipe deck in V4, propose within the monthly limit, investor double opt-in with a simulated startup
answer). Everything is local state; a "no" is never revealed. All pages are noindex, nofollow and not in the sitemap.
Code in `src/variants/` (lazy-loaded, scoped CSS); see the README section "Design variants gallery".

- **V1 Editoriale**: magazine typography, white space, black/white + one gold accent. Pro: trust, readability, fits a
  law firm. Con: few items per screen, weak for comparing many investors.
- **V2 Dashboard**: tables, filters sidebar, score bars, sortable columns, keyboard. Pro: fast comparison, power users
  (investors). Con: cold for first-time founders; on mobile it becomes stacked rows.
- **V3 Agent-first**: chat where the agent explains each match, chip answers. Pro: makes the agent (the differentiator)
  visible, guides newcomers. Con: slower to scan, risk of looking like a generic chatbot.
- **V4 Card / swipe**: one card at a time, Pass / Interessato, drag and arrow keys, undo. Pro: best on mobile, double
  opt-in feels natural. Con: "dating app" feel; no side-by-side comparison.
- **V5 Dark premium**: ilTuoAvvocato black, white/grey text, mono figures, minimal gold. Pro: brand-consistent, exclusive.
  Con: less readable for long text, stands apart from the light toolkit.

Open decisions for Vincenzo:
- **D14 (main)**: which direction to build on. Recommendation: **V1 Editoriale as the visual base**, the founder results
  in the **V3** style (the agent explains each match), the investor view as **V4 cards on mobile** with a **V2 table view**
  toggle on desktop; V5 only as an optional dark theme. Alternative: pick one variant as is (V1 is the safest single
  choice).
- **D15**: keep the gallery deployed (noindex) for stakeholder reviews, or remove it before a public launch?
- **D16**: V4 swipe gestures: keep drag-to-decide, or buttons only (less "dating app")?

## Milestone 3: real deck reading in the browser (2026-10-24)

Variant fixes first:
- **V4 card/swipe on phones**: at ≤520px the card keeps the head, the score and two reasons; thesis, facts and the
  score breakdown move behind a "Dettagli" / "Details" disclosure, and Pass / Interessato stay pinned to the bottom of
  the screen while the deck is in view. At 390×844 both buttons are visible on first load without scrolling.
- **V2 dashboard**: the keyboard-shortcut legend (and the "/" hint in the search box) is hidden at ≤640px and on
  touch-only devices.

What exists:
- **Local reading** (`src/lib/pdfText.ts`): `pdfjs-dist` 4.x is an npm dependency, bundled in its own chunk and loaded
  only when a file is picked; the worker is a bundled asset (`?url`). No CDN, no font/CMap fetches, eval disabled.
  Placeholder limits: PDF only, 20 MB, 40 pages. Errors: encrypted, damaged, too many pages, image-only (fewer than 60
  characters of text): each has its own message plus "Puoi continuare senza deck…", and the flow falls back to the form.
- **Extraction** (`src/lib/deckExtract.ts`, pure and tested, IT + EN): sector, stage, round ask, city → region, team
  size, traction (MRR/ARR, revenue, users, customers, growth, pilots, LOI) and a cover tagline. Each finding has a
  confidence (0–1, shown as alta/media/bassa) and the snippet + page it comes from. Number formats: 1.5M, 1,5 mln,
  €800k, 800.000 €, 800 mila, $300k (non-euro amounts are flagged). Only findings are kept, not the deck text.
- **Review step** "Cosa abbiamo trovato nel deck" / "What we found in your deck" (new stepper step 3 when a deck was
  read): snippet, page, confidence and Usa / Modifica / Ignora for each finding; "Usa tutti i suggerimenti" is
  available, but nothing is applied by default. The note "Il file non lascia il tuo browser: viene letto qui, sul tuo
  dispositivo." is shown in the dropzone and on the review step.
- **Explanations**: the profile shows "Fonte: dal deck, p. N"; the results say which fields came from the deck, each
  reason resting on a deck value ends with "(dal tuo deck, p. N)", and accepted team/traction signals are quoted
  under each match (they don't count towards the score).
- **Sample decks**: `public/demo/deck-esempio-vignalume.pdf` (IT, agritech, Bari, seed, 800.000 €) and
  `public/demo/sample-deck-kelpwise.pdf` (EN, healthtech, Naples, seed, €1.2M), generated by
  `scripts/make-sample-decks.mjs` (pdf-lib, devDependency) and labelled as fictional on every page. The button
  "Prova con un deck di esempio" / "Try a sample deck" loads the one for the current language.
- **Copy**: the legal-notes page no longer says the deck isn't read; it now says it is read on the device with fixed
  rules and no AI. The privacy page is unchanged (see D17).
- **Tests**: extraction cases on realistic IT and EN texts, pdf.js (legacy Node build) on the real sample PDFs, error
  cases (blank pages → noText, 41 pages → tooManyPages, junk → unreadable, password → encrypted), review decisions and
  explanation helpers. `npm run screenshots` runs the sample-deck flow (read, review, results) in IT and EN, desktop and
  mobile, plus a broken-PDF fallback, and fails on any external **or non-GET** request.

Known limits:
- Keyword heuristics: decks that say little in words (big numbers on images, charts) give few findings. Sector lists
  are hand-written and will need tuning on real decks.
- pdf.js 4.x needs a recent browser (Safari 17.4+, Chrome/Edge/Firefox from 2024 on). Older browsers get the
  "can't read this PDF" message and the form-only flow.
- The worker is a 1.4 MB `.mjs` asset: the host must serve `.mjs` as JavaScript (GitHub Pages and Vercel do).

Open decisions for Vincenzo:
- **D17**: the privacy page doesn't mention the deck. Add one sentence ("il PDF del deck viene letto solo nel tuo
  browser e non viene inviato") now that the deck is really read? Not changed by default (as D9).
- **D18**: should accepted traction (e.g. "MRR 18.000 €") also appear in the anonymous teaser investors see? Today it
  is only used in the founder's match explanations.
- **D19**: limits of 20 MB / 40 pages and "fewer than 60 characters = image-only": OK as placeholders?
- **D20**: keep "Usa tutti i suggerimenti" (one click) or force a choice per finding?

## Milestone 4: guided intake, "Parla con l'agente" (2026-10-24)

Fix first: the V4 card/swipe variant now hides its keyboard legend on phones and touch devices (≤640px or
`hover: none`), like V2. The screenshot script fails if a shortcut legend is visible on the mobile captures.

What exists:
- **Routes** `/match-investitori/agente/startup/`, `/match-investitori/agente/investitore/` (EN
  `/en/investor-match/agent/startup/`, `/en/investor-match/agent/investor/`), in the it↔en mapping, prerendered and in
  the sitemap (the main matching pages are indexed, so these are too). A switch "Parla con l'agente / Compila il
  modulo" sits above the first step of both forms and on the agent pages; the landing doors link to both.
- **Conversation**: one question at a time in chat bubbles. Founder: deck (optional) → settore → fase → round
  (suggested amounts per stage; follow-up check when the amount is unusual for the stage) → regione → one-line pitch
  (optional) → confirm. Investor: settori (first picked = main) → fasi → ticket (suggested ranges per stage) → aree
  ("Tutta Italia" excludes the single areas) → sede (optional) → confirm. Each answer can be changed ("Modifica" on the
  bubble or in the profile panel, "Indietro"); after an edit the agent resumes at the first unanswered question.
- **Deck in the chat**: dropped at any point before the search (or the sample deck). Read with the M3 local reader;
  each finding is asked as "Ho trovato nel deck… Confermi?" with the snippet, page and confidence (Sì / Modifica / No).
  Accepted values skip the regular question and carry "dal deck, p. N"; a value that differs from an earlier answer is
  shown as a conflict; team and traction are confirmed together and only quoted in the explanations. Read errors are
  explained and the questions continue.
- **Results as the agent**: the same profile objects and engine as the forms. For each match: who (or, for investors,
  an anonymous teaser), why it fits, what doesn't fit (secondary sector, partial ticket, secondary stage, Italy-wide
  only, generalist), and the double opt-in next step for the current status, from IT/EN templates in
  `src/i18n/messages/intake.ts`. Local actions: propose (monthly limit 5), set aside, simulate the other side's answer,
  accept/decline the intro (founder); interested/pass and simulated startup answer (investor). A "no" reads exactly
  like no answer (tested on the status functions and the explanations). Optional "Perché alcuni non compaiono?".
- **Implementation**: `src/lib/intakeAgent.ts` is a pure reducer (state holds ids and values only, so the same
  conversation renders in either language), with 42 unit tests (branching, skip, edit/back, validation, deck
  confirmations and conflicts, opt-in, explanations, storage, both languages). UI in `src/pages/MatchAgentPage.tsx` and
  `src/components/match/agent/`. Chips are buttons, focus moves to the new question, the transcript is a polite
  `role="log"`, the typing animation respects `prefers-reduced-motion` and has "Salta l'animazione".
- **Storage**: sessionStorage, this tab only (`matchinvstar-agent-startup` / `-investor`), cleared by "Ricomincia".
  Never deck text: findings and snippets are dropped; the cover sentence is kept only if accepted as the pitch. After a
  reload during the deck review, the regular questions take over (the deck would need to be added again).
- **Screenshots**: full scripted conversations, founder with and without deck and investor, IT + EN, desktop + mobile
  (`scripts/agent-flows.mjs`, `screenshots/match-agent-*`, `screenshots/en-match-agent-*`).

Known limits:
- The investor form's chips keep option order, so there "the first sector you pick is the main one" isn't strictly
  true; the agent keeps click order. Not changed in the form (out of scope).
- Simulated answers are deterministic per id, so a curious user can infer the demo outcome; the wording never says no.
- The agent pages have no "names" step: profiles use the neutral placeholders ("La tua startup") in intro emails.

Open decisions for Vincenzo:
- **D21**: sessionStorage for the conversation (tab only) vs memory only like the forms. The privacy page still says
  only the language preference is stored; add a sentence about this (and D17)?
- **D22**: should the agent become the default entry ("Sono una startup" → agent), with the form as the alternative?
- **D23**: typical round sizes per stage that trigger the follow-up check (pre-seed 50k–1,5M, seed 150k–5M,
  serie A 1M–30M) and the suggested amounts/ticket ranges: placeholders, please confirm.
- **D24**: keep "Simula la risposta" in the agent results, or leave simulation only to the double opt-in page?
- **D25**: ask for the startup / founder names in the conversation (for the intro email), or keep them out?

## Milestone 5: investor directory and double opt-in inbox (2026-10-24)

What exists:
- **Dataset**: 36 fictional investors (was 15), every type represented, theses in IT and EN, names built from plants and
  stones so they don't resemble real funds or people; labelled "Dati di esempio fittizi" / "Fictional sample data" on
  every directory, profile and inbox page. The matching tests still pass on the larger set (the default example now has
  7 matches).
- **Directory** `/match-investitori/investitori/` (EN `/en/investor-match/investors/`), indexed and in the sitemap,
  linked from the landing. Filters stage / sector / startup region / type / ticket range, text search, sort (name,
  ticket up/down, fit when a profile exists). State in the URL (shareable; Back undoes filter changes; typing replaces),
  count, chips, "Azzera filtri", empty state with suggestions, bottom sheet on phones. `src/lib/directory.ts` + tests.
- **Investor profile** `/match-investitori/investitori/scheda/?id=…` (noindex, one prerendered page reading the id):
  criteria, thesis, fit, "Proponi il tuo profilo" through the inbox, or agent/form links without a profile; link to
  the double opt-in simulator. No contact details.
- **Requests inbox** `/match-investitori/richieste/` (EN `/en/investor-match/requests/`, noindex): founder / investor
  tabs, In attesa / Accettate / Scadute, "Scade tra N giorni", monthly counter, demo time travel "Simula +7 giorni",
  "Azzera la demo", header/banner badge for requests waiting for your answer. `src/lib/inbox.ts` (pure, injected clock)
  reuses the `optin.ts` state machine and adds `createdAt` / `stepAt` timestamps and simulated answers. Placeholders in
  `src/lib/matchConfig.ts` (expiry 14 days, cap 5, time travel 7 days); `MONTHLY_PROPOSAL_LIMIT` moved there and is
  re-exported by `optin.ts`.
- **No-reveal invariant**: a declined request keeps the same view as an unanswered one at every moment (waiting with
  the same days left, then expired at the same deadline); the investor never sees the startup name before the intro;
  re-proposing is possible after expiry, equally for declined and unanswered. Tested on views, simulated answers, counts,
  badge and the duplicate rule; `npm run screenshots` also scans both tabs after time travel for wording that would
  reveal a no.
- The startup form's results now record proposals in the inbox (same counter across pages) and save the confirmed
  profile; the guided intake saves the founder profile when it reaches the results.

Known limits:
- The investor tab shows seeded sample proposals (the demo has no investor account); answers there are simulated.
- Time travel only moves forward; "Azzera la demo" clears everything (profile included).
- The monthly counter follows calendar months, so time travel across a month boundary resets it (expected but can
  surprise in a demo).
- The guided intake keeps its own in-conversation proposal counter; its proposals are not (yet) added to the inbox.
- The profile page is one prerendered page reading `?id=`: no per-investor title or meta (it is noindex anyway).

Open decisions for Vincenzo:
- **D26**: expiry of 14 days per step (the investor's answer, then the founder's) — OK, or one deadline for the whole
  request? Should a founder be told *why* a request expired (never, under the no-reveal rule)?
- **D27**: does an expired proposal still count toward the monthly cap (today: yes, the cap counts proposals sent)?
- **D28**: sessionStorage for the inbox (tab only, consistent with D21) vs localStorage (survives closing the tab). The
  privacy page still only mentions the language preference (see D17/D21).
- **D29**: index the directory of fictional investors (today indexed, like the other matching pages) or noindex it until
  real data exists? The profile and requests pages are noindex.
- **D30**: in a real version, should investors be browsable by founders at all, or only after a match (some investors
  won't want a public-ish listing)? The demo shows thesis and criteria only, never contacts.
- **D31**: route the guided intake's "propose" through the same inbox (one counter everywhere)?

## Milestone 6: local export and one inbox for the agent (2026-10-24)

What exists:
- **One inbox (D31 → done)**: the guided intake's founder proposals go into the shared requests inbox
  (`src/lib/agentInbox.ts`, tested), with the same monthly counter as the form results and the directory. Each agent
  match reads its status from the inbox: waiting (link to the requests and "Simula +7 giorni", the inbox's demo clock),
  the investor is interested (accept / "Non ora"), intro, declined by you, expired ("Proponi di nuovo"). The agent's
  own counter, board and "Simula la risposta dell'investitore" for founders are gone; the conversation no longer stores
  a counter (older stored conversations are still restored). The no-reveal invariant is tested on the agent side too:
  an investor's no gives the same status and badge count as silence at every day up to and after the deadline, and
  re-proposing after expiry works the same way. The investor mode of the agent is unchanged (local board).
- **Local export** `/match-investitori/esporta/?tipo=startup|investitore` (EN `/en/investor-match/export/?type=…`),
  `noindex, nofollow`, not in the sitemap. Founder one-pager (anonymous teaser / full version), investor thesis sheet,
  or a fictional demo investor's sheet (`&id=`). Print / Save PDF (A4 named page, only the sheet is printed, the
  disclaimer stays), Markdown download, copy as text. Empty state with links to agent and form. Entry points: form and
  agent results (both sides), requests inbox, investor profile. Pure builder `src/lib/exportDoc.ts` with a whitelist
  (no deck text, snippets, descriptions, founder names or e-mails; typed names Markdown-escaped; disclaimer always
  present), IT + EN, tested. Exportable profile in sessionStorage `matchinvstar-export`; names typed in the forms reach
  the page only as router state.
- **Screenshots**: `screenshots/*match-export-*` (empty, teaser, full, with deck, investor, demo investor, from the
  agent; IT/EN desktop/mobile), `*-print.png` (print media) and `match-export-startup.pdf`,
  `en-match-export-startup.pdf`, `match-export-investor.pdf`, `en-match-export-demo-investor.pdf` (Chrome
  print-to-PDF, checked to be one A4 page), and `*match-requests-from-agent-*` (an agent proposal listed in the inbox).

Known limits:
- The full version can only name the startup when the founder typed a name in the form in this visit (router state);
  after a reload, or from the agent (which asks no names, D25), the full version stays unnamed and says so.
- Traction lines are stored as text in the language used when they were accepted; switching language later keeps them
  in that language.
- Client-side navigation into the export page keeps the previous page's robots meta (the existing `usePageMeta`
  behaviour for pages with a static robots tag); the prerendered export HTML, which crawlers see, is `noindex, nofollow`.
- Copy uses the Clipboard API; where it is blocked, the page says to copy by hand.

Open decisions for Vincenzo:
- **D32**: the anonymous teaser export includes accepted team and traction (the founder's own document). Should it
  follow D18 instead (traction only if investors will see it in the platform teaser too)?
- **D33**: the "Tipi di investitore in linea" section is computed on the fictional demo investors. Keep it in a real
  version (it hints at who the platform has), or drop it from shareable exports?
- **D34**: should the export also offer a QR/link back to the platform? Not done: there are no public pitch pages by
  design.
- **D35**: investor mode of the agent: its "interested / pass" stays local to the conversation (the inbox's investor tab
  shows seeded sample proposals). Route it into the inbox's investor tab too?

## Milestone 7: quality — e2e, accessibility, performance (2026-10-24)

What exists:
- **E2E** (`npm run e2e` = build + `playwright test`; `npm test` stays unit-only). `@playwright/test` on the system
  Chrome (`channel: 'chrome'`, no browser download), against the production build served by `scripts/serve-dist.mjs`
  (`webServer`). Projects `desktop` (1440×900) and `mobile` (Pixel 7); every flow runs in IT and EN. Copy is read from
  `src/i18n/messages`, so tests follow copy changes. An auto fixture fails any test that makes a request to a
  non-localhost host or ends with a cookie set (checked to really fail with a deliberate leak and cookie).
  Specs: founder form (sample deck uploaded through the file input → findings → results → propose → inbox pending →
  4 × "+7 giorni" → expired, no "no" wording at any step), agent (founder with sample deck → proposal in the shared
  inbox; investor → interest → start over), directory (filters in the URL, Back/Forward/reload, profile → propose →
  counter 4/5 in the inbox), export (teaser ↔ full, `.md` download names and disclaimer in both versions, noindex),
  15 variant screens × 2 languages (banner, fictional label, disclaimer, noindex, one h1) and the compare view (controls
  → query string → iframes in embed mode), language switcher round trip on all 17 main routes in both directions (only
  `lang` in localStorage) and with a query string, bilingual 404, lazy page chunks (slow chunk → heading still focused;
  direct visit → no loading text), keyboard-only (agent chips with Tab/Space/Enter and focus following the
  conversation; V4 arrow keys and Tab/Enter on the buttons; directory filter sheet: Tab/Shift+Tab stay inside, Escape
  closes, focus back to "Filtri").
- **Accessibility**: `@axe-core/playwright` (WCAG 2.0/2.1 A + AA) on all 32 routes × IT/EN, the 404 and the key states
  (deck findings review, form results, agent mid-flow and results, inbox both tabs and after time travel, export sheet,
  directory with the sheet open on phones), desktop and mobile. Serious/critical fail the test. **No rule is disabled.**
  Fixed:
  - colour contrast: gold italic in `h2` on white/cream sections (home "all'inizio", 2.3:1) now `--gold-heading`
    #9c7a33 (≥3.3:1, large text); V1 large gold numerals now `--v1-gold-numeral` #9c7a33. Gold on navy is unchanged.
  - chat transcripts (agent and V3): `role="log"` moved from the `<ol>` to a wrapper `<div>`, so the list keeps list
    semantics (the `<li>` were invalid).
  - agent profile panel: the "Modifica" button sits in its own `<dd>` (a `<dl>` group may only hold `dt`/`dd`); same look.
  - horizontally scrollable regions (equity formula, V2 tables without controls) are focusable (`tabIndex=0`).
  - directory: a visually hidden `<h2>` above the cards (heading order on phones, where the filters' h2 is in the sheet).
  - directory filter sheet: explicit focus trap (a modal `<dialog>` alone lets Tab reach the browser chrome).
- **Performance** (`npm run lighthouse`, reports in `screenshots/lighthouse/`, git-ignored). Cheap wins, no visual change:
  - every page is its own chunk (`src/routePages.tsx`); shared code grouped into `app` / `ui` / `match` / `deck` chunks.
    Entry JS 611 kB → 398 kB (187 → 126 kB gzip); home no longer downloads the matching code.
  - the current page's chunk loads before the first render (no loading flash/shift); the prerendered HTML has
    `modulepreload` for it (from Vite's manifest, deleted from `dist/` after use); links prefetch on hover/touch/focus;
    focus after navigation waits for the lazily rendered heading.
  - Playfair (roman + italic) preloaded: the late swap re-wrapped the hero title and shifted the page (startup form CLS
    0.215 → 0). Inter is not preloaded (no measurable shift, and it would take bandwidth from the scripts).

Lighthouse 12, local `vite preview`, simulated throttling (mobile = Moto G Power / slow 4G, desktop preset):

| Page | Mobile Perf | A11y | Best pr. | SEO | Desktop Perf | Mobile LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 95 | 100 | 100 | 100 | 100 | 2.9 s | 0 |
| `/match-investitori/` | 93 | 100 | 100 | 100 | 100 | 3.0 s | 0 |
| `/match-investitori/startup/` | 92 | 100 | 100 | 100 | 100 | 3.2 s | 0 |
| `/match-investitori/agente/startup/` | 93 | 100 | 100 | 100 | 100 | 2.9 s | 0 |
| `/match-investitori/investitori/` | 93 | 100 | 100 | 100 | 100 | 3.0 s | 0 |
| `/en/` | 94 | 100 | 100 | 100 | 100 | 2.9 s | 0 |
| `/en/investor-match/` | 94 | 100 | 100 | 100 | 100 | 3.0 s | 0 |
| `/en/investor-match/startup/` | 91 | 100 | 100 | 100 | 100 | 3.2 s | 0 |
| `/en/investor-match/agent/startup/` | 91 | 100 | 100 | 100 | 100 | 3.2 s | 0 |
| `/en/investor-match/investors/` | 95 | 100 | 100 | 100 | 100 | 2.7 s | 0 |

Desktop: Accessibility, Best Practices and SEO are 100 on every page above. Before this milestone (IT, mobile): home 91,
landing 92, startup form 82 (CLS 0.215), agent 91, directory 93 (A11y 99, heading order). Scores move ±2 between runs.

Known limits:
- Mobile LCP stays around 3 s: the page is rendered by JavaScript (the prerendered HTML only has a static h1 +
  description), and the `app` chunk carries both languages' dictionaries (~217 kB raw). Splitting the dictionaries
  per language, or real server-side prerendering of the content, are the next steps if needed.
- Lighthouse runs against `vite preview` (HTTP/1.1, no compression headers); the real host (Pages/Vercel, HTTP/2 + gzip/
  brotli) should do as well or better.
- axe covers what can be checked automatically; there is no screen-reader pass (NVDA/VoiceOver) yet.
- The e2e suite takes about 3.5 minutes with half the CPU cores (`E2E_WORKERS` to change).

Open decisions for Vincenzo:
- **D36**: the darker gold (#9c7a33) for italic accents in headings on light backgrounds — fine as a brand variant, or
  would you rather drop the gold accent on light sections?
- **D37**: run `npm run e2e` in CI on every PR (GitHub Actions with Chrome)? Not set up: workflows are not touched in
  this branch.
- **D38**: worth the per-language dictionary split (see known limits) for faster first load on phones, or is ~92 enough?

## Milestone 8: UI polish, empty states, keyboard (2026-10-24)

What exists (same look; all copy IT + EN in `src/i18n/messages/polish.ts`):
- **Audit fixes** (390 / 1440 px, IT + EN screenshots): one primary per view in the inbox ("Simula +7 giorni" is now
  outline, the empty state's "Sfoglia la directory" stays primary); the export link is hidden in the inbox when there is
  nothing to export; long names, amounts and chips wrap (`overflow-wrap: anywhere`, tabular figures in the profile
  chips); one focus ring on every matching control (3px gold, 2px offset, including chips, tabs, toast and empty-state
  buttons).
- **Empty / edge states**: no matches → the closest misses with why-not and the single edit that brings the most matches
  (`src/lib/relax.ts`, 9 unit tests: deterministic, never mutates, the suggestion always adds ≥ 1 match). Investor side:
  "Allarga criteri" widens the thesis in one click (form, URL and results update; focus moves to the results heading;
  announced). Startup side: only the round can change ("Porta il round a …") since sector, stage and region are facts.
  Inbox: illustrated empty card per tab and explanatory text per empty group; directory without a profile; export
  without a profile; deck read but no findings; agent "Conversazione ripristinata" after a reload. Illustrations are
  inline SVG with brand tokens, `aria-hidden`.
- **Keyboard**: the global skip link (already in the layout) is now tested on match pages; "/" focuses the directory
  search on desktop only (fine pointer, ≥ 900px; ignored while typing or with a dialog open; `aria-keyshortcuts` plus
  a described hint); Escape closes the filter sheet (as before), the mobile menu (focus back to the menu button) and the
  toast.
- **Micro-interactions** (only with `prefers-reduced-motion: no-preference`): chip press and check "pop", "Proposta
  inviata" fade-in, toast and explainer steps fade up. The toast "Proposta inviata – in attesa del consenso: <nome>.
  Restano N proposte questo mese." is a polite live region.
- **`ConsentExplainer`** "Come funziona il doppio consenso" (3 illustrated steps, link to the simulator) on the landing
  (full), both results pages and the inbox (compact).
- **Tests**: 467 unit tests (9 new); e2e `e2e/polish.spec.ts` (6 checks × IT/EN × desktop/mobile = 24) and axe on the empty-results and toast
  states. Screenshots: `screenshots/*match-investor-nomatch-*` (new).

Known limits:
- With the 36 demo investors the startup side practically never has zero matches; the startup "no matches" path is
  covered by unit tests and the same component as the investor side.
- The toast's Escape listener is document-wide; if the filter sheet were open at the same time both would close (they
  can't be open together today).

Open decisions for Vincenzo:
- **D39**: "Allarga criteri" picks the edit that adds the most matches (ties: fewer criteria changed, then ticket → area →
  stage → sector). OK, or should it always prefer the cheapest single criterion?
- **D40**: should the startup side ever suggest changing more than the round (e.g. "investors in the next region")? Today
  it doesn't, because sector/stage/region describe the startup.
- **D41**: keep the "/" shortcut (desktop only) or drop it as power-user noise?
