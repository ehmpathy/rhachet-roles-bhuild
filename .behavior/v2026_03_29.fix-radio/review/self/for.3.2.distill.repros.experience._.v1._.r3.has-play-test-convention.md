# self-review: has-play-test-convention

review of journey test file convention for radio skill keyrack integration.

---

## the question

do journey tests use the `.play.test.ts` suffix convention?

---

## investigation

### repo convention search

searched for `.play.*.ts` files in repo: **none found**

searched for `.acceptance.test.ts` files: **22 found**

### extant test patterns in this repo

| pattern | example | usage |
|---------|---------|-------|
| `skill.{name}.acceptance.test.ts` | `skill.radio.task.push.via-gh-issues.acceptance.test.ts` | blackbox skill tests |
| `role.init.acceptance.test.ts` | `role.init.acceptance.test.ts` | role initialization tests |
| `init.behavior.*.acceptance.test.ts` | `init.behavior.at-branch.acceptance.test.ts` | behavior init tests |

### extant dispatcher role test files

radio skill tests in `blackbox/role=dispatcher/`:
- `skill.radio.task.push.via-gh-issues.acceptance.test.ts`
- `skill.radio.task.pull.via-gh-issues.acceptance.test.ts`
- `skill.radio.task.push.via-os-fileops.acceptance.test.ts`
- `skill.radio.task.pull.via-os-fileops.acceptance.test.ts`

---

## result

**this repo does NOT use `.play.test.ts` convention.**

this repo uses `.acceptance.test.ts` for journey/blackbox tests.

the experience reproductions document correctly identified test type as "acceptance" in the experience table (line 11-16).

---

## why this holds

1. **convention consistency**: all 22 blackbox tests in this repo use `.acceptance.test.ts`
2. **no play pattern**: zero files match `.play.*.ts` pattern
3. **extant structure**: dispatcher role already has `skill.radio.task.*.acceptance.test.ts` files
4. **experience document alignment**: test type column correctly shows "acceptance" for journey tests

---

## recommendation for implementation

extend extant acceptance test file rather than create new play test:

| journey | target file |
|---------|-------------|
| keyrack auth (just works) | `skill.radio.task.push.via-gh-issues.acceptance.test.ts` |
| env var fallback | same file, new given block |
| error experience | same file, error case block |

---

## no changes required

the experience reproductions document aligns with repo convention.

the `.play.test.ts` convention does not apply here — this repo uses `.acceptance.test.ts` instead.

