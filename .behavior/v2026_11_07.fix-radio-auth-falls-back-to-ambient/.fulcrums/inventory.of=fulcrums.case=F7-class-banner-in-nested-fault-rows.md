# F7 — the class banner in a nested `fault:` / `fix it:` row

## the fork

two reviewers ask for opposite shapes of one row:

- 5.3 i002 ergo-snapshot-visual-blemishes, blocker.1: the new both-failed fault renders `fault: ✋ ConstraintError: github auth failed: …`, so the `fault:` label takes two shapes in one drain, since every gh fault row reads its bare text
- 5.3 i005/i006 enroll-verif-test-intent, blocker.2: a cut across every row rewrites pinned bytes on the explicit `--auth` path, which the vision keeps "as today"

options:

- (a) cut the class on every nested row
- (b) cut it on no row
- (c) cut it only on the both-failed fault #513 introduced, and join the queue's `or …` lines only on default-auth records

## taken: (c), and why

- it answers both reviewers: the new fault reads as one tree with one header, and every fault that rendered before #513 keeps its bytes
- `asRadioFaultTextShown` holds the rule in one place: the both-failed detail (`isRadioAuthBothFailedDetail`) is cut; every other line is returned as is
- the stored record's reason bytes are unchanged, and a thrown error still opens with its class
- proof: the CLI push snap is purely additive against `origin/main` (0 lines removed)
- harm test: none ships → `better`

## rework

clean: to widen to (a), call `asRadioErrorTextSansClass` for every line in `asRadioFaultTextShown`; to narrow to (b), return `input.line`. one file, then a resnap.

## confidence

85%. (c) is the shape that leaves pre-#513 output unchanged, which the vision asks for.

## verdict

open
