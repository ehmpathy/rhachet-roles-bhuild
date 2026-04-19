# self-review: has-edgecase-coverage

## question

are edge cases covered?
- what could go wrong?
- what inputs are unusual but valid?
- are boundaries tested?

## review

### what could go wrong?

| failure mode | playtest coverage | why it holds |
|--------------|-------------------|--------------|
| empty wish content | edgey path 1: `--wish ""` | tests that empty inline content produces error with helpful message |
| whitespace-only stdin | edgey path 2: `echo "   " \|` | tests that whitespace-only content is rejected, not silently accepted |
| wish file conflict | edgey path 3: different content | tests that re-init with different wish content fails with clear error |
| protected branch | edgey path 4: main branch | tests that @branch expansion fails safely on main/master |

these cover the "what could break" scenarios explicitly.

### what inputs are unusual but valid?

| unusual input | playtest coverage | why it holds |
|---------------|-------------------|--------------|
| same wish content (idempotent) | happy path 4 | unusual because user rarely runs init twice, but valid — should pass |
| wish + open combined | happy path 3 | unusual because --wish removes need for --open, but valid — both work together |
| piped stdin | happy path 2 | less common than inline, but valid usage pattern |

these cover the "unusual but valid" inputs that should succeed.

### are boundaries tested?

| boundary | playtest coverage | why it holds |
|----------|-------------------|--------------|
| empty → error | edgey path 1 | the boundary between "has content" and "no content" |
| whitespace → error | edgey path 2 | the boundary between "valid content" and "effectively empty" |
| different → error | edgey path 3 | the boundary between "idempotent" and "conflict" |
| protected → error | edgey path 4 | the boundary between "feature branch" and "protected branch" |

each boundary has an explicit test with expected error behavior.

### gaps identified and addressed

**no gaps found.** the edgey paths section covers:
- all pit-of-success edgecases from the vision
- all failure modes that could surprise users
- all boundaries between success and failure states

## verdict

edge cases are thoroughly covered. the playtest exercises both sides of each boundary — what passes and what fails — with explicit expected outcomes for each.
