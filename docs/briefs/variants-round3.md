# Design variants – round 3 (branch feature/investor-matching-b)

Status (2026-10-24, 10:41 Europe/Rome): **screens delivered, not browser-tested.** The WIP patch was applied and passes
this round's gate: `npm run lint` (0 warnings), `npx vitest run` (37 files, 570 tests), `npm run build` (typecheck +
prerender, 109 HTML pages) and `npm run check:dist` (sizes within budget, no external origins, disclaimer present).
Because the machine was heavily loaded, e2e, screenshots and Lighthouse were skipped by instruction.

## Done

- `src/variants/logic/inboxMock.ts` (+ unit tests, from the earlier partial commit): a mock double opt-in inbox
  built on the real rules in `src/lib/inbox.ts`. On the founder side it has five proposals: interested (your turn),
  waiting, **declined** (as old as the waiting one), intro and expired. On the investor side it has four seeded
  anonymous teasers. The tests check that a declined proposal produces exactly the same row as an unanswered one,
  both before and after the deadline, and that teasers stay anonymous until the intro.
- Routes: `requests` and `export` screens for V1–V5 (`/match-investitori/varianti/vN/{richieste,esporta}/`,
  `/en/investor-match/variants/vN/{requests,export}/`). All are prerendered with `noindex, nofollow` (checked in
  the built HTML), show the disclaimer, and label the data as fictional. The gallery grid and the compare view pick
  them up through `SCREENS`, and `src/i18n/seo.test.ts` covers 5 × 7.
- IT/EN copy (`requestsMock`, `exportMock`) and the hooks `useRequestsMock` / `useExportMock`
  (`src/variants/shared/useRound3.ts`). The export hook uses the real `buildStartupDoc` teaser.
- Per-variant `Requests.tsx` / `Export.tsx` + CSS for V1–V5. Rows draw only on title, detail, status and due date,
  which are the fields `viewOf()` exposes. A declined proposal therefore shows as "waiting"/"In attesa" on the
  founder side. The only "passed" label is `declined-by-you`, which the user sees for their own decline. V2 Export
  turned out to exist in the patch: it is a spec-sheet layout of the real teaser.
- Shared forced-colours rule for the banner's current screen/variant (`.vx-seg a[aria-current]`).
- `e2e/variants-round3.spec.ts` (render, invariant, axe, 320 px overflow, compare switching, one forced-colours test
  per variant) is committed **but was not run**.

## Untested / pending

- e2e: `E2E_PORT=4289 npm run e2e` has not been run, so axe, 320 px overflow, forced colours and compare switching
  for the new screens are unverified.
- Screenshots: `PREVIEW_PORT=4279 npm run screenshots` has not been run. No visual review was done of the 10 new
  screens × IT/EN × desktop/mobile. The per-variant CSS hasn't been looked at in a browser.
- Lighthouse: not run.
- No human or agent code review of the per-variant screens beyond typecheck/lint.

## Comparison table and updated recommendation

Still not written: it needs the screenshots to be reviewed first. The recommendation from round 2 (gallery
`decisionText`) still stands.

## Suggested next run

On an unloaded machine: run e2e and screenshots (ports above), fix any visual or a11y breakage, then write the V1–V5
comparison across the seven screens.
