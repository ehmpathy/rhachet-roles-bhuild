# self-review: has-edgecase-coverage (r3)

## question

are edge cases covered?
- what could go wrong?
- what inputs are unusual but valid?
- are boundaries tested?

## review

### what could go wrong?

| failure mode | playtest step | why it holds |
|--------------|---------------|--------------|
| empty wish content | edgey path 1: `--wish ""` | exercises the boundary where content is absent — error message guides user |
| whitespace-only stdin | edgey path 2: `echo "   " \|` | exercises the boundary where content is effectively absent — distinct from empty string |
| wish file conflict | edgey path 3: different content | exercises the boundary between idempotent and conflicted states — error suggests resolution |
| protected branch | edgey path 4: main branch | exercises the @branch guard on main/master — fails fast with clear message |

each failure mode has an explicit playtest step with expected error output.

### what inputs are unusual but valid?

| unusual input | playtest step | why it holds |
|---------------|---------------|--------------|
| same wish content (idempotent) | happy path 4 | rare to run init twice with same content, but valid — should succeed silently |
| wish + open combined | happy path 3 | less common to combine both flags, but valid — both work together |
| piped stdin | happy path 2 | less common than inline, but valid unix pattern — supported via @stdin |

each unusual-but-valid input has a happy path that exercises it with explicit success criteria.

### are boundaries tested?

| boundary | playtest step | why it holds |
|----------|---------------|--------------|
| empty → error | edgey path 1 | the threshold between "has content" and "no content" |
| whitespace → error | edgey path 2 | the threshold between "valid content" and "effectively empty" |
| different → error | edgey path 3 | the threshold between "idempotent safe" and "conflict detected" |
| protected → error | edgey path 4 | the threshold between "feature branch ok" and "protected branch blocked" |

each boundary has explicit tests on both sides — the happy paths show what passes, the edgey paths show what fails.

### gaps found?

**none.** the edgey paths section covers:
1. all pit-of-success edgecases from the vision
2. all failure modes that could surprise users
3. all boundaries between success and failure states

## verdict

edge cases are covered. the playtest exercises both sides of each boundary with explicit expected outcomes.
