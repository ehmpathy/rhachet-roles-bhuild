# self-review: behavior-declaration-adherance (r5)

## question

does the implementation correctly follow the behavior declaration?

## review

### files changed in this pr

| file | purpose |
|------|---------|
| src/domain.operations/behavior/init/getWishContent.ts | extract wish from @stdin or inline |
| src/domain.operations/behavior/init/getWishContent.test.ts | unit tests |
| src/domain.operations/behavior/init/findsertWishFromInput.ts | findsert wish into file |
| src/domain.operations/behavior/init/findsertWishFromInput.test.ts | unit tests |
| src/contract/cli/init.behavior.ts | integrate wish into skill |
| blackbox/.test/skill.init.behavior.utils.ts | add stdin param |
| blackbox/skill.init.behavior.wish.acceptance.test.ts | acceptance tests |

### adherance check

| wish requirement | implementation | correct? |
|-----------------|----------------|----------|
| @stdin reads piped input | `readFileSync(0, 'utf-8').trim()` | yes - fd 0 is stdin |
| inline words pass through | `return input.wish` | yes - direct return |
| findsert: same = noop | `if (wishCurrent === wishExpected) return` | yes - idempotent |
| findsert: template = populate | `if (wishCurrent.trim() === 'wish =') writeFileSync...` | yes - detects template |
| findsert: different = error | `console.error(...); process.exit(2)` | yes - constraint error |
| wish before --open | line 137-140 before line 155 | yes - order correct |

### why this holds

1. **@stdin pattern correct**: `readFileSync(0, 'utf-8')` is the standard node pattern for sync stdin read.

2. **findsert semantics match**: same=noop, template=populate, different=error matches the standard findsert pattern used elsewhere in codebase.

3. **exit code 2 correct**: constraint errors (user must fix) use exit(2) per rule.require.exit-code-semantics.

4. **domain operations separated**: logic not collocated in contract layer, operations extracted to domain.operations/.

## conclusion

implementation adheres to behavior declaration. no deviations detected.

