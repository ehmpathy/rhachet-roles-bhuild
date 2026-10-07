# domain.term.choice.reason: crew.status

## .etymology

the word arrived from the human, mid-tick, as a proposal rather than a coinage:

> *"blocked:on-human | blocked:on-defect | inflight | frozen ; we probably only need 4?"*

so `status` was never argued for — the **value set** was, and the noun came along with it. what
this file settles is the boundary against `crew.state`, and the two values the proposal did not
carry.

### what it beat

- **`health`** — the closest miss, and it fails on the row that matters most: a `frozen` crew is
  often perfectly healthy. health grades the crew; status grades the **queue**
- **`condition`** / **`disposition`** — both read as properties of the crew. the whole content
  here is a property of the *supervisor's obligation to it*
- **`phase`** — asserts an ordered progression. these six do not order; a crew moves between them
  in any direction
- **`verdict`** — already taken, one layer down, for a box classification

⇒ **`state` is the one it must be parted from rather than beat**, because both words are correct
and they name different questions (see the say file's first table). the code already carries
`crew_state`, so a merge would have been an overload rather than a synonym — the sharper of the
two hazards (`rule.forbid.domain-term-ambiguity`).

## .the enumeration that licensed it

per `rule.require.enumerate-before-you-name`, the states were listed before the set was graded.
the human proposed four; the list showed six, and the two additions are the two that carry the
most cost when merged:

| the crew is… | the proposed four | the honest value |
|---|---|---|
| mid-turn, moves | `inflight` | ✅ `inflight` |
| a lane in review | `inflight` | ✅ `inflight` |
| at a permission modal | `blocked:on-human`? | 🔴 **`blocked:on-supervisor`** |
| at `judge, approved? 👋` | `blocked:on-human` | ✅ `blocked:on-human` |
| route complete, needs quota + release | `blocked:on-human` | ✅ `blocked:on-human` |
| at `blocked ✋`, the driver's | `blocked:on-defect` | ✅ `blocked:on-defect` |
| at `exhausted 👋` | `blocked:on-human`? | 🔴 **`blocked:on-defect`** |
| a husk, an orphan, a drift | `frozen` | ✅ `frozen` |
| on an unreached grove | `frozen`? | 🔴 **`unread`** |

**n=9, and three rows break the proposed four.** every one of the three breaks in the same
direction — **work owned by the supervisor, misfiled to the human** — which is the failure the
whole enum exists to prevent.

## 🔴 .the measured cost of the merges

### the modal, merged into `blocked:on-human`

**2026-09-04**, babysit ticks 41–43. `fix-contemplation-gate-on-entrance/mechanic` raised three
permission modals — two yield edits and one `.taken` creation. each was answered in one keystroke
by the supervisor, inside ten minutes.

⇒ folded into `blocked:on-human`, all three land in the human's queue, where they wait on a
person who was never needed. and the tree was mid-drive: each unanswered modal freezes the whole
route behind it.

### `exhausted`, merged into `blocked:on-human` — this one actually happened

the same tick, the same tree, one stone later: `l3@i003, exhausted 👋`.

**the first render of this enum classified it `blocked:on-human` and put it in the human queue.**
the derivation keyed on `👋`, and `👋` is a glyph shared by a human gate and a driver lever. the
error survived exactly one poll, because the row sat beside four genuine `approved? 👋` rows and
looked like them.

🔴 **that is the whole argument for the word over the glyph**, and it is not hypothetical — the
misread was committed, rendered, and read before it was caught.

⚠️ **the repo already carried a rule for this exact mistake**
(`rule.always.spend-own-levers-before-escalation`, whose own text names budget-vs-approval as
*"the trap of adjacency"*). it did not fire, because a rule fires on a reader and the reader was
a `case` statement. ⇒ **an enum is where a rule of judgment becomes a rule of construction, and
that is the strongest reason to have one.**

## 🔴 .the second glyph collision of the week

`👋` marks two rows with different owners:

| the row | the claim | who clears it |
|---|---|---|
| `judge, approved? 👋` | a human must grant | **a human** |
| `l3@iNNN, exhausted 👋` | a budget is spent | **the driver** |

this is the same defect `term=duct.box.quiet` records for `😴` — one glyph, two concepts — found
four days apart on the same instrument. two instances now, on one surface.

⚠️ per `im_an.obsessive_learner.for.domain.glyphs`, a glyph spreads faster than a word and each
surface makes the repair dearer, so the repair must come from the palette rather than a grep. it
is owed and it is **not** done here.

⇒ and the pair suggests a pattern worth a name later: **a glyph chosen for the SHAPE of a halt
rather than its OWNER.** `👋` says *"someone is hailed"*; it does not say who. one more instance
from a different surface and it earns a term (`rule.require.enumerate-before-you-name` — two
from one instrument is thin).

## .what is owed

| owed | to |
|---|---|
| 🔴 a glyph split — `👋` left to the human gate, another for `exhausted` | `git.crew.poll.sh` + the palette |
| the `frozen` blind spot below | `git.crew.poll.sh` |
| a clamp per status arm, and one that proves `exhausted` never reads human | `work/work.surface.poll.integration.test.ts` |

## ⚠️ .the OPEN defect — `frozen` can conceal a human gate

`rhachet.beav.fix-node-pty-install` renders `frozen` and is in truth blocked on a human's AWS SSO
unlock. its plea lives in the **pane**, never in the stone, so the derivation cannot see it.

⇒ `frozen` is therefore not yet *"nobody waits on it"* — it is *"no instrument we consulted says
anybody waits on it."* the honest repair joins the `🙋 PLEA SEEN` signal into the derivation,
which the poll already computes for its footer and does not yet feed back into the row.

that is the same shape as the husk beneath a plea (`term=duct.pane.husk`): the datum was
measured, and the verdict that needed it never received it.

## 🔴 .the same defect, a third time — and the quantifier was the bug

`frozen` absorbed a human-gated crew twice more after the fixes above, and each cure was too
narrow by exactly one step:

| tick | the cure | what it still missed |
|---|---|---|
| 1 | — | a crew whose every box read `❔unread` fell to `frozen` |
| 2 | `__all_unread` | a crew with **one** unread box, on the stone-bearer |
| 3 | `__any_unread` | (holds) |

**the measured case.** `sdk-aws-lambda.beav.feat-absorb-handler-invoke-test-util` was read live
and verified **correctly parked** at `1.vision, judge, approved? 👋` — both lanes terminal at
i013, 0 blockers, 0 nitpicks, every driver lever spent. one poll later it rendered
`🧊 frozen · still 408m` off a **byte-identical pane**.

⇒ the mechanism: **a stone is carried by ONE role, and a box is read per role.** its foreman box
classified, its mechanic box did not — so `__all_unread` was false, the stone rendered nowhere,
and the crew fell past every stone arm to `frozen`.

### ⚠️ why `all` felt like the cautious choice and was the narrow one

`all` fires only when the **whole** crew went dark — which is precisely the case a supervisor
would already suspect. the case it misses is the one that looks healthy: a partial read, where
the half that answered reassures you about the half that did not.

> the honest condition is not *"we read no box."* it is **"we may have missed the box that
> decides."**

⇒ and that generalizes past this arm. **when a fail-safe takes a quantifier, `any` is almost
always the correct one** — a fail-safe exists to fire on doubt, and `all` demands unanimity
before it will admit doubt at all.

## 🔴 .the FOURTH defect — the enum's own failure, in reverse

every defect above is the enum too eager to file work as the **human's**. this one goes the other
way, and it was invisible for exactly that reason: the guard rail was built to face one direction.

**the derivation assumes `blocked ✋` ⟹ the driver owns it** (row 6 of the enumeration table). that
assumption is false, and it has n=2:

| tree | repo | stone | the ONLY lever |
|---|---|---|---|
| `fix-keyrack-all-skips-manifest` | `rhachet` | `5.3.verification`, l3@i006, `blocked ✋` | `--as overruled` — **the human's** |
| `feat-tempdir-autoprune` | `test-fns` | `5.3.verification`, l3@i030, `blocked ✋` | `--as overruled` — **the human's** |

both reached a terminus of **`constraint` lanes** — a reviewer that **refused** on its own
precondition, never one that broke and never one that spent its budget. a driver at that terminus
marks the stone `blocked ✋` because that is the only marker it has, and the enum then reads the
marker rather than the cause.

### 🔴 why this one has TEETH the others did not

a misfile toward the human costs a wait. **this one costs a WRONG ACT**, because the babysit
protocol prescribes a move per arm, and the move for this arm is a lever that cannot work:

> `✋ blocked (the driver's — ask "why can't you get lN to agree with you?", top up budget)`

⇒ **more budget cannot cure a refusal.** `route.guard.budget --add N` extends a reviewer that
*exhausted*; a reviewer that declined its own precondition will decline again at any budget at
all. a supervisor who follows the arm faithfully spends a real lever, changes naught, and reports
motion where there was none.

⚠️ **and it compounds with `CLONE QUIET`.** that footer suppresses on `blocked:on-human` (paved
this same day) and therefore fires on these two — it flags a clone whose stillness is *entirely*
explained, and points a supervisor at the one arm whose prescribed move is wrong. two instruments,
mis-aligned on the same misfile.

### .the cure, and why it is not a new enum value

`blocked:on-human` already names this state correctly. what is absent is not a **word** but a
**read**: the derivation keys on the stone MARKER (`blocked ✋`) where it should key on the
**terminal verdict** beneath it.

| the lane terminus | who owns it |
|---|---|
| `exhausted` | the **driver** — `route.guard.budget --add N` |
| `malfunction` | the **driver** — diagnose, then fix-or-name-the-fix |
| 🔴 `constraint` | the **human** — `--as overruled`. no driver lever exists |

⇒ so: **a stone at `blocked ✋` whose lanes are terminal on `constraint` reads
`blocked:on-human`, never `blocked:on-defect`.**

⚠️ this is the same root as the bhrain glossary gap caught the same day
(`.dream/2026_09_04.reseed-bhrain-terminal-verdict-members.dream.md`): `constraint` is an
unitemized member of a closed set of four, so **every** instrument that reads that set treats it
as whatever its nearest named neighbour is. the glossary gap and this derivation defect are one
cause with two faces.

## .the OPEN question

**does `blocked:on-supervisor` want a duration?** a modal answered inside a tick costs naught; one
that sits four hours has frozen a whole route behind it, and the two render identically today.
the answer turns on data not yet held: how long a modal typically waits across a full session.

---

written by human + beaver 🦫
