# self-review: has-journey-tests-from-repros (r5)

## second pass — question assumptions

assumption: "no repros means no journey tests needed"

is this valid? let me think harder.

## what does the guide ask?

"did you implement each journey sketched in repros?"

there are no repros. but should there have been repros?

## should this behavior have repros?

the wish: add groundwork section to vision template stone + self-review guard

this is a **template text change**, not a **runtime feature**. repros capture user journeys through active software. there is no "runtime" for template text — it's static guidance rendered into behavior directories.

## what proves this works?

1. template loads without error (unit tests pass)
2. guard parse succeeds (guard validation runs)
3. behavers see the new sections when they init a behavior

#3 is not testable without a run of init.behavior and inspection of output. that's what acceptance tests do — and CI/CD runs those.

## conclusion

no repros artifact exists because this is template text, not a runtime feature. the unit tests + CI/CD acceptance tests provide coverage. no journey tests required.
