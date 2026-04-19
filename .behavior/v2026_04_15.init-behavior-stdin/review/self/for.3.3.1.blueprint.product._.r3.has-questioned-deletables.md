# self-review r3: has-questioned-deletables

## why r3?

r2 went through features and components but didn't challenge them hard enough. need to apply musk's algorithm more rigorously: "your requirements are definitely dumb — how to make them less dumb?"

---

## musk's 5-step algorithm applied

1. question every requirement
2. delete parts and processes
3. simplify and optimize
4. accelerate cycle time
5. automate (last, not first)

---

## step 1: question every requirement

### Q: why do we need @stdin at all?

**original wish**: "want to be able to `rhx init.behavior ... --wish @stdin|words`"

the `|` in "@stdin|words" means OR — user wants either:
- @stdin (for pipes, heredocs)
- or inline words

**challenge**: couldn't users just do `echo "content" | ... --wish "$(cat)"` instead?

**answer**: that's awkward and requires shell expansion. @stdin is cleaner.

**verdict**: keep @stdin — wisher explicitly requested it

### Q: why validate empty wish?

**vision**: error on `--wish ""`

**challenge**: couldn't we just accept empty and create template?

**answer**: if user types `--wish ""`, they probably made a mistake. silent acceptance would confuse them. same behavior as `--wish` without value — zod would reject that.

**verdict**: keep empty validation — prevents user confusion

### Q: why validate modified wish file?

**vision**: error if wish file has non-template content

**challenge**: couldn't we just overwrite? or append?

**answer**: user might have hours of work in that file. silent overwrite destroys their work. this is pit-of-success design.

**challenge 2**: what about `--force` flag?

**answer**: musk step 2 says delete first. --force adds complexity. user can `rm` the file manually — simpler.

**verdict**: keep modified validation, no --force flag

### Q: why separate getWishContent transformer?

**blueprint has**:
```ts
let wishContent: string;
if (named.wish === '@stdin') {
  wishContent = readFileSync(0, 'utf-8').trim();
} else {
  wishContent = named.wish;
}
```

**challenge**: do we need a named transformer for 5 lines?

**answer**: no. this can stay inline in the main function. the blueprint shows it as inline transformer, not a separate file. this is already the simplest form.

**verdict**: keep inline — already minimal

### Q: why separate validateWishContent transformer?

**challenge**: 4 lines of code. does this need a name?

**answer**: the blueprint shows it inline, not as a separate file. already minimal.

**verdict**: keep inline — already minimal

### Q: why separate validateWishFileState transformer?

**challenge**: 6 lines of code. does this need a name?

**answer**: the blueprint shows it inline, not as a separate file. already minimal.

**verdict**: keep inline — already minimal

---

## step 2: delete parts and processes

### candidate: runInitBehaviorSkillWithStdin helper

**current**: new helper function in test utils

**challenge**: can we delete this and just use runInitBehaviorSkillDirect with shell redirection?

**answer**: execSync with `input` option is cleaner than shell redirection in test code. but...

**re-challenge**: could we extend runInitBehaviorSkillDirect with optional stdin param instead of new function?

**better design**:
```ts
export const runInitBehaviorSkillDirect = (input: {
  args: string;
  repoDir: string;
  stdin?: string;  // optional
}): { stdout: string; exitCode: number } => {
  // ...
  ...(input.stdin && { input: input.stdin }),
};
```

**decision**: extend extant function instead of create new one

**action**: UPDATE BLUEPRINT to extend runInitBehaviorSkillDirect instead of create runInitBehaviorSkillWithStdin

---

## step 3: simplify and optimize

### simplification found: test helper

see above — extend extant function, don't create new one.

### all other components

reviewed each component. all are already at minimum complexity:
- schema: 1 line
- @stdin check: 5 lines
- empty check: 4 lines
- modified check: 6 lines
- test file: 7 cases mapped to 7 usecases

---

## blueprint update required

need to change filediff tree and test helper section:

**before**:
```
└── .test/
    └── [~] skill.init.behavior.utils.ts              # add stdin helper
```
with new `runInitBehaviorSkillWithStdin` function

**after**:
```
└── .test/
    └── [~] skill.init.behavior.utils.ts              # extend with optional stdin
```
with optional `stdin` param on `runInitBehaviorSkillDirect`

**fix applied**: blueprint updated (verified below)

---

## verification: blueprint reflects fix

checked `3.3.1.blueprint.product.yield.md`:

1. **test helper section** (line 215): "extend extant `runInitBehaviorSkillDirect` with optional `stdin` param"
2. **code example** (line 222): `stdin?: string;  // [+] optional stdin param`
3. **note** (line 238): "extend extant function instead of create new one — fewer functions, lower maintenance"
4. **sequence step 1** (line 260): "`[~]` extend `skill.init.behavior.utils.ts` with stdin helper"
5. **filediff tree** (line 51): "`[~] skill.init.behavior.utils.ts  # extend with optional stdin param`"
6. **research citations** (line 33): "extend runInitBehaviorSkillDirect with optional `stdin` param"

all six locations confirm the fix is in place. no references to `runInitBehaviorSkillWithStdin` remain.

---

## verdict

**issue found**: blueprint originally created new test helper when extant helper could be extended

**fix applied**: extend runInitBehaviorSkillDirect with optional stdin param instead of new function

this reduces:
- file changes: same
- new functions: 1 → 0
- maintenance burden: lower

the deletion principle was applied, found an improvement, and the blueprint was corrected.

