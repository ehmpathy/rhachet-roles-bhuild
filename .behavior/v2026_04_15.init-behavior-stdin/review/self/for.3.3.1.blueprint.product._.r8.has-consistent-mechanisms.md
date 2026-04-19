# self-review r8: has-consistent-mechanisms

## why r8?

check that new mechanisms don't duplicate extant functionality.

---

## new mechanisms in blueprint

| mechanism | location | purpose |
|-----------|----------|---------|
| @stdin handler | inline in wish logic | read content from stdin when `--wish @stdin` |
| wish validation | inline in wish logic | check non-empty, check template state |
| wish write | inline in wish logic | write populated wish file |
| schema field | schema | add `wish: z.string().optional()` |
| test helper stdin | test utils | extend extant helper with stdin param |

---

## mechanism 1: @stdin handler

**codebase search**: `readFileSync(0` yields 1 result in `src/contract/cli/feedback.take.set.ts`

**extant pattern** (lines 51-57):
```ts
let response: string;
if (named.response === '@stdin') {
  response = readFileSync(0, 'utf-8').trim();
} else {
  response = named.response;
}
```

**blueprint pattern**:
```ts
let wishContent: string;
if (named.wish === '@stdin') {
  wishContent = readFileSync(0, 'utf-8').trim();
} else {
  wishContent = named.wish;
}
```

**verdict**: consistent. same pattern reused inline, not a separate utility.

**why not extract to utility?** only 2 usages (extant + new). per rule.prefer.wet-over-dry, wait for 3+ usages before abstraction.

---

## mechanism 2: wish validation (non-empty)

**codebase search**: `requires content|content required` yields 0 results

**is there an extant validator?** no extant mechanism for this specific check.

**why inline?** 4 lines of code, used in one place. no benefit from extraction.

**verdict**: no duplication — new mechanism, appropriately inline.

---

## mechanism 3: wish validation (template state)

**codebase search**: `has been modified|file.*modified` yields 0 results

**is there an extant validator?** no extant mechanism for this check.

**why inline?** 6 lines of code, used in one place. specific to wish file semantics.

**verdict**: no duplication — new mechanism, appropriately inline.

---

## mechanism 4: exit(2) for constraint errors

**codebase search**: `process.exit(2)` yields 1 result in `src/contract/cli/feedback.take.get.ts`

**verdict**: consistent. follows extant exit code semantics pattern.

---

## mechanism 5: test helper extension

**blueprint approach**: extend extant `runInitBehaviorSkillDirect` with optional `stdin` param.

**is this consistent?** yes — extends extant helper rather than create new one.

**verdict**: consistent. minimal change, backward compatible.

---

## mechanism 6: schema field

**blueprint approach**: add `wish: z.string().optional()` to extant schema.

**is this consistent?** yes — follows extant schema pattern for optional flags.

**verdict**: consistent. standard zod schema extension.

---

## summary table

| mechanism | extant? | action | verdict |
|-----------|---------|--------|---------|
| @stdin handler | yes (1 usage) | reuse pattern inline | consistent |
| wish validation (non-empty) | no | add inline | no duplication |
| wish validation (template) | no | add inline | no duplication |
| exit(2) pattern | yes | follow convention | consistent |
| test helper extension | yes | extend extant | consistent |
| schema field | yes | extend extant | consistent |

---

## verdict

no mechanisms duplicate extant functionality. all new mechanisms either:
1. follow extant patterns (consistent)
2. are genuinely new with no extant equivalent (no duplication)
3. extend extant components rather than create new ones

no issues found. blueprint is consistent with extant mechanisms.

