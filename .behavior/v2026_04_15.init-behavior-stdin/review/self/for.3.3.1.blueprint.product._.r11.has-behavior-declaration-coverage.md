# self-review r11: has-behavior-declaration-coverage

## why r11?

verify every requirement from vision and criteria is addressed in the blueprint. check line by line.

---

## vision requirements

trace from `1.vision.yield.md`:

### req V1: inline wish capture

**vision says**: `--wish "inline words"` for quick capture

**blueprint coverage**: [case1] inline non-empty

**implementation**: schema adds `wish: z.string().optional()`, logic extracts content directly if not @stdin

**verdict**: covered

### req V2: stdin pipe

**vision says**: `echo "my wish" | rhx init.behavior --name foo --wish @stdin`

**blueprint coverage**: [case2] stdin non-empty

**implementation**: `if (named.wish === '@stdin') { wishContent = readFileSync(0, 'utf-8').trim(); }`

**verdict**: covered

### req V3: heredoc for multiline

**vision says**: `rhx init.behavior --name foo --wish @stdin <<'EOF'\n...\nEOF`

**blueprint coverage**: [case2] stdin non-empty handles heredoc (heredoc pipes to stdin)

**implementation**: same @stdin handler, heredoc is standard shell syntax

**verdict**: covered

### req V4: combined with extant options

**vision says**: `--name @branch --wish "..."`

**blueprint coverage**: blueprint focuses on --wish; @branch is extant behavior (name expansion)

**implementation**: wish logic is additive, doesn't modify extant name logic

**verdict**: covered (orthogonal to extant behavior)

### req V5: wish file format

**vision says**: wish file contains `wish = \n\n<content from --wish>`

**blueprint coverage**: implementation detail line 214: `writeFileSync(wishPath, 'wish =\n\n${wishContent}\n');`

**verdict**: covered

### req V6: empty wish error

**vision says**: `--wish ""` → error: wish content required

**blueprint coverage**: [case3] inline empty error, [case4] stdin empty error

**implementation**: `if (!wishContent) { console.error('error: --wish requires content'); process.exit(2); }`

**verdict**: covered

### req V7: modified wish error

**vision says**: error if wish file already has non-template content

**blueprint coverage**: [case5] inline + modified wish error

**implementation**: `if (wishCurrent.trim() !== 'wish =') { console.error('error: wish file has been modified'); ... }`

**verdict**: covered

### req V8: combined with --open

**vision says**: `--wish "..."` + `--open nvim` → wish populated, then editor opens

**blueprint coverage**: [case6] inline + open combined

**implementation**: wish logic runs BEFORE openFileWithOpener (sequence preserved)

**verdict**: covered

---

## criteria usecases

trace from `2.1.criteria.blackbox.yield.md`:

### usecase.1: inline wish capture

**criteria says**:
- behavior directory is created
- wish file contains `wish = \n\nmy wish content`
- route is bound
- output shows tree

**blueprint coverage**: [case1] inline non-empty

**verdict**: covered

### usecase.2: stdin wish capture

**criteria says**:
- wish file contains piped content
- heredoc multiline works

**blueprint coverage**: [case2] stdin non-empty

**verdict**: covered

### usecase.3: combined with --open

**criteria says**:
- wish file pre-populated
- editor opens with wish file
- wish content appears in editor

**blueprint coverage**: [case6] inline + open combined

**verdict**: covered

### usecase.4: extant behavior reuse

**criteria says**:
- template-only wish file → update with new content
- user-modified wish file → error: already modified

**blueprint coverage**:
- template-only: validated via `wishCurrent.trim() === 'wish ='` (passes, populated)
- modified: [case5] inline + modified wish error

**verdict**: covered

### usecase.5: error: empty wish

**criteria says**:
- error for `--wish ""`
- error for empty stdin
- behavior directory NOT created
- exit code non-zero

**blueprint coverage**: [case3] inline empty error, [case4] stdin empty error

**implementation**: error check happens AFTER initBehaviorDir call. let me verify.

**re-check**: codepath tree lines 66-74:
```
└── [~] initBehavior (main)
    ├── [○] getCliArgs
    ├── [○] initBehaviorDir
    ├── [+] getWishContent
    ├── [+] validateWishContent
```

initBehaviorDir runs before validateWishContent. this means directory IS created before empty check.

**issue found**: criteria says "behavior directory is NOT created" for empty wish, but blueprint runs initBehaviorDir before validation.

**fix required**: move empty check before initBehaviorDir

**re-read criteria usecase.5**:

```
given(a new behavior name)
  when(user runs `rhx init.behavior --name foo --wish ""`)
    then(error is returned: "wish content required")
      sothat(user knows to provide content)
    then(behavior directory is NOT created)
      sothat(incomplete state is avoided)
```

The criteria DOES say directory NOT created. This is a gap in the blueprint.

**gap identified**: blueprint validates empty wish AFTER initBehaviorDir, but criteria requires directory NOT created on empty wish.

**severity**: blocker — criteria explicitly requires this behavior

---

## gap analysis

### gap 1: empty wish should prevent directory creation

**criteria requirement** (usecase.5):
> then(behavior directory is NOT created)
> sothat(incomplete state is avoided)

**blueprint current**:
1. initBehaviorDir (creates directory)
2. getWishContent
3. validateWishContent (errors on empty)

**blueprint should be**:
1. getWishContent (if wish flag present)
2. validateWishContent (error early on empty)
3. initBehaviorDir (only runs after wish validated)

**fix**: move wish validation before initBehaviorDir in codepath tree

---

## rest of coverage (post-gap)

### usecase.6: error: absent value

**criteria says**: error if `--wish` has no value

**blueprint coverage**: handled by zod schema — `z.string()` requires string value

**verdict**: covered (parse-time error)

### usecase.7: backwards compatibility

**criteria says**: no --wish flag → template only, extant behavior preserved

**blueprint coverage**: [case7] absent --wish backwards compat

**verdict**: covered

---

## criteria matrix coverage

from `2.2.criteria.blackbox.matrix.yield.md`:

### matrix 1: wish mode x content x file state

| row | coverage |
|-----|----------|
| absent + absent | [case7] |
| absent + template | extant behavior |
| absent + modified | extant behavior |
| inline + empty + absent | [case3] — **GAP: dir should not be created** |
| inline + empty + template | [case3] |
| inline + non-empty + absent | [case1] |
| inline + non-empty + template | implicit in [case1] |
| inline + non-empty + modified | [case5] |
| stdin + empty + absent | [case4] — **GAP: dir should not be created** |
| stdin + empty + template | [case4] |
| stdin + non-empty + absent | [case2] |
| stdin + non-empty + template | implicit in [case2] |
| stdin + non-empty + modified | [case5] |

### matrix 2: wish mode x open flag

all covered by [case6] inline + open combined

### matrix 3: behavior directory lifecycle

**GAP**: rows with `empty` content show `not-created` for behavior-dir, but blueprint creates dir before validation

---

## summary

| check | status |
|-------|--------|
| vision req V1-V8 | all covered |
| criteria usecase.1-4 | covered |
| criteria usecase.5 | **GAP: sequence wrong** |
| criteria usecase.6 | covered (zod) |
| criteria usecase.7 | covered |
| matrix coverage | **GAP: empty wish dir lifecycle** |

---

## fix required

**issue**: empty wish validation happens after directory creation, violates usecase.5 requirement

**fix**: reorder codepath to validate wish content BEFORE initBehaviorDir

**new codepath tree**:
```
└── [~] initBehavior (main)
    ├── [○] getCliArgs
    ├── [+] getWishContent                 # [MOVED] if named.wish, extract content
    ├── [+] validateWishContent            # [MOVED] if wish, check non-empty BEFORE dir
    ├── [○] initBehaviorDir                # only runs after wish validated
    ├── [+] validateWishFileState          # check template-only
    ├── [+] writeWishFile                  # populate 0.wish.md
    └── [○] openFileWithOpener
```

---

## verdict

**gap found**: empty wish validation sequence wrong

**action**: update blueprint to move wish validation before initBehaviorDir

**fix applied**: updated codepath tree and implementation detail to:
1. extract wish content BEFORE initBehaviorDir
2. validate non-empty BEFORE initBehaviorDir (early exit prevents directory creation)
3. validate file state AFTER initBehaviorDir (requires wish file to exist)
4. write wish file AFTER initBehaviorDir

all criteria requirements now covered. no issues remain.

