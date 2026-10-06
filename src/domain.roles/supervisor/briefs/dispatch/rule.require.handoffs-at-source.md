# rule.require.handoffs-at-source

## .what

decomposition handoffs must be created in the source repo where full context exists, not in sandpine-notebook.

## .why

sandpine-notebook lacks domain context: claude writes "directional examples" then warns "don't trust
these", the implementer reads one doc then must find the real spec elsewhere, duplicate docs
drift from the source of truth.

the decomposer has full context: the briefs repo holds behavior specs, domain model, ground
truth. a handoff created there is authoritative — the implementer reads one source, no
translation.

## .pattern

| repo | owns | examples |
|------|------|----------|
| briefs repo | specs, handoffs, domain model | `3.3.1.blueprint.product.yield.md` |
| sandpine-notebook | pointers, progress, execution notes | `2026-05-30.2.1.execution.md` |

## .sandpine-notebook's role

sandpine-notebook tracks *when* and *how it went*, not *what to build*:
- pointers to handoffs: "rb1.3: see briefs path X"
- execution notes: blockers, decisions made
- progress: what got done
- reflection: what we learned

## .antipattern

```
sandpine-notebook/src/stream/2026-05-29.rb1.3.handoff.md:

  ## GROUND TRUTH (read this first)
  **examples in this handoff are DIRECTIONAL ONLY. do NOT trust them literally.**
  ...
```

this disclaimer is a code smell — it signals the doc shouldn't exist where it does.

## .enforcement

handoff doc in sandpine-notebook with "don't trust this" disclaimer = blocker
