# term = factory upgrade — the reason

## .etymology — a human coinage, verbatim

the word was **not** authored by a robot. vlad coined it on 2026-08-04, in his own words:

> "lets create a rule and a hook to get us to collect **factory upgrades** as we supervise. i.e.,
> upgrades that can increase safety, decrease defects, improve speed, etc"

that provenance matters and is recorded as what it is: a **human attestation**, not a citation
of a prior art. per `rule.require.domain-discovery-for-term-proposals`, a term recognized by the
domain expert with no gloss is discovered rather than invented — and this one arrived from the
expert's own mouth, with its three gain axes attached.

## .why `factory`

the metaphor was already live in the repo before the word landed. a supervisor operates a
**fleet** of ducts and trees; the skills, hooks, briefs, and routes those run on are the
machines. the human's own supervisor persona brief is `im_a.bhuild_supervisor.md` — a beaver who
"builds dams that shape the flow" rather than swims the river. a factory is the word that
metaphor already wanted.

`factory` also draws the right line: it is **the plant, not the product**. an upgrade to the
plant serves every unit ever produced after it.

## .why `upgrade` and not `fix`

`fix` restores a capability that broke. `upgrade` covers that **and** the case where a tool that
already works gets raised — e.g. a poll that hashes spinner lines is not broken, it is merely
imprecise, and precision is a raise.

the three gain axes are what unify the two: a repair and a raise both qualify, so long as one of
safety / defects / speed goes up.

## .the evidence — one supervisor session, 19-duct fleet, 2026-08-03/04

eight surfaced. two survived. the survival pattern is the argument for the term's existence:

| # | the upgrade | survived? | why |
|---|-------------|-----------|-----|
| 1 | `git.tree.del` exits 2 before its own safety gate runs | ✅ fixed | it halted a teardown i needed |
| 2 | `duct.send` reports `✔ submitted` on a stranded message under load | ❌ lost | — |
| 3 | `duct.poll` reads wrapped sha lines as prompt options | ❌ lost | — |
| 4 | `duct.poll` hashes spinner lines, so a frozen duct reads `🌊` forever | ❌ lost | — |
| 5 | `duct.list` keeps entries for stopped ducts | ❌ lost | — |
| 6 | a hook gap lets a command reach claude's own shell classifier | ❌ lost | — |
| 7 | briefs cited into repos that do not carry them read as fabricated | ❌ lost | — |
| 8 | a keyrack error names neither the failed value nor the fix | ✅ filed | it halted a push i needed |

**both survivors blocked the observer personally.** that is the whole discovery: an upgrade with
a victim gets repaired by necessity, and an upgrade that would spare only the NEXT operator has
no pressure behind it at all. a filter built on pain reliably keeps the ones that were safe
anyway.

### the sharpened filter — three more, 2026-08-04, and the thesis they correct

three further upgrades surfaced the same day, all while the very behavior meant to collect them
was under design:

| # | the upgrade | who it blocked |
|---|-------------|----------------|
| 9 | nheuron is unreachable from a mechanic's worktree by every sanctioned tool — `git.repo.get` does not index it, `globsafe` refuses a `--path` outside the repo root, and the permission hook denies both `cd` and `git -C` | a mechanic, 5 stalled probes |
| 10 | the route stillness guard says `the pond barely rippled` and names neither the required window nor what resets it — and what resets it (the yield's content hash) is non-obvious enough that two drivers each spent ~15 min to reconstruct it | two mechanics, ~30 min |
| 11 | self reviews are revealed serially, so a driver stalled on review N has zero available work on N+1 — the stall is structural, not a choice | a mechanic |
| 12 | a shell-function override (`cd() { :; };`) slips past a permission check meant to block that command | nobody — caught in flight |
| 13 | a hook that invokes a RELATIVE `./node_modules/.bin/rhx` resolves it from the shell cwd, so every hook crashes in any worktree whose shell sits below the repo root — and the harness runs the command anyway | a mechanic, and the supervisor's own diagnosis |
| 14 | peer reviews cached at a stale iteration block on issues already fixed after that iteration | a mechanic |
| 15 | the permission allowlist carries `rhx` as a prefix and no prefix for `./node_modules/.bin/rhx` — yet a mechanic that verifies its OWN branch build must use the direct path, since bare `rhx` resolves the published package | a mechanic, a dozen stalls |

**none of the three blocked the observer.** each blocked a *mechanic* — and a mechanic cannot
repair the tool it is blocked by, because the tool lives outside its worktree and its bound
wish forbids the detour.

so the original thesis was close but not exact. the filter is not "blocks the observer"; it is
**"blocks whoever holds the authority to fix it."** those two coincide often enough that one
session could not tell them apart, and they come apart precisely here: a defect that halts a
mechanic has a victim, real pain, and still no path to repair. it is *more* durable than a
defect nobody hit, and *less* likely to be fixed.

that widens what the mechanism must catch. an upgrade needs a mechanism not merely when it
lacks a victim, but whenever the victim and the repairer are different parties.

### #13 is a different KIND, and it raises the term's own stakes

twelve of the fourteen are defects in a tool that still works. **#13 is a defect in the
machinery that guards the machinery**, and it fails **open**: every PreToolUse hook in an
affected worktree crashes, prints its crash, and the harness runs the command regardless.

the consequences observed, in one afternoon, all traceable to that one root cause:

- a `cd() { :; };` shim reached claude's own classifier rather than the repo's
  `forbid-suspicious-shell-syntax`, which never ran (#12 read as a hook GAP; it was a hook
  CORPSE)
- a stderr-to-stdout redirect passed `forbid-stderr-redirect`, which never ran
- the supervisor read both as "the hooks permitted this" and drew a wrong conclusion about
  hook coverage from evidence that showed only hook absence

so a factory upgrade is not always a repair to a tool. sometimes it is a repair to the
**guard on a tool** — and that class is uniquely dangerous, because its symptom is *silence
where a block should have been*, which no operator is positioned to notice. you cannot see a
gate that did not stop you.

this is also why the eight crash lines per command are worse than a hard failure would be.
they are loud enough to be dismissed as noise and quiet enough to halt no command at all —
`rule.require.failloud` is satisfied to the letter while the gate stands open.

**the extant `fail*` family does not name this case.** `failfast` halts, `failloud` reports
with a fix, `failhide` swallows. here the error is neither swallowed nor acted upon: it is
*published and disregarded*. the established prior art for that shape is **fail-open** (vs
fail-closed), from access-control design — cited here rather than coined, and deferred to the
`fail*` family's owner (`repo=ehmpathy/role=mechanic`) rather than paved into it from outside.

### the second axis — friction vs GAP

`#15` forced a distinction the three gain axes do not capture. two upgrades can both claim
**speed** and be worlds apart in urgency:

| severity | what it means | example |
|----------|---------------|---------|
| **friction** | a compliant path exists; it is merely slower or noisier | `#10` — the stillness guard names no window, so a driver spends ~15 min to reconstruct it |
| **gap** | NO compliant path exists at all | `#15` — the allowlist covers only the shorthand, while a branch-build check *requires* the direct path |

the difference is what an operator can do while they wait. under friction they proceed, slowly.
under a gap they must choose between a stall and a violation — and the escape is usually a
**trap that looks like a fix**: bare `rhx` clears the prompt instantly and verifies the
*published package*, so it buys speed and proves naught.

a gap therefore outranks its own gain axis. a speed gap that pushes an operator toward a silent
false pass is a safety defect under a speed label.

## .rejected alternatives

- **`tech debt`** — the term of art implies a shortcut once taken and now owed. six of the eight
  above were never owed by anyone; they are defects nobody had yet seen. to call a discovery a
  debt misassigns blame and invites a triage rule ("pay down debt") that does not fit.
- **`chore`** — carries a cadence and a low stakes. #1 was a safety gate that never ran.
- **`meta-work`** — defines the term by what it is not, so it bounds naught.

## .the open dispute — the boundary against its two siblings

three capture mechanisms now live in the same family, and their edges are **not settled**:

| mechanism | captures | home |
|-----------|----------|------|
| `catch.dream` (`repo=bhuild/role=dreamer`) | a transient idea, caught without focus loss | `.dream/` |
| `learn.domain.terms` (`repo=bhrain/role=learner`) | a term the round touched | `domain.terms/` |
| **factory upgrade** | a defect in the machinery, seen under load | unsettled |

the dispute is live and deliberately left open: a factory upgrade may be a **kind of dream**
(caught mid-flow, triaged later), or a genuinely different grain (it has a gain axis and an
evidence requirement, which a dream does not).

#### where the authority lives — corrected 2026-08-04

an earlier revision of this file claimed that `ehmpathy/rhachet-roles-bhuild` branch
`beav/feat-factory-upgrade-collection` held the authority to settle the boundary. **that claim
is now stale.** the work was re-routed: it is queued as `ehmpathy/rhachet-roles-bhuild#313`
(`status: QUEUED`), and the branch is held, uncommitted, parked at its vision approval gate
while it awaits a human decision on its fate.

the correction is itself an instance of a lesson a mechanic surfaced the same day:

> when a comment in file A states what file B does, it is a claim about B, and it is
> **checkable**.

a glossary keeps two names from drift. it does not keep a claim current — and a stale claim in
a `.reason` file is worse than an absent one, because a reader trusts a documented provenance
more than an undocumented one.

**`#313` now holds the authority.** this file records the term as it stands, not as it will end.

#### the proposed resolution — evidenced, NOT yet settled

the held branch did reach an answer before it was parked, and reached it against data rather
than by assertion. it is recorded here as a *proposal*, because no approved artifact carries it:

- its first cut — that a dream is product-grain and an upgrade is factory-grain — was **refuted
  by its own check**: all 7 records in nheuron's `.dream/` are already factory-grain, and one
  of them claims a defects gain outright. so **subject cannot separate the two.**
- the seam that survived the data is **time direction**: a dream points *forward* at a tool that
  does not exist; a factory upgrade points *backward* at a tool that shipped and cost you.
- against that seam, all 7 dreams and all 11 upgrades sort cleanly. none crosses.

that is a strong candidate and it is not a settlement. `#313` may adopt it, sharpen it, or
refute it in turn — and until an approved artifact says so, the dispute stays **OPEN**.

incidental but verified along the way: **`.dream/` is tracked, not gitignored** — 7 records
deep, back to `2026_06_12`.

per `howto.domain-term-disputes` — adhere, or argue, never drift. this is the argument, on
record.

## .see also

- `term=factory-upgrade._.choice._.md` — the choice itself
- `ehmpathy/rhachet-roles-bhuild#313` — the queued task that holds the authority to settle the
  boundary. seeded (radio push), not sprouted — see `define.sprout-vs-seed.md`
- `src/stream/2026.Q3/2026-08-04.dispatch.repo=rhachet-roles-bhuild.behavior=feat-factory-upgrade-collection.wish.md` — the wish body pushed into `#313`, which carries the first eight with their evidence

---

written by human + beaver 🦫
