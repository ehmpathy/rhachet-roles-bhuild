# rule.always.vouch-for-what-you-just-wrote

## .what

> **a verb that WRITES must read back what it produced, and refuse to claim success over a
> result it cannot vouch for. fail fast, and name the verb that heals it.**

a verb reports on its calls. it must also report on its result — two different reads, at two
different moments, against two different subjects.

## .why

every step of a write verb can succeed while what it built stays broken: a tab opens, a window
matches, five calls return five successes — and the crew still has no view of its own ducts,
because the tabs attached a different tree entirely. every per-call line was accurate; the
result was not.

a report that prints a defect and still returns 0 leaves the fix to a human who did not ask
for it, on an unattended fleet where nobody checks
(`rule.always.grade-infra-on-unattended-operation`). a gate — a non-zero exit — forces the verb
that made the mess to act now, instead of hand it off to whoever next happens by.

## .what a vouch owes

1. **grade the artifact, never the record of it.** a registry row, a returned id, a stored
   host is a claim about the object — ask the object. a tab knows what it runs; the row that
   names it does not.
2. **derive the whole subject, never the slice this call touched.** a `--roles` call that
   leaves a peer tab crossed has still left the crew's view broken.
3. **fail fast — a non-zero exit, never a warn line.** the caller may be a cron, a hook, or
   another verb; only an exit code reaches all three.
4. **name the heal verb, as a runnable command** — e.g. `rhx git.crew.heal --tree <tree> --what
   view --mode apply` — because the verb that detected the defect knows the tree, the axis, and
   the mode (`rule.require.errors-name-the-fix`, ergonomist).

## .the cues

| when… | then… |
|---|---|
| you write a verb that creates, opens, or repairs | it owes a post-read of its own result before it returns 0 |
| every step returned 0 and you would print ✅ | ask what a human would check. check that |
| you would print a defect and `return 0` | that is a report. it must be a gate |
| your check reads a row, an id, or a stored field | those are claims — ask the artifact |
| your check covers only the roles/files this call touched | derive the whole subject |
| you write the check inline, in the verb | lift it to a callable — a reporter and a gate must share ONE implementation |
| the heal is a different verb | name it with its flags, runnable as printed |
| a check is genuinely expensive | say so, and gate it behind a flag — never omit it in silence |

## .one implementation, two readers

a gate and a report that each carry their own copy of the check will drift, and then disagree
about which results are sound. lift the check into a function: one reader reports with it, the
other gates with it. one seam, one verdict.

## ⚠️ .the bound

the subject is what this verb just wrote, never the fleet. a `crew.show` on one tree vouches
for that tree's view; it does not audit every crew — a vouch that grows into a full sweep makes
every verb slow and gets disabled, which costs more than it ever caught. and a vouch grades
what the verb promised, never every adjacent property — `crew.show` vouches for the view axis;
the work axis is a different verb's promise.

## .enforcement

- a write verb that returns 0 with no read-back of its own result = **blocker**
- a defect detected and printed with a `return 0` = **blocker**
- a vouch that grades a record where the artifact could be asked = **blocker**
- a vouch scoped to the call's arguments rather than the derived subject = **blocker**
- a failed vouch with no runnable heal command = **blocker**
- a check copied into both a reporter and a gate rather than shared = **blocker**
- a vouch that widens into a fleet sweep = **nitpick**

## .see also

- `rule.require.verify-after-send.md` — the supervisor's half of this claim; this is the verb's half
- `rule.always.grade-infra-on-unattended-operation.md` — a report left for a human is a defect left in place
- `term=false-report._.choice._.md` — the family every violation lands in
- `term=partial-audit._.choice._.md` — clause 2's failure, named
- `rule.require.errors-name-the-fix` (ergonomist) — clause 4
- `rule.prefer.prevent-over-correct` (ergonomist) — the ladder this sits on; a gate is rung 3

---

written by human + beaver 🦫
