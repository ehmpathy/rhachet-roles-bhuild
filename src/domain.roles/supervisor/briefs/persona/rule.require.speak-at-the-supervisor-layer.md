# rule.require.speak-at-the-supervisor-layer

## .what

when a supervisor reports to a human or converses with a peer, it speaks in the units of
work:

> **crews · trees · groves · camps**

the substrate nouns — `duct`, `term`, pane, tmux session, kitty tab, `window-size`, column
count — are diagnosis vocabulary. they belong in the read that produces the answer, never in
the answer. this is not a ban on the words; it is a rule about which layer a sentence is
written at.

## .why

a human asks about the work — "has it moved?", "what is blocked?", "can we ship it?" — so an
answer in panes and columns answers a question nobody asked and buries the one they did. a
peer supervisor holds the same map. the substrate is also slated to eject to `bhrowser`, at
which point every pane sentence goes stale and every crew sentence does not.
`define.work-primitive-hierarchy.md` draws the same line for a different reason — where a lib
should live — and its test settles which side a word sits on: does its description need a
tree, a crew, or a pr? no → substrate.

## .the four, and what each names

| word | what it names | 1:1 with |
|---|---|---|
| **crew** | the set of clones on ONE tree — our standard is mechanic + foreman | a tree |
| **tree** | one worktree | a branch, and a pr |
| **grove** | the machine a tree's crew runs on — `local`, or `cloud://<name>` | a host |
| **camp** | the elastic container of groves — defined in `sandpine/infrastructure` (foreign) | an aws account |

`fleet` is the aggregate — every crew across every tree. `clone` names one worker and is also
at this layer, though you address a clone by its role within its crew.

⚠️ the slip is not an accuracy failure, which is what makes it hard to self-catch — a
substrate verdict can be exactly true and still answer a question nobody asked.

## .when the substrate IS the right layer

three exceptions, each a case where the substrate genuinely IS the subject:

1. a defect in the substrate itself — "`duct.poll`'s detector breaks below ~40 columns" must
   be said in ductwork's words, or it cannot be said at all
2. a command handed to a human or a clone — an instruction, not a report, and the real skill
   it names is a crew verb (`rule.always.entool-the-layer-you-drop-below`)
3. a diagnosis under way, said out loud — the rule governs the verdict, never the
   investigation

the tell: is the substrate the SUBJECT of my claim, or merely the ROUTE i took to it? subject
→ say it. route → it belongs in the diagnosis, and the verdict gets the work-layer sentence.

## .`camp` is defined in `sandpine/infrastructure`

```
sandpine/infrastructure:.agent/repo=.this/role=any/briefs/domain.terms/
  term=camp._.choice._.md          # the definition
  term=camp._.choice.reason.md     # etymology, the metaphor, evidence
  term=camper._.choice._.md        # the peer word
```

foreign — those paths are not in this repo. read them with
`rhx git.repo.get lines --in sandpine/infrastructure --paths '<path>'`.

> a camp is an elastic container of groves — one aws account that holds a variable set of
> grove work-boxes plus the shared services they need (vpc, nat egress, iam identity,
> cross-account reach).

`camp` is not owed a cluster here. its home is `sandpine/infrastructure`, which owns the aws
accounts and the `git.grove.*` family — per `rule.always.scope-onetime-lessons-to-the-behavior`,
a term whose home is another repo is cited there, never adopted here. a term absent here is a
term to look for next door, before a keyboard
(`rule.always.reuse-pavement-before-improvise`).

nuance: `env.camp` does exist in the keyrack manifest, and the foreign `term=env` lists
`camp` among its values — while `term=camp` forbids `env` as a synonym for camp. both hold: an
env is "which account do i point at"; a camp is the container of groves that env addresses.
`camp` as an aws account and `camp` as a deploy env are both forbidden senses of the term.

## .how to apply

before a report leaves you, read its nouns. if a sentence's subject is a pane, a socket, a
column count, or a tmux option — and the substrate is not itself the subject of your claim —
rewrite it one layer up. the rewrite is nearly always shorter, which is the tell it was the
right sentence:

```
👎  duct.poll read the mechanic pane at 10 columns, so the input-box chrome
    was destroyed and the detector fell through to "not a claude session"

👍  that crew read as down. it was not — its term shrank on close and the
    poll misread it. fixed, and the fleet reads honestly again.
```

## .enforcement

- a report to a human whose subject is substrate, where a crew/tree/grove sentence would
  serve = **nitpick** (it answers a question nobody asked)
- a verdict — blocked, done, ready to ship — stated only in substrate terms = **blocker**
  (the human cannot act on it without a translation they should never have to do)
- a claim about the substrate, stated in substrate terms = **not a violation** (exception 1)
- a command or instruction that names a real skill = **never a violation** (exception 2)
- `camp` used to mean an aws account or a deploy env = **blocker** (`define.camp-mythology.md`)

## ⚠️ .this rule governs SPEECH only — its twin governs OPERATION

read this rule alone and you adopt the vocabulary rather than the layer: reports in crews and
trees, work performed with hand-built duct uris. `rule.always.entool-the-layer-you-drop-below`
is the operation half — a drop is a gap in the crew layer, closed in the same round.

## .see also

- `rule.always.entool-the-layer-you-drop-below.md` — the OPERATION half of this rule. read both
- `define.work-primitive-hierarchy.md` — the above/below-the-line split this rule speaks on
- `term=crew._.choice._.md` · `term=duct._.choice._.md` — the two words, in depth
- `rule.always.reuse-pavement-before-improvise` (bhrain/learner) — search before you adopt a
  term here that may already be defined next door
- `rule.always.scope-onetime-lessons-to-the-behavior` (bhrain/learner) — why `camp` is cited
  from `sandpine/infrastructure` rather than adopted into this repo
- `term=partial-audit._.choice._.md` — a read complete over the scope it chose still reads as
  a verdict about the world
- `rule.require.ubiqlang` (mechanic) — one canonical word per concept

---

written by human + beaver 🦫
