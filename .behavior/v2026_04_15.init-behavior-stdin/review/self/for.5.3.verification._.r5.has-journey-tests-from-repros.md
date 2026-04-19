# self-review r5: has-journey-tests-from-repros

## deeper reflection

### why no repros artifact?

this behavior route used the "mini" template. mini routes skip the repros phase because:
- the feature scope is narrow (single flag: `--wish @stdin|words`)
- the journeys are simple (inline text, stdin pipe, error cases)
- repros add overhead without proportional value for small features

### what defines the journeys then?

vision.yield.md serves as the journey source:
- "inline wish support" → `--wish "text"`
- "stdin wish support" → `--wish @stdin`
- "error on empty" → `--wish ""`
- "error on conflict" → `--wish` when file modified
- "idempotent" → same content twice
- "combined flags" → `--wish` + `--open`

### verification: each journey has a test

| vision journey | test exists? | test location | bdd structure? |
|----------------|--------------|---------------|----------------|
| inline wish | yes | case1 | given/when/then |
| stdin wish | yes | case2 | given/when/then |
| empty error | yes | case3 | given/when/then |
| conflict error | yes | case4 | given/when/then |
| idempotent | yes | case5 | given/when/then |
| combined flags | yes | case6 | given/when/then |

### what would have been missed without this review?

no gaps found. but the review confirms:
- every promised journey maps to a test
- tests use real infrastructure (temp git repos)
- assertions verify actual behavior (exit codes, file contents, stderr)

### why it holds

the mini route is appropriate for this scope. all journeys from vision have tests. the absence of repros is by design, not oversight.

## verdict

journeys are covered. route structure is appropriate for feature scope.
