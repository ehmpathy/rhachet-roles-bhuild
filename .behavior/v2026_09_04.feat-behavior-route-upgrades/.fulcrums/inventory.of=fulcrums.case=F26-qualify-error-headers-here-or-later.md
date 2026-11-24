# F26 — qualify the role-wide error headers in this pr, or later

rework = clean · status = open · confidence = 85% · risk = rework only, no harm

## the fork

`mech-failhides` r004 flagged 18 unqualified headers (`✋ git.grove.keyrack:`) in one skill this pr
touches. the same convention holds on 258 more lines across `src/domain.roles`.

- **A — fix the touched file, dream the rest** (taken)
- **B — sweep all 258 now**

## taken, and why at the time

A. the keyrack skill is in the diff, so its fix is safe and clean. the other 258 sit in skills this
pr does not touch, beside whichever snapshots pin them; a sweep drags that churn into a pr about
route upgrades. the defer is caught at `dreams/2026_10_21.qualify-error-headers-across-the-roles.dream.md`.

## rework, and why clean

B is a mechanical `sedreplace` per skill plus a resnap, in a pr of its own. naught here builds on A.

## confidence, and why it is not higher

the snapshot count behind the 258 lines was not walked, so "dirty" rests on an estimate.

## two siblings of the same defer, joined at 5.3.verification (2026-11-20)

the same A-vs-B call governs two more stdout markers, so they ride this row rather than mint two:

- **`getCliArgs`** — `src/infra/cli/getCliArgs.ts:143,160` opens every bad-flag refusal with
  `⛈️  error:` and exits 1, where a caller's bad input is `✋ ConstraintError:` and exit 2. every cli
  inherits it; the fix rewrites every cli's bad-flag assertions. step 4 of the same dream.
- **`⚠️` in cli stdout** — `U+26A0` is width-ambiguous. seven sites: `init.behavior.ts`'s opener
  warn · `boot.behavior.ts` · `feedback.give.ts` · `catch.dream.ts` · `review.behavior.sh`, one
  beside a guard-parsed stdout. dream: `dreams/2026_09_08.sweep-ambiguous-glyphs-from-cli-stdout.dream.md`.
  - the `init.behavior.ts` site was swapped to `🟡` in this diff, then reverted at i005 to main's
    bytes: its case7 snapshot exists on main, and `rule.require.review-test-changes` asks a
    main-pinned output to hold absent an ask. it rides the sweep with the other six.

⇒ the taken side holds for all three: this pr leaves main-pinned output as main pinned it; the
sweep is a pr of its own.

## where

`src/domain.roles/supervisor/skills/git.grove.keyrack.sh` · `src/domain.roles/**/skills/*.sh` ·
`src/infra/cli/getCliArgs.ts` · `src/contract/cli/*.ts`

## verdict

open — rides to the pr.
