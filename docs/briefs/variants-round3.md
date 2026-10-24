# Design variants – round 3 (branch feature/investor-matching-b)

Status at the 10:25 hard limit (2026-10-24): **not delivered.** Only the parts that were tested and self-contained are
committed. The screens were reverted because the quality gate (build + e2e + screenshots) couldn't run in time on this
machine, which was heavily loaded: a 4-test vitest file took ~95 s.

## Committed

- `src/variants/logic/inboxMock.ts` (+ unit tests): a mock double opt-in inbox built on the real rules in
  `src/lib/inbox.ts`. On the founder side it has five proposals: interested (your turn), waiting, **declined** (as old
  as the waiting one), intro and expired. On the investor side it has four seeded anonymous teasers: to review,
  waiting for the startup and intro. The rows carry only what `viewOf()` exposes. The tests check that a declined
  proposal produces exactly the same row as an unanswered one, both before and after the deadline, and that teasers
  stay anonymous until the intro.
- `scripts/serve-dist.mjs`: `startPreview()` reads `PREVIEW_PORT` (default unchanged, 4179). Because the screenshot
  script calls it without an argument, `PREVIEW_PORT=4279 npm run screenshots` works without editing
  `scripts/screenshots.mjs`.

## Not delivered (set aside, not committed)

The work in progress was saved as a patch outside the repo: `/tmp/variants-round3-wip/round3-wip.patch`. Apply it
with `git apply` to resume. It contains:

- registry/routes: `requests` and `export` screens (`/match-investitori/varianti/vN/{richieste,esporta}/`,
  `/en/investor-match/variants/vN/{requests,export}/`, noindex, nofollow). The gallery grid and the compare view pick
  them up through `SCREENS`. `src/i18n/seo.test.ts` is updated to 5 × 7.
- IT/EN copy (`requestsMock`, `exportMock`) and the hooks `useRequestsMock` / `useExportMock`. The export hook uses
  the real `buildStartupDoc` teaser.
- `e2e/variants-round3.spec.ts`: render, invariant, axe, 320 px overflow, compare switching, plus one forced-colours
  test per variant.
- shared forced-colours rule for the banner's current screen/variant (`.vx-seg a[aria-current]`).
- per-variant `Requests.tsx` / `Export.tsx` + CSS: **incomplete and not reviewed** (V2 `Export.tsx` missing; nothing
  was typechecked, built or screenshotted).

## Comparison table and updated recommendation

Not written: no screen was rendered and checked, so a comparison of V1–V5 across seven screens would be guesswork.
The recommendation from round 2 (gallery `decisionText`) still stands.

## Suggested next run

Start with a fresh time budget of about 90 minutes on an unloaded machine. Apply the patch, finish V2 Export, typecheck,
then run `E2E_PORT=4289 npm run e2e` and `PREVIEW_PORT=4279 npm run screenshots`, review the screenshots, and write
the comparison table.
