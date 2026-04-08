# self-review: has-questioned-assumptions

## technical assumptions surfaced

### assumption 1: sedreplace will match all versioned patterns

**question**: will `sedreplace --old "v1.i1.md"` match all versioned artifact patterns?

**evidence**: grep found 30 files with `v1.i1.md` pattern. the pattern is literal text, not regex. sedreplace will match exactly.

**verdict**: holds — literal string match is reliable

### assumption 2: non-versioned stones need separate treatment

**question**: why not include `{stone}.md` in the sedreplace?

**evidence**: the non-versioned emit targets are:
- `1.vision.md`
- `2.1.criteria.blackbox.md`
- `2.2.criteria.blackbox.matrix.md`
- `2.3.criteria.blueprint.md`

these do not contain `v1.i1.md` — they emit to just `{stone}.md`. sedreplace with `v1.i1.md` won't touch them.

**verdict**: holds — separate treatment is necessary

### assumption 3: no TypeScript code needs changes

**question**: are there any TypeScript files that reference `v1.i1.md`?

**evidence**: grep of `src/**/*.ts` for `v1.i1.md` returns 0 matches. the pattern only exists in stone template files.

**verdict**: holds — confirmed via grep

### assumption 4: build and tests will pass

**question**: could this template content change break the build or tests?

**evidence**: tests do not reference artifact patterns. the change is to template text only, not to code structure.

**verdict**: holds — template content change cannot break TypeScript compilation

## simpler approach check

**question**: could a simpler approach work?

**answer**: the blueprint already uses the simplest approach:
1. one sedreplace for all versioned patterns
2. manual edits for 4 non-versioned stones (could also use 4 targeted sedreplace commands)

no simpler approach exists for this change.

## summary

| assumption | evidence | holds? |
|------------|----------|--------|
| sedreplace matches all versioned | grep shows pattern is literal | yes |
| non-versioned needs separate treatment | patterns don't contain v1.i1.md | yes |
| no TypeScript changes | grep returns 0 | yes |
| build/tests will pass | template-only change | yes |

**verdict**: all technical assumptions are supported by evidence.
