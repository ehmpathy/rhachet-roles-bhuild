# F4 — the bhuild → rhachet-roles-ehmpathy dependency edge

| | |
|---|---|
| **rework** | 🔴 dirty — ⚠️ **moot; the branch that was dirty is not taken** |
| **status** | ✅ **ruled 2026-09-22 — no dependency. the fork dissolved at its premise** |
| **confidence** | 65% at the call · **100% after the wisher's question** |
| **where** | `case=1` `[t9]`, handoff §2.4 |

## .the fork, stated fairly

sprout rung 3 refuses a `--name` that holds `declapract` and points the caller at a second route.
**that route lives in another package**:

| artifact | home | verdict |
|---|---|---|
| `git.tree.declapract.upgrade.sh` (221 lines) | nheuron `role=any` | ✅ **lifts** — it is a tree verb |
| `declapract.upgrade.sh` + `{init,exec,output}.sh` + 12 route templates (18 files) | `ehmpathy/rhachet-roles-ehmpathy`, `mechanic/skills/` | ⛔ **stays** — already packaged |

so the lift inherits a **cross-package call**: the supervisor's tree verb boots a route the
mechanic owns. it works today only because both happen to be on PATH in nheuron — an ambient
coincidence, not a declared edge. §2.4: *"confirm that edge is acceptable before you port the
refusal."*

measured in this repo's `package.json` today: `rhachet-roles-ehmpathy` is a **devDependency**
(1.38.12). it is **not** a runtime dependency, and the `peerDependencies` block names `rhachet`,
two brains, and `rhachet-roles-bhrain` — not this one.

| branch | consequence |
|---|---|
| promote to a **peer/runtime dependency** | the edge is declared and honest; every consumer of bhuild now installs ehmpathy's roles too, and the two packages' release cycles couple |
| leave it **ambient**, refusal ports as-is | no dependency change; the refusal points at a route a consumer may not have, and the pointer fails the same way `case=5` describes |
| **soften the refusal** — keep the exit-2, make the pointer conditional on whether the route resolves | no hard edge; the message degrades gracefully where the mechanic's roles are absent |

## .taken, and why at the time

**the third branch: keep the refusal, make the pointer conditional.** do not promote the
dependency in this PR.

reasons:

1. the refusal's *value* is that it stops the wrong route from a boot. that value is entirely
   local and needs no cross-package edge.
2. a **peer dependency between two published role packages** is a release-surface change that
   every consumer inherits. it is out of proportion to one refusal message.
3. it keeps `case=5`'s rule honest — a pointer that may not resolve should say so, rather than
   assert a path it cannot guarantee.

## .rework, and why it is dirty

to add a peer dependency later is additive and cheap. to **remove** one, once consumers have
installed against it, breaks every consumer on a published package. the asymmetry is the whole
reason this is a council item: the reversible direction is the one that stays un-taken.

## .confidence, and why it is 65% — the lowest in the inventory

the lowest of the six, and honestly so:

- the wish does not mention this edge at all; only the handoff does
- the third branch is **my invention**, not one the handoff offered. it may be over-clever — a
  conditional pointer is a code path, and `rule.require.fewer-paths-via-idempotency` argues
  against paths that exist only to be polite
- i have **not** verified whether `rhachet` already resolves cross-package skills in a way that
  makes the whole question moot. that check is cheap and was not run — it belongs in the blueprint
- the same shape recurs one package over (rung 3 → bhuild's `init.behavior`), and that one the
  lift **collapses**. a reviewer could fairly ask why this edge gets the opposite treatment

## 🔴 .the verdict, once ruled — 2026-09-22

> **the wisher: *"why would bhuild need a runtime dep on ehmpathy?"***

**no dependency. take the SECOND branch — port the refusal as-is, pointer and all.** not the third.

🔴 **and the question dissolved the fork rather than settled it.** i framed this as a choice among
three branches, and the premise under all three was false. the call site, read at source:

```bash
188: boot_route="rhx declapract.upgrade init"
200: rhx duct.send --on "$(__crew_duct_uri "$host" "$slug" mechanic)" --await 60 \
       --what "$boot_install && rhx upgrade && $boot_route && $boot_drive"
```

⇒ it is **a command string sent into a duct on the target box**. not an import, not a local
subprocess — a line of text that `rhx` looks up **on that host, inside that repo, against that
repo's linked roles**. bhuild's `package.json` is not in that lookup path at all.

| what i assumed | what is measured |
|---|---|
| the edge is a **dependency**, declarable in a manifest | the edge is a **string**, looked up at the consumer's link tree |
| a dep would make the pointer honest | a dep would not put `declapract.upgrade` on the target's PATH. it is the wrong instrument |

🔴 **and the lift's own thesis already said so.** `case=1` is built on the fact that a skill is
found via a **linked** role, never via a merely present one — `H3` in the yield states it outright
(*"install ⇒ enroll"* is a hidden assumption; a consumer that installs but never runs `roles link`
gets `no skill found`). ⇒ **i had the refuting fact on record, in my own artifact, and did not
apply it here.** the fulcrum should never have reached the council.

### why not the third branch either — the conditional pointer

i invented it, and my own confidence note called it *"over-clever"* while i took it anyway. a
conditional that exists only to soften a message is a code path with no behavior behind it
(`rule.require.fewer-paths-via-idempotency`). the refusal's value is local: it stops the wrong
route from a boot. the pointer is prose, and prose that names a route a reader may not have linked
is exactly as honest as prose can be.

### 🟡 the residue — a real check, at a different grain

one thing survives, and it is not a dependency question: **does the refusal message tell a reader
how to link the mechanic role?** that is `rule.require.errors-name-the-fix`, it is free, and it
belongs to execution — never to a release-surface decision.

### 🔴 the lesson

> **a fulcrum can be wrong at its PREMISE, and a confidence score will not find that.**

i graded this 65% — the lowest in the inventory — and every doubt i listed was about *which branch
to take*. none asked whether the fork existed. ⇒ the honest reading of that 65% was never *"i am
unsure among three options"*; it was **a signal to re-derive the premise**, and i spent it on a
comparison instead.

⚠️ the shape is `H12`'s, one level up: a **summary** of a mechanism stood in for the mechanism. i
read §2.4's phrase *"confirm that edge is acceptable"*, took *edge* to mean a dependency edge, and
never opened the call site until the wisher asked.

---

written by human + beaver 🦫
