# self-review r1: has-no-fake-tests

## question

are there tests that always pass regardless of code behavior?

## review

### what makes a test fake

- assertions that always evaluate to true
- mocks that replace the system under test
- conditions that skip the actual verification
- snapshots that match empty or constant values

### init.behavior test verification

scanned: `blackbox/role=behaver/*init.behavior*.acceptance.test.ts`

#### assertions used

| pattern | count | fake? |
|---------|-------|-------|
| `expect(result.exitCode).toBe(0)` | many | no — real exit code |
| `expect(result.exitCode).toBe(2)` | many | no — real exit code |
| `expect(result.stdout).toContain()` | many | no — real output |
| `expect(result.stderr).toContain()` | few | no — real stderr |
| `toMatchSnapshot()` | many | no — captures actual output |
| `existsSync()` checks | many | no — verifies real files |

#### system under test

tests invoke `runInitBehaviorSkillDirect()` which:
- spawns actual bash process with `spawnSync`
- runs real `init.behavior.sh` executable
- creates real files in temp git repos
- returns real stdout, stderr, exit codes

no mocks of the core behavior.

#### snapshot content

snapshots contain:
- actual file contents created by the skill
- actual stdout/stderr messages
- actual error formats with `✋ ConstraintError:` prefix

not empty. not constants.

## verdict

zero fake tests. all tests verify real behavior against real execution.
