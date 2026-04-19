# self-review r2: has-questioned-deletables

## the question

can any features or components be deleted or simplified?

---

## features analysis

### feature 1: `--wish "inline words"`

**traces to**: vision usecases table, criteria usecase.1
**wisher asked?**: yes — original wish says "type it into the terminal"
**deletable?**: no — core requirement

### feature 2: `--wish @stdin`

**traces to**: vision usecases table, criteria usecase.2
**wisher asked?**: yes — original wish says "@stdin|words"
**deletable?**: no — core requirement, explicitly in wish

### feature 3: error on empty wish

**traces to**: vision pit-of-success, criteria usecase.5
**wisher asked?**: implicitly via pit-of-success pattern
**deletable?**: no — prevents user confusion

### feature 4: error on modified wish file

**traces to**: vision resolved questions #2, criteria usecase.4
**wisher asked?**: implicitly via pit-of-success pattern
**deletable?**: could skip and silently overwrite...
**should delete?**: no — protects user work, vision explicitly requires this

### feature 5: combined --wish + --open

**traces to**: vision contract inputs line 61, criteria usecase.3
**wisher asked?**: yes — original wish example shows both flags
**deletable?**: no — explicitly requested

---

## components analysis

### component 1: schemaOfArgs extension

```ts
wish: z.string().optional(),
```

**can remove?**: no — required to accept the flag
**simplest version?**: yes, one line is minimal
**did we optimize a part that shouldn't exist?**: no

### component 2: getWishContent (inline transformer)

```ts
if (named.wish === '@stdin') {
  wishContent = readFileSync(0, 'utf-8').trim();
} else {
  wishContent = named.wish;
}
```

**can remove?**: no — needed for @stdin pattern
**can simplify?**: could inline in main function... but this matches extant pattern from feedback.take.set.ts
**did we optimize a part that shouldn't exist?**: no — follows extant pattern

**alternative considered**: could we not have @stdin at all, only inline?
**rejected because**: wisher explicitly requested "@stdin|words" in original wish

### component 3: validateWishContent (inline transformer)

```ts
if (!wishContent) {
  console.error('error: --wish requires content');
  process.exit(1);
}
```

**can remove?**: could allow empty wish...
**should remove?**: no — vision explicitly requires error on empty
**simplest version?**: yes, 4 lines is minimal

### component 4: validateWishFileState (inline transformer)

```ts
if (wishCurrent.trim() !== 'wish =') {
  console.error('error: wish file has been modified');
  // ...
  process.exit(1);
}
```

**can remove?**: could silently overwrite modified files...
**should remove?**: no — protects user work, vision resolved question #2 requires this
**simplest version?**: yes, check is minimal

### component 5: runInitBehaviorSkillWithStdin (test helper)

**can remove?**: no — needed to test @stdin cases
**alternative**: could use shell redirection in test... but execSync `input` option is cleaner
**simplest version?**: extends extant runInitBehaviorSkillDirect pattern

### component 6: acceptance test file

**can remove?**: no — required by test coverage standards
**simplest version?**: 7 cases matches 7 criteria usecases

---

## deletion candidates considered

| candidate | considered | decision |
|-----------|------------|----------|
| @stdin support | could drop, keep inline only | keep — wisher explicitly asked |
| empty check | could allow empty | keep — vision requires error |
| modified file check | could silently overwrite | keep — vision requires error |
| separate transformers | could inline all logic | keep — matches extant patterns |
| test helper | could use shell redirection | keep — cleaner pattern |

---

## simplification opportunities found

### opportunity: inline transformers

considered: extract getWishContent, validateWishContent, validateWishFileState to separate files

**decision**: keep inline — they are small (< 10 lines each), only used in one place. separate files would add overhead without benefit

### opportunity: combine empty and modified checks

considered: single validation function for all wish errors

**decision**: keep separate — each error has distinct message and recovery path

---

## verdict

no deletables found. each feature traces to vision or criteria. each component is:
- required for the feature
- already at minimal complexity
- follows extant patterns

the blueprint is already at its simplest form.

