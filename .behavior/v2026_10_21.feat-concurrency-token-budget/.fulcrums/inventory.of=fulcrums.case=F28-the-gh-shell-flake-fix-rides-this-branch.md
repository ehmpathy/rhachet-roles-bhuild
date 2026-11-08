# F28 · the gh-shell timeout flake fix rides this branch

## .the fork

5.3 i004 `enroll-verif-test-intent` n2: the `daoRadioTaskViaGhIssues.shell` timeout change (300ms →
2s) sits in a test this route does not own.

- **(a)** revert it here and dispatch it to its own tree
- **(b)** keep it in this branch

## .taken, and why

(b). the 5.3 stone forbids a prior failure carried forward: "if a test is flaky — fix it … fix it
anyway". the test went red in this branch's full integration run (a loaded box killed the stub
before it logged its call, so `calls === 1` read 0), so the branch cannot pass 5.3 while it flakes.
the fix is safe and clean: every assertion is byte-identical, the 5s bound did not loosen, and the
peer that raised the point ran it green (12 of 12) and called it "small and safe".

## .rework

clean: a two-line revert, plus a seed for another tree.

## .confidence, and why it is low

80%. the only cost is a diff line outside the wish's verbs; the reviewer raised no defect in it.

## .verdict

open — the council's.
