# MatchInvStar – overnight build log (24 Oct 2026, Europe/Rome)

Draft PR: https://github.com/iltuoavvocato/startup-legal-toolkit/pull/1 (branch `feature/investor-matching`, never merged into main).

## Done
- 01:07 M1 known gaps: no-deck stepper label, no Italian flash for EN visitors, bilingual 404 (pushed ca1c5d8, 144 tests)
- 01:34 Variants gallery: 5 design directions × 3 screens + side-by-side compare, noindex (pushed 0ac657a, 219 tests)
- 02:00 Deck reading in the browser (pdf.js, local), review step, sample decks (pushed 67dcdde, 344 tests)
- 02:27 Agent-style guided intake for founders and investors (pushed d5bdb2c, 386 tests)

- 02:57 M5: investor directory (36 fictional investors, URL filters, mobile sheet, profile page) + requests inbox (expiry 14d, cap 5, time travel, badge) (pushed, 433 tests)

- 03:29 M6: local export (founder one-pager teaser/full, investor thesis, print A4, .md download, copy) + agent proposals in the shared inbox (455 tests)

- 04:27 M7: Playwright e2e (330 passed, IT/EN, desktop+mobile, no external requests/cookies), axe on all routes (0 serious/critical), Lighthouse mobile 91-95 perf, 100 a11y/BP/SEO; per-page chunks (458 unit tests)

- 04:54 M8: polish – no-match near misses + one-click "Allarga criteri", double opt-in explainer, illustrated empty states, toast, "/" search, consistent focus rings (467 unit, 358 e2e)

- 05:40 M9 done: guided split-screen demo /match-investitori/demo + /en/investor-match/demo (both double opt-in branches, "il no non viene mai rivelato" callout, in-memory inbox, deep links, keyboard, autoplay off under reduced motion); agent investor mode through the shared inbox (D35); profileOff removed; per-language dictionary split skipped (not contained, reason in brief). Gate: lint 0, 492 unit tests, build ok, e2e 378 passed + 4 a11y timeouts under box load avg 47 -> a11y spec re-run 160/160 green. Commits a728a8e, 5e9af57, 40359ab.

- 06:20 M10 done: colliding fictional names renamed (Contoverde->Contafiaba, Aulaviva->Lavagnoro, Voltaria->Ventilume, Lievita->Impastoria, Acceleratore Fucina->Acceleratore Scintillaio; D45: full trademark clearance is Vincenzo's call); stored-state hardening (deep validation, never-throwing reads, bilingual error boundary with 'Ricomincia'); pdf.js feature detection with graceful fallback; privacy page section + 'Cancella i dati della demo' button. Gate: lint 0, 503 unit tests, build ok, e2e 406 passed (new hardening.spec.ts). Commits e940ca6..ddda520.

- 06:55 M11 done: 'Come funziona il matching' / 'How matching works' page (/match-investitori/come-funziona/, /en/investor-match/how-it-works/) with numbers generated from matching.ts/matchConfig and an interactive scoring example; 'Perché questo match?' breakdown on every founder result card; EN/IT copy review (consistent terms, D46-D49). Gate: lint 0, 515 unit tests, build ok, e2e 430 passed / 2 skipped. Commits 197d74a, 2576449.

- 07:25 M12 done: variants gallery extended with agent chat + investor directory screens for V1-V5 (IT+EN, compare, e2e/axe); inbox sample teasers now seeded even if the agent's investor answered first (no duplicates); mobile LCP attempt measured (91-92, LCP ~3.1 s) and reverted - real fix needs D38/prerendered hero text. Brief: M12 decisions renumbered D50/D51 (collided with M11's D46/D47). Gate: lint 0, 519 unit tests, build ok, e2e 534 passed / 2 skipped. Commits dcb5c64, bda4a0d.

- 07:37 M13 done: review pack docs/briefs/investor-matching-review.md (all routes, 10-minute walkthrough, decisions D1-D51 with status/defaults, hard-rule compliance checklist with enforcing tests, consolidated known issues, go-live checklist), linked from brief + README; e2e/journey.spec.ts full founder->investor->intro->export story per language with disclaimer checks and request interception. Gate: lint 0, 519 unit, build ok, e2e 536 passed / 4 skipped (2 intentional mobile skips). Commits d1d5e66, 5e92a97.

- 08:01 M14 done: copy guardrail tests over every match dictionary (IT+EN) and demo data (no money/payments/orders/advice/guaranteed returns/success fee; explicit allow-list for negations; all demo emails .example); `npm run check:dist` (in `npm run e2e`) scans the build for external origins, trackers, robots/noindex policy, sitemap and disclaimer; real fix: the prerendered no-JS fallback of every page now includes the disclaimer (scripts/seo.mjs, replaced by React on load). Hero prerender for LCP skipped (app uses createRoot, needs SSR/hydration, not contained). Gate: lint 0, 557 unit, build ok, check:dist ok (89 pages), e2e 536 passed / 4 skipped. Commits 98a0d51, 391dc0a.

- 08:44 M15 done: responsive spec at 320/768/1366 on all 13 match routes + findings/results (overflow, clipped buttons, focus vs sticky header, 24px targets) with fixes (scroll-padding, directory sort select, inbox tabs, gallery buttons, V2 sort targets); forced-colours support + e2e on 3 screens; flakiness: 3 sequential full runs, one axe timing flake fixed with a settle() helper, no waitForTimeout left in e2e. Gate: lint 0, 557 unit, build ok, check:dist ok, e2e 628 passed / 4 skipped. Commits f1a463e, 460995e, 53f9018, 5cbd9c1.

## In progress
- 08:45 M16 (next): code health - dead code/dupes, bundle budgets in check:dist, stricter TS if small; no behaviour changes

## Next
