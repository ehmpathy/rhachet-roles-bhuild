# self-review r9: has-ergonomics-validated

## deeper reflection: what ergonomics really means

ergonomics = adapt the tool to the human, not the human to the tool.

for this feature, ergonomics means:
- **input**: can i express my intent naturally?
- **output**: do i know what happened without guesswork?
- **errors**: do i know how to recover?

### input ergonomics

**vision claimed**: "like git commit -m"

**what i verified**:
- `--wish "text"` accepts quoted strings
- `--wish @stdin` accepts piped content
- argument parser handles quotes correctly (fixed in test utility)

**where it could fail**:
- shell escape rules for quotes in wish content
- multiline inline (requires heredoc)

**these are acceptable** because:
- vision acknowledged these as "awkward but normalized"
- @stdin pattern handles complex cases
- matches extant rhx patterns (sedreplace, git.commit.set)

### output ergonomics

**vision claimed**: "footer shows wish file path"

**what i verified**:
- snapshots show `+ 0.wish.md` in file list
- snapshots show behavior path in footer
- `--open` tip shown when wish provided without open

**what i looked for in snapshots**:
- is the wish file visually distinct? yes — listed in tree
- is success clear? yes — output shows files created
- is the path actionable? yes — user can navigate to it

### error ergonomics

**vision claimed**: "pit-of-success edgecases handled"

**what i verified**:
- `--wish ""` → `error: --wish requires content`
- `--wish` on modified file → `error: wish file has been modified` + hint
- both include recovery hints

**what recovery looks like**:
- empty wish: just provide content
- conflict: delete file first or use new behavior

### the "feel" test

if i were a user:
- would i know what happened? yes — output is clear
- would i know how to fix errors? yes — hints provided
- would i feel friction? no — single command achieves intent

## verdict

ergonomics validated. implementation matches vision's intended experience.
