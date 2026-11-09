# rule.require.vision-root-purpose

## .what

every vision opens with `## .the root purpose`: why the behavior is wanted at all, at least
**3 layers deep** — a why under a why under a why. each layer is a **motive** (why it
matters), never a **mechanism** (how it works). each layer is a `- why:` bullet, nested one
indent under the last.

```md
## .the root purpose

- why: surfers who book a lesson should get a reminder the day before
  - why: a surfer who forgets misses the slot, and the instructor waits on an empty beach
    - why: an empty slot is an instructor hour the school pays for and never recovers
```

## .why

- **a reviewer reads the motive before the shape.** without it, a reviewer grades a shape
  against no aim, and approves whatever looks tidy
- **the builder knows why it did the work.** a later stone that meets a fork can ask which
  branch serves the root, instead of which branch is easier
- **the vision is checked to serve its purpose.** a stated root lets a reader see whether the
  outcome world, the contract, and the evaluation answer to it — or ignore it

## .how — the five whys

1. start from the wish. ask why the wisher asked
2. ask why of that answer. write it as a `- why:` one indent deeper
3. repeat until the answer no longer shifts when you ask why again — that is the root
4. stop at 3 if the root holds there; go deeper if it does not. 3 is the floor, not the target

each why strips one layer of mechanism. the answer that no longer shifts is the buried motive
(`howto.domain-discovery`, architect). motive vs mechanism, and the trap of a mechanism in
motive words, live in `rule.forbid.vision-root-purpose-mechanism`.

## .enforcement

two lanes on the 1.vision guard, both peer reviews, each against its own rule:

| lane | rule | checks | how |
|---|---|---|---|
| `root-purpose-depth` | this rule | the section is present, holds no `<…>` scaffold text, and is ≥ 3 layers deep | deterministic: `rhx review.vision.root-purpose` |
| `root-purpose-motive` | `rule.forbid.vision-root-purpose-mechanism` | each layer is a motive, and the root is not a mechanism | a brain |

each concern has one owner lane, so an author answers it once:

| concern | grade | owner |
|---|---|---|
| section absent | **[blocker][better]** | `root-purpose-depth` |
| fewer than 3 layers, or flat bullets at one indent | **[blocker][better]** | `root-purpose-depth` |
| a layer left as scaffold text, or blank | **[blocker][better]** | `root-purpose-depth` |
| a why in another form (`* why:`, `1. why`, `- **why:**`), which the lane cannot read | **[nitpick][better]** | `root-purpose-depth` |
| the section sits below another `##` section, so the shape is read before its motive | **[nitpick][better]** | `root-purpose-depth` |
| a second `## .the root purpose` header, which the lane never reads | **[nitpick][better]** | `root-purpose-depth` |
| any layer names a mechanism — the root (the deepest layer) above all | **[blocker][better]** | `root-purpose-motive` |
| any layer is a filler that names no motive (`tbd`, `n/a`, `because`) | **[blocker][better]** | `root-purpose-motive` |
| a shape that never refers back to its root | **[nitpick][better]** | `root-purpose-motive` |

🔴 **the motive lane stays silent on presence, count, and scaffold.** the depth lane owns those,
and it counts them deterministically. the motive lane binds only its own rule, so it never reads
this one's floor.

the depth lane reads the header `## .the root purpose` alone on its line, the dot optional and
case-blind: `## .the root purpose (why)` or `### .the root purpose` reads as absent, and the fix
names the exact header. the `- why:` bullet reads case-blind too. position is a nitpick, never a
block: the section belongs first, right under the title, so the reviewer and the 1.vision human
gate read the motive before the shape; the absent fix names that place.

all grade `better`: a vision ships no code, and the human gate on 1.vision catches a misaimed
build before any code exists. the block comes from this rule, not from a shipped harm.

## .see also

- `rule.forbid.vision-root-purpose-mechanism` — the motive lane's rule: motive vs mechanism
- `howto.domain-discovery` (architect) — the five whys, and why motives outlast mechanisms
- `rule.require.experience-coverage` — the vision's other mandated section
- `rule.forbid.overzealous-blockers` (reviewer) — why these grade `better`
