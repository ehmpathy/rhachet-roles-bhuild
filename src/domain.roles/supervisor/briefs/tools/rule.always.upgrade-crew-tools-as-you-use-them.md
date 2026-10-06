# rule.always.upgrade-crew-tools-as-you-use-them

## .what

the `git.crew.*` / `git.grove.*` / `duct.*` skills in this repo's own
`.agent/repo=.this/role=any/skills/` are under active construction by whoever drives here
today — no separate team owns them, no dispatched crew holds them. when you find a gap in one
at the moment you reach for it, and the fix is safe and clean, upgrade the tool directly, in
the same round, rather than route around the gap or file it for later.

this is `rule.prefer.scouts-honor` (mechanic) applied to the supervisor's own instrument set.

## .why

a dispatched crew's tree belongs to that crew; a supervisor does not edit it directly
(`rule.forbid.adhoc-worktree-actions`). `repo=.this` is not that — it is the supervisor's own
home, read, written, and run by the same party in the same session. "not my tree", "a mechanic
should do this", "dispatch it" do not hold here. deferred instead, the fix pays twice: once as
a `.dream/` entry a future reader re-derives with less context, and once again for the next
traveler who hits the same gap first (`philosophy.pavement-saves-nature`).

## .the test

same as scouts-honor, applied to a tool rather than a file:

1. **safe?** does the fix touch behavior beyond the gap in hand, or risk work you cannot see?
2. **clean?** does it land as an additive branch (a new flag, a new early-exit), or does it
   ripple into every caller?

| safe | clean | verdict |
|---|---|---|
| ✅ | ✅ | fix it now, this round |
| ✅ | 🔴 | catch a dream — the ripple is real work |
| 🔴 | — | catch a dream — unsafe is the harder stop |

## .the shape of an in-round fix

- **additive, default-off** — a new flag a bare call never pays for, never a change to what an
  extant call already renders
- **delegate, never duplicate** — reuse the peer instrument that already reads the fleet rather
  than open a second channel (`rule.require.bulk-over-byhand`)
- **proven against the real case that found it** before you call it done
  (`rule.require.clamp-edge-cases`)
- **documented in the same file** — a `.why` comment beside the new branch

## .the bound

this is not a license to rewrite. a fix that ripples across the tool's callers, or touches
behavior beyond the gap in hand, is a dream and a fulcrum
(`rule.always.itemize-the-fulcrums-you-best-guess` if also a judgment call), never a
same-round rewrite smuggled in under this rule's name.

## .enforcement

- a safe, clean gap found at the moment a `repo=.this` crew tool is called, left as a
  workaround with no fix and no dream = **nitpick**
- a fix that ripples beyond the gap in hand, shipped in-round under this rule's name = **blocker**
- a fix shipped with no proof against the real case that found it = **nitpick**

## .see also

- `work.flow/rule.prefer.scouts-honor` (mechanic) — the general trait this rule instances
- `rule.always.fix-forward-under-scouts-honor` (driver) — the two-question test, verbatim
- `rule.require.bulk-over-byhand` — the worked example this rule generalizes
- `philosophy.pavement-saves-nature` (learner) — why a deferred fix costs more than an in-round one
- `rule.forbid.adhoc-worktree-actions` — the boundary this rule does NOT cross

---

written by human + beaver 🦫
