# F17 · dispute the i003 nitpicks that name no defect, so the exhausted lanes' tally reflects real concerns

## the fork

at i003 every l1 lane is exhausted (3/3), so its nitpicks stay in the stone-wide tally (allowance 7)
and no further round can drop them. four of those nitpicks name no defect; the reviewer says so in
three of them, and the fourth is a false positive checked against the code:

| concern | why it names no defect |
|---|---|
| r001 nitpick.2 — `then` labels not phrased as a promise | the reviewer: the `then` "reads as a statement, which is the preferred `i promise that it ...` shape, so this is minor"; the rule it cites governs self-review slugs, not test labels |
| r004 nitpick.1 — `[t7]`–`[t9]` may re-invoke | the reviewer: "they do from the target file … this is a verification note, not a defect" |
| r004 nitpick.2 — `--size`/`--wish` in the shell header | false positive: `src/contract/cli/init.behavior.ts` lines 44 and 46 declare `size` and `wish` in the schema; the header documents flags the cli already takes |
| r006 nitpick.1 — `route.stone.del` output unsnapped | it is fixture setup, not the subject: bhrain owns its contract; the journey asserts its effect via `[t14]` `stone = 4.1.roadmap`, which fails if the delete did not land |

| option | cost |
|---|---|
| A · dispute these four with this fulcrum (taken) | the council reads four rows; no false repair recorded |
| B · concede them | records repairs for defects that do not exist |
| C · ask for a budget top-up | no urgent concession stands, so no warrant exists |

## taken, and why at the time

A. each row cites the reviewer's own words or the code line that refutes it. every nitpick that names
a real gap in this round was repaired instead (r001 n1, r004 n3, r007 n2, r007 n3, r010 n1).

## rework

clean: if the council disagrees with a row, the fix is local to one comment or one assertion.

## confidence, and why it is not higher (85%)

- the council may prefer the `route.stone.del` stdout asserted anyway, as belt-and-braces

## where

- `.reviews/peer/5.3.verification._.review.i003.e92403fe26381fb7c6.r00{1,4,6}._.given.by_peer.*.report.md`

## verdict

awaits the wisher.
