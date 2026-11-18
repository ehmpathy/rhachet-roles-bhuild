# F23: init.behavior's wish errors keep their bare `error:` header in this pr

## .the fork

F19 made `--wish ""` reach `findsertWishFromInput`'s own guard. Its stderr snap now reads `error: --wish requires content`, the same as the `@stdin` twin, with no `✋ ConstraintError:` opener (`rule.require.qualified-error-headers`).

- **A, taken:** leave both of that file's bare `error:` lines as they are. The fix is caught in `.dream/v2026_11_17.fix-init-behavior-wish-errors-carry-qualified-headers.md`, symlinked at this route's `dreams/`
- **B:** qualify both headers, name the fix in each (`rhx rmsafe` in place of `rm`), and resnap three init.behavior.wish snaps in this pr

## .why A, at the time

B is SAFE but not CLEAN. It changes the error contract of a behaver skill outside #675 and moves three of that skill's snaps. This pr touched that skill once, by F19, only because the shared parser misread an empty value. A second change there widens a p0 radio pr into an unrelated error-text pass.

## .rework: dirty

Small in lines, but it lands in another skill's contract. Its snaps and any caller that greps for `error: --wish` would move with it.

## .confidence: 80%, and why it is low

The fix is a few lines, and the scouts-honor rule leans toward "do it now". A reader may rule that F19 already opened this file's contract, which would make B clean.

## .where

`src/domain.operations/behavior/init/findsertWishFromInput.ts` L14, L35; `blackbox/role=behaver/__snapshots__/skill.init.behavior.wish.acceptance.test.ts.snap`. Found at 5.3, in the snap review.

## .verdict

open.
