# self-review r9: has-consistent-mechanisms

## why r9?

r8 listed mechanisms and verdicts but lacked deeper articulation of "why it holds". this r9 answers each guide question explicitly for each mechanism.

---

## the three questions

for each mechanism, the guide asks:
1. does the codebase already have a mechanism that does this?
2. do we duplicate extant utilities or patterns?
3. could we reuse an extant component instead of a new one?

---

## mechanism 1: @stdin handler

### Q1: does the codebase already have a mechanism that does this?

**search performed**: `readFileSync(0` in `**/*.ts`

**result**: 1 match in `src/contract/cli/feedback.take.set.ts`

**extant implementation** (lines 51-57):
```ts
let response: string;
if (named.response === '@stdin') {
  response = readFileSync(0, 'utf-8').trim();
} else {
  response = named.response;
}
```

**answer**: yes, there is an extant mechanism. it is inline pattern, not a shared utility.

### Q2: do we duplicate extant utilities or patterns?

**answer**: no duplication — the blueprint REUSES the same inline pattern:

```ts
// blueprint (lines 181-186)
let wishContent: string;
if (named.wish === '@stdin') {
  wishContent = readFileSync(0, 'utf-8').trim();
} else {
  wishContent = named.wish;
}
```

this is pattern reuse, not duplication. both implementations follow the same 6-line inline pattern.

### Q3: could we reuse an extant component instead of a new one?

**answer**: no extant component exists. the extant mechanism is an inline pattern, not a reusable function.

**why not extract to utility?** per rule.prefer.wet-over-dry, wait for 3+ usages. currently only 2 usages (extant + blueprint). extraction would be premature abstraction.

**why it holds**: the blueprint follows the extant pattern exactly. no new component created, no duplication introduced.

---

## mechanism 2: wish validation (non-empty check)

### Q1: does the codebase already have a mechanism that does this?

**search performed**: `requires content|content required` in `**/*.ts`

**result**: 0 matches

**answer**: no extant mechanism for "input requires content" validation.

### Q2: do we duplicate extant utilities or patterns?

**answer**: no — this is a new validation specific to wish content.

**search for similar**: `!.*content|content.*empty` in `**/*.ts` — no relevant matches for this semantic.

### Q3: could we reuse an extant component instead of a new one?

**answer**: no. the check is 4 lines of domain-specific logic:

```ts
if (!wishContent) {
  console.error('error: --wish requires content');
  process.exit(2);
}
```

**why it holds**: this is genuinely new functionality with no extant equivalent. the validation is specific to wish semantics and simple enough to be inline.

---

## mechanism 3: wish validation (template state check)

### Q1: does the codebase already have a mechanism that does this?

**search performed**: `has been modified|file.*modified|template.*state` in `**/*.ts`

**result**: 0 matches

**answer**: no extant mechanism for file template state validation.

### Q2: do we duplicate extant utilities or patterns?

**answer**: no — this is a new pit-of-success guard.

**why new**: the check is wish-specific: "if wish file has non-template content, block overwrite". no other feature in the codebase needs this exact semantic.

### Q3: could we reuse an extant component instead of a new one?

**answer**: no. the validation is 6 lines specific to wish file semantics:

```ts
const wishCurrent = readFileSync(wishPath, 'utf-8');
if (wishCurrent.trim() !== 'wish =') {
  console.error('error: wish file has been modified');
  console.error('');
  console.error('to overwrite, delete the wish file first:');
  console.error(`  rm ${wishPathRel}`);
  process.exit(2);
}
```

**why it holds**: genuinely new functionality. no extant equivalent exists or should exist — this is domain-specific to the --wish feature.

---

## mechanism 4: exit(2) for constraint errors

### Q1: does the codebase already have a mechanism that does this?

**search performed**: `process.exit(2)` in `**/*.ts`

**result**: 1 match in `src/contract/cli/feedback.take.get.ts`

**answer**: yes, extant pattern for exit(2) on constraint errors.

### Q2: do we duplicate extant utilities or patterns?

**answer**: no — the blueprint FOLLOWS the extant convention.

per rule.require.exit-code-semantics:
- exit(1) = malfunction (server must fix)
- exit(2) = constraint (caller must fix)

the blueprint uses exit(2) for "wish requires content" and "wish file modified" — both are constraint errors the caller must fix.

### Q3: could we reuse an extant component instead of a new one?

**answer**: this is not a component to reuse — it's a convention to follow. the blueprint follows it correctly.

**why it holds**: blueprint adheres to extant exit code semantics. no new component created.

---

## mechanism 5: test utility extension

### Q1: does the codebase already have a mechanism that does this?

**search performed**: examined `blackbox/role=behaver/.test/skill.init.behavior.utils.ts`

**result**: `runInitBehaviorSkillDirect` exists and will be extended.

**answer**: yes, extant test utility exists. blueprint extends it rather than create new one.

### Q2: do we duplicate extant utilities or patterns?

**answer**: no duplication — the blueprint EXTENDS the extant function:

```ts
export const runInitBehaviorSkillDirect = (input: {
  args: string;
  repoDir: string;
  stdin?: string;  // [+] optional stdin param
}): { stdout: string; stderr: string; exitCode: number } => {
```

one new optional parameter added. backward compatible. no new function created.

### Q3: could we reuse an extant component instead of a new one?

**answer**: the blueprint DOES reuse extant component. it extends rather than replaces.

**why it holds**: minimal change to extant function. no duplication. backward compatible.

---

## mechanism 6: schema field

### Q1: does the codebase already have a mechanism that does this?

**search performed**: examined `src/contract/cli/init.behavior.ts` schema pattern

**result**: extant schema uses `z.string().optional()` pattern for other optional flags.

**answer**: yes, extant pattern for optional string args.

### Q2: do we duplicate extant utilities or patterns?

**answer**: no — the blueprint FOLLOWS the extant pattern:

```ts
const schemaOfArgs = z.object({
  named: z.object({
    name: z.string(),
    dir: z.string().optional(),
    open: z.string().optional(),
    // ... extant optional fields
    wish: z.string().optional(),  // [+] follows same pattern
  }),
});
```

### Q3: could we reuse an extant component instead of a new one?

**answer**: the blueprint does reuse extant pattern. no new component needed.

**why it holds**: standard zod schema extension. follows extant conventions exactly.

---

## summary: why it holds

| mechanism | Q1 (extant?) | Q2 (duplicate?) | Q3 (reuse?) | why consistent |
|-----------|--------------|-----------------|-------------|----------------|
| @stdin handler | yes (inline pattern) | no (reuses pattern) | N/A (pattern not component) | follows extant inline pattern exactly |
| wish validation (non-empty) | no | no | N/A | genuinely new, no extant equivalent |
| wish validation (template) | no | no | N/A | genuinely new, domain-specific |
| exit(2) pattern | yes | no (follows convention) | yes (convention) | adheres to exit code semantics |
| test utility | yes | no (extends) | yes (extends) | minimal backward-compatible extension |
| schema field | yes | no (follows pattern) | yes (extends schema) | standard zod pattern |

---

## verdict

all guide questions answered for each mechanism:

- **no duplication** — no new mechanism duplicates extant functionality
- **consistency** — blueprint follows extant patterns where they exist
- **appropriate novelty** — new mechanisms are genuinely new features with no extant equivalent

no issues found.

