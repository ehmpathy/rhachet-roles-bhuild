# rule.forbid.vision-root-purpose-mechanism

## .what

no layer of a vision's `## .the root purpose` may name a **mechanism** (how it works). each
layer is a **motive** (why it matters) — the root, the deepest layer, above all.

a layer is a `- why:` bullet; each deeper layer nests one indent under the last.

## .scope — what this rule grades, and what it does not

🔴 **grade only the layers that are there, and whether each is a motive.** this rule does not
grade presence, count, depth, form, or scaffold text. those belong to
`rule.require.vision-root-purpose`, held by a deterministic lane (`root-purpose-depth`) that
counts them. a section with one layer, two layers, or none raises no concern under this rule; a
blank or `<…>` layer raises none either. a layer filled with words is graded here, filler or not.

## .motive vs mechanism

| a layer that names… | is a… | test |
|---|---|---|
| a gain or a harm to someone — time, money, trust, safety, a need met | **motive** | ask "why?" of it: the answer is a deeper motive, or naught deeper |
| a component, a flag, a file, a step, a tool, an api | **mechanism** | ask "why?" of it: the answer is a motive the layer skipped |

⚠️ **a mechanism can wear motive words.** the trap is a layer that reads as a reason and
names a part:

| 👎 mechanism in motive words | 👍 the motive beneath it |
|---|---|
| why: the reminder job must run on a cron | why: a surfer who forgets misses the slot |
| why: we need a `--force` flag | why: a human blocked by a stale lock loses an hour to dig it out |
| why: the guard must run a peer review | why: a vision with no aim gets approved for its tidiness |
| why: so the data lives in postgres | why: a lost reservation is a surfer turned away at the beach |

test: **could this layer be met by a different build?** yes → a motive. no — it names the
build itself → a mechanism. dig one more why.

## .an outcome for a person is not a mechanism

the surface layer often names the outcome the wisher asked for. that is a motive, not a
mechanism, even when it names the feature: an outcome for a person can be met by many builds.

| 👍 an outcome — a motive | 👎 a part of the build — a mechanism |
|---|---|
| why: surfers who book a lesson should get a reminder the day before | why: the reminder job sends an sms via the twilio api |
| why: an instructor should see who is booked before the lesson | why: the roster page must query the bookings table |

a mechanism names a part of the build: a component, a job, a schedule, a flag, a file, a tool,
an api, a step of the code. a layer that names what a person gets, avoids, or feels is a
motive, however close it sits to the feature. grade a layer a mechanism only when it names a
part of the build.

## .a filler is not a motive

a layer filled with words that name naught — `tbd`, `n/a`, `...`, `todo`, `because`, `why not` —
is neither a motive nor a mechanism. the depth lane counts it as a layer, since only a blank or a
`<…>` layer reads as scaffold to a count. so this lane grades it: a filler layer names no gain or
harm to anyone, and fails the motive test as a mechanism does.

| 👎 a filler | 👍 a motive in its place |
|---|---|
| why: tbd | why: a surfer who forgets misses the slot |
| why: because | why: an empty slot is an instructor hour the school never recovers |

## .the shape must serve the root

the rest of the vision answers to the root: the outcome world shows the root met, the
contract makes it reachable, the evaluation grades against it. a vision whose shape never
refers back to its root is a gap — but a soft one, since the 1.vision human gate reads both.

## .enforcement

| concern | grade |
|---|---|
| any layer names a mechanism — the root (the deepest layer) above all | **[blocker][better]** |
| any layer is a filler that names no motive (`tbd`, `n/a`, `because`) | **[blocker][better]** |
| a shape that never refers back to its root | **[nitpick][better]** |

both grade `better`: a vision ships no code, and the human gate on 1.vision catches a misaimed
build before any code exists. the block comes from this rule, not from a shipped harm.

## .see also

- `rule.require.vision-root-purpose` — the section, its depth floor, and its form
- `howto.domain-discovery` (architect) — the five whys, and why motives outlast mechanisms
- `rule.forbid.overzealous-blockers` (reviewer) — why these grade `better`
