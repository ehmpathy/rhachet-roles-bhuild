# F21 — the level-1 review brain, and the focus it forces

| field | value |
|---|---|
| **where** | `5.3.verification.guard`, peer level 1, all nine lanes |
| **rework** | **clean** — two flags per lane, each removable in one edit |
| **status** | best-guessed at `5.3.verification`, **unruled** |
| **confidence** | **75%** |

## .the fork, stated fairly

the nine level-1 lanes were authored with no `--brain` and no `--focus`, so they took the defaults:
`fireworks/deepseek/v4-flash` and `--focus push`. at this stone's corpus size, that pair **cannot
run at all**. the fork is which of two properties to give up.

| option | keeps | gives up |
|---|---|---|
| **A** — `--focus push`, narrow the bind until it fits | the authored brain, and the tier's "cheap" intent | **the corpus.** the reviewer stops short of the code its rubric grades |
| **B** — `--focus pull` + a `claude/code/*` repl brain **(taken)** | the corpus, whole, every lane | the authored brain, the "cheap" tier intent, and the single-turn shape the reviewer's own lesson prefers |

## .why B, at the time

### the corpus cannot be narrowed into the window

all nine lanes overflowed. the decisive row is `mech-test-scope-purity` (r009), which carries the
**tightest** bind on the stone:

```
bind:   '{src,blackbox}/**/*.test.ts'
joined: 61 of 651 files
tokens: 1048.9k   ← against a 1048576 window
ratio:  100.9%
```

the token breakdown says why there is no cut to make:

```
src/ (1.0M, 96.9%)
└─ domain.roles/ (1.0M, 96.7%)
   ├─ supervisor/skills/work/ (661.7k, 62.8%)  ← 23 integration tests, 16k–47k each
   └─ prioritizer/skills/work/ (176.3k, 16.7%)
```

⇒ it is **1.0M tokens of real integration tests, with no incidental record to strip.** every file
is one the scope-purity rubric exists to grade. option A does not shrink noise; it deletes subject
matter, and it is the driver — the party under review — who would pick which tests the reviewer no
longer reads. that is the defect `rule.forbid.hand-run-reviews` names, reached by a legal route.

### `--focus pull` forces the brain

```
✋ BadRequestError: focus 'pull' requires a brain with tool use (BrainRepl).
   brain 'fireworks/deepseek/v4-flash' is a BrainAtom without tool use.
```

and the repl set is a closed one. from the installed packages:

| package | repls |
|---|---|
| `rhachet-brains-fireworksai` | none — `dist/domain.operations/atom/` only |
| `rhachet-brains-xai` | none — `dist/domain.operations/atom/` only |
| `rhachet-brains-anthropic` | **all of them** — every repl slug is a `claude/code/*` |

the resolver later printed the exposed set, and it is exactly four:

```
repls: anthropic/claude/code
       anthropic/claude/code/haiku
       anthropic/claude/code/sonnet
       anthropic/claude/code/opus
```

⚠️ **I first wrote "8 slugs" here, from `CONFIG_BY_REPL_SLUG`'s internal map.** that map holds 8
keys (several are version-pinned aliases); the registry exposes 4. corrected against the resolver's
own output rather than left as a source-read guess — and the same read cost me a round: I passed
the vendor-local `claude/code/sonnet` where the resolver wants the qualified
`anthropic/claude/code/sonnet`.

⇒ **`--focus pull` implies one of those four.** there is no third option, so the two flags are one
decision, not two.

`anthropic/claude/code/sonnet` is the pick because the reviewer's own
`lesson.brain-selection-for-review` grades `claude/sonnet` **✓ pass**, one of only two brains it
recommends. `…/haiku` (cheaper, matches the "cheap tier" label) and `…/opus` (deeper) are the two
one-word alternatives.

## 🔴 .the argument AGAINST it — recorded, because it is real

`lesson.performance-singleturn-vs-multiturn` closes with an explicit implication:

> *"the review skill is a **single-turn structured task** — rules and targets fully specified
> upfront, no back-and-forth needed. this is optimal — keep it single-turn."*

`--focus pull` makes it agentic and multi-turn. **that is a stated preference of this repo's own
reviewer briefs, and B trades it away.**

the mitigation is in the same brief, which is why confidence is 75% rather than lower:

> *"why agentic tool-use succeeds: each turn has structured purpose, tool outputs provide ground
> truth, errors surface explicitly."*

⇒ the brief's warn is about **conversational** multi-turn (underspecified, where assumptions
compound). a pull-focus review is the agentic kind it exempts. but the brief did not anticipate
this case, and I am the party who benefits from the generous read — so it is the wisher's to rule,
not mine.

### the two lesser costs, named

- **tier intent.** level 1 is labeled *"cheap reviewers (run first, in parallel)"*. nine sonnet
  repl lanes over a 1M-token corpus are not cheap. the defense is thin but real: a lane that
  cannot run is not cheaper, it is worthless.
- **reviewer diversity.** the stone now reads with one vendor's brain at level 1 and (via
  `rhx enroll claude`) the same vendor at level 3. the authored design mixed fireworks and
  anthropic. that diversity is lost.

## ⚠️ .what this fulcrum is NOT

- **not the level-3 blocker.** lanes r10–r12 die on `OAuth session expired`, via the claude **CLI**
  and its credential symlink to `/home/camper/.claude/.credentials.json`. that is human-owned and
  untouched by this fork.
- 🔴 **and not the same auth path.** I first read the two as one wall and was wrong. a
  `--brain claude/code/*` review runs through `@anthropic-ai/claude-agent-sdk` (installed, 0.1.76)
  on `ANTHROPIC_API_KEY` — **unlocked, 518m left**. the CLI runs on OAuth. two paths, one vendor.
  the check that separated them is what turned this from a halt into a repair I could make.
- **not a bind change.** every lane keeps its exact rules, refs, `--paths-with`, and `--join`. the
  corpus each reviewer reads is unchanged — 554, 67, or 61 files, precisely as authored.

## .how to overturn it

one edit per lane, and the rework is clean:

```diff
- --join intersect --focus pull --brain anthropic/claude/code/sonnet --conversation …
+ --join intersect --conversation …
```

that restores the authored defaults exactly. the wisher may also prefer a different repl —
`anthropic/claude/code/haiku` for the cheap tier, or `…/opus` for depth — which is a one-word change.

⇒ if the wisher rules for **A** instead, the follow-on question is theirs too: *which* files the
level-1 reviewers may stop short of. I did not answer that one, deliberately.

## .the verdict

**unruled.**

## .see also

- `rule.always.itemize-the-fulcrums-you-best-guess` — the record this satisfies
- `rule.always.defer-fulcrums-to-last` — why a clean rework was best-guessed rather than halted on
- `rule.forbid.hand-run-reviews` — why option A's file choice is the defect it names
- `lesson.brain-selection-for-review` / `lesson.performance-singleturn-vs-multiturn` (reviewer)
- `…r009._.taken.by_self.mech-test-scope-purity.md` — the decisive 100.9% measurement
