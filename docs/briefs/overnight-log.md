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

## In progress
- 05:41 M10 (next): rename colliding fictional names, storage hardening + error boundary, pdf.js feature detect, privacy section

## Next
