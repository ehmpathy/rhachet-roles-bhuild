# self-review: has-consistent-mechanisms

## question

do new mechanisms duplicate extant functionality?

## review

### mechanisms check

| new mechanism | extant equivalent? | verdict |
|--------------|-------------------|---------|
| getWishContent | no - unique @stdin pattern | consistent |
| findsertWishFromInput | no - unique wish findsert | consistent |

### why this holds

1. **@stdin pattern**: searched codebase for `readFileSync(0` - no extant @stdin handler in this repo. pattern is novel.

2. **findsert semantics**: findsertWishFromInput uses same findsert pattern as other operations (same=noop, template=populate, different=error).

3. **exit code 2**: consistent with other constraint errors in this codebase (see initBehavior line 67, line 119).

4. **domain operation structure**: follows (input, context) pattern and domain.operations directory structure.

## conclusion

new mechanisms follow extant patterns. no duplication detected.
