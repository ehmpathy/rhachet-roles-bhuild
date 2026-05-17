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

### dispatcher role test files

extant radio skill tests:
- `blackbox/role=dispatcher/skill.radio.task.push.via-gh-issues.acceptance.test.ts`
- `blackbox/role=dispatcher/skill.radio.task.pull.via-gh-issues.acceptance.test.ts`
- `blackbox/role=dispatcher/skill.radio.task.push.via-os-fileops.acceptance.test.ts`
- `blackbox/role=dispatcher/skill.radio.task.pull.via-os-fileops.acceptance.test.ts`

---

## finding

this repo does NOT use `.play.test.ts` convention.

this repo uses `.acceptance.test.ts` for journey/blackbox tests.

the experience reproductions document correctly identified test type as "acceptance" in the experience table.

---

## recommended test file names

based on repo convention, the journey tests should use:

| journey | recommended file name |
|---------|----------------------|
| radio skill just works (keyrack) | extend `skill.radio.task.push.via-gh-issues.acceptance.test.ts` |
| env var fallback | extend same file with new given block |
| error: keyrack not filled | extend same file with error case |

alternatively, if keyrack tests warrant separation:

| journey | alternative file name |
|---------|----------------------|
| keyrack auth tests | `skill.radio.task.push.via-gh-issues.keyrack.acceptance.test.ts` |

---

## conclusion

the `.play.test.ts` convention does not apply to this repo.

this repo's convention is `.acceptance.test.ts` for journey tests.

the experience reproductions document aligns with repo convention — no changes required.

