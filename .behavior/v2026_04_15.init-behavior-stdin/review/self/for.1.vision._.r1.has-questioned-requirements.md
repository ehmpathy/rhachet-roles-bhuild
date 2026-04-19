# self-review: has-questioned-requirements

## requirement 1: `--wish @stdin|words` support

**who said?** the wisher, explicitly in 0.wish.md line 3

**evidence:** `want to be able to \`rhx init.behavior ... --wish @stdin|words\``

**what if we didn't?** user would need to open editor every time, losing the inline capture benefit

**could we achieve simpler?** no — this is already a single flag with two modes (inline, stdin)

**verdict:** holds. directly from wisher, minimal design.

---

## requirement 2: populate wish file before editor opens

**who said?** the wisher, in the example: "so that it populates the wish file before it gets openeed"

**evidence:** line 5 of 0.wish.md

**what if we didn't?** user types wish twice (terminal command then editor) — defeats the purpose

**could we achieve simpler?** no — the whole point is pre-population

**verdict:** holds. core to the wish's intent.

---

## requirement 3: support both inline words AND @stdin

**who said?** implied by the wisher's syntax `@stdin|words` — the pipe character suggests "or" (both modes)

**evidence:** the `|` in `@stdin|words` is a union syntax

**what if only inline?** can't handle special chars, multiline, quotes — poor ergonomics

**what if only stdin?** more friction for simple cases like `--wish "quick note"`

**verdict:** holds. both modes needed for pit-of-success across usecases.

---

## requirement 4: `--wish` and `--open` work together

**who said?** i inferred from wisher's example which shows both: `--open nvim --name @branch --wish "..."`

**evidence:** line 5 of 0.wish.md includes both flags

**what if mutually exclusive?** less flexible, user can't pre-populate then expand

**verdict:** holds. example shows combined use, makes sense ergonomically.

---

## requirement 5: error on empty `--wish ""`

**who said?** i added this assumption — NOT from wisher

**evidence:** none from wish

**what if allowed?** creates empty wish file... which is valid? user might want to `--open` after

**re-evaluation:** this might be over-constraining. empty string + `--open` could be valid: create structure, then edit.

**verdict:** questionable. need to ask wisher or simplify: allow empty if `--open` is also provided.

---

## requirement 6: findsert semantics for extant wish content

**who said?** i assumed this based on typical bhuild patterns

**evidence:** none from wish — wish says not one word about re-running on extant behavior

**re-evaluation:** the init.behavior skill already handles extant behavior directories (reuses them). wish content conflict is an edgecase.

**verdict:** reasonable assumption but not explicitly required. could simplify: just overwrite on re-init, or ask wisher.

---

## summary

| requirement | source | verdict |
|-------------|--------|---------|
| --wish @stdin\|words | wisher explicit | holds |
| pre-populate before editor | wisher explicit | holds |
| both inline and stdin modes | wisher syntax | holds |
| --wish + --open combined | wisher example | holds |
| error on empty wish | self-added | questionable |
| findsert semantics | self-added | questionable |

## issues found: 2

1. **empty wish handling**: i assumed error, but empty + `--open` is valid usecase
2. **findsert semantics**: i assumed conflict handling, but wisher didn't mention it

## how they were addressed

these are documented in "open questions" section of vision as assumptions to validate with wisher before implementation. no code changes needed at vision stage — just flagged for criteria/blueprint phase.
