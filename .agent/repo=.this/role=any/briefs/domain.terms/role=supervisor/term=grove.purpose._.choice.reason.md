# domain.term.choice.reason: grove.purpose

## .etymology

`purpose` = what a box is FOR. chosen because the question the gate asks is teleological, not
descriptive: not *"what is this box like"* but *"what is it kept for."*

the rejected alternatives, and why each fails:

| rejected | why |
|---|---|
| `role` | already taken, one layer down — a seat within a crew (`mechanic`, `foreman`, `reflector`). one word, two senses (`rule.forbid.domain-term-ambiguity`) |
| `kind` / `type` / `class` | describe what a box IS. two groves of different purpose are the same kind of box — the same ami, the same instance family. the difference is entirely in what we keep them for |
| `tier` | implies a rank (`prod` above `prep`). a lab is not a lesser work grove; it is a different job |
| `env` | ⛔ taken, and taken next door. `ahbode/infrastructure`'s `term=env` names a deploy stage, and `camp` is one of its values — so a camp env holds groves of BOTH purposes. to overload `env` here would make the two unresolvable |

## .the evidence — a boot onto the lab, 2026-09-07

the forest held two groves. the supervisor ran `rhx git.grove.saturation` before a sprout, as
`rule.require.bound-grove-concurrency-by-saturation` requires, and read:

| grove | cpu life | ram life | verdict |
|---|---|---|---|
| `grove-ahbode-v20260901` | 8.939% 🟡 | **53.278%** 🔴 | saturated |
| `grove-ahbode-v20260811` | 0.060% 🟢 | 0.000% 🟢 | headroom |

the saturation rule's own ladder, rung 3, reads **"sprout onto a different grove — the forest has
more than one; `rhx git.grove.list`."** the supervisor took it, and sprouted onto the august
grove: worktree, three ducts, a ledger row, a shipped wish, an install, three tabs.

the human's correction:

> *"did you just boot them on the forbidden august grove?"*
> *"only september grove is safe to boot. august grove is experiements only"*
> *"its the lab grove"*
> *"the ec2 is tagged deletable, so thats why it cant be used for crew boots"*

## 🔴 .the sharp part — EVERY instrument agreed, and the rule pointed straight at it

this was not a careless sprout. the supervisor read the saturation gate first, both axes, and
followed the rule's own remedy ladder. the lab grove was reachable, idle, 🟢 on both life rows,
and listed by `git.grove.list` beside the work grove with no distinction whatsoever.

⇒ **the tool did not merely fail to warn — it recommended the lab.** a rule whose remedy is
*"use another grove"* will select the wrong grove exactly as often as the fleet has a spare one,
until the tool can tell them apart.

⚠️ and the constraint was **deterministic the whole time**. it lived in an ec2 tag and in a
human's head, which is the definition of a gap in the tool
(`rule.always.entool-the-skills-you-touch`: a rule with one reader is a rule that drifts).

## .why the marker, and not the tag

the authority is the ec2 tag. to read it from here needs an aws call the supervisor may not be
able to make, so two cheaper reads were measured on the lab grove first:

```
/latest/meta-data/instance-id            → i-0ef69ace0d72910e0
/latest/meta-data/tags/instance/         → 404
```

⇒ IMDS answers, and `InstanceMetadataTags` is simply **off**. so the tag is unreadable from the
box today, and the grove is asked to declare itself instead — `~/.grove/purpose`, one word.

**the durable fix is upstream**, in whoever provisions the box (`ahbode/infrastructure`): write
the marker at provision time, or enable the metadata option so the tag itself is readable.

## ⚠️ .why the fallback list is a stopgap, and why it fails CLOSED

the grove slug is **reminted on every rebuild** — `grove-ahbode-v20260811` →
`grove-ahbode-v20260901` (`rule.always.sprout-on-a-grove-never-local`). so a slug hardcoded in
`CREWWORK_GROVES_BOOTABLE` goes stale on the next rebuild, and it goes stale **silently**.

⇒ that is precisely why `unknown` refuses rather than permits. the two failure directions are not
symmetric:

| the list goes stale toward… | the cost |
|---|---|
| **refuse** a new work grove | one error that names the exact fix, one marker written, done |
| **permit** an unknown grove | the boot this term exists to prevent, one rebuild later |

## .the clamps

`crewwork.verbs.integration.test.ts`, `[case3] a cloud grove`:

- `[t3] the grove is a LAB` — exit 2, `result.calls` is `[]` (the refusal lands before any duct),
  and the error names the grove, its purpose, the word `deletable`, and the marker path
- `[t4] the grove declares no purpose at all` — exit 2, opens naught, and the error says why it
  could not tell

the harness declares purpose through `CREWWORK_GROVE_PURPOSE` (defaulted `work`), the same seam
shape as `CREWWORK_DIR` and `FAKE_GROVE_TREE_DIR` — so a fabricated `grove-1` needs no real box to
ssh to, and the gate is exercised in **both** directions rather than skipped.

## .disputes

none open.

---

written by human + beaver 🦫
