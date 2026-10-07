# rule.always.entool-the-layer-you-drop-below

## .what

a supervisor operates at the **grove and crew** layer. every drill-in and every steer goes
through a **crew verb**, addressed by TREE and ROLE. a `duct.*` or `term.*` call is substrate,
and a supervisor does not type one.

### 🔴 the substitution table — this IS the rule

| ⛔ never type | ✅ always type |
|---|---|
| `rhx duct.read --on 'duct://<host>/<tree>/<role>'` | `rhx git.crew.read --tree <tree> --who <role>` |
| `rhx duct.send --on 'duct://<host>/<tree>/<role>'` | `rhx git.crew.send --tree <tree> --who <role>` |
| `rhx duct.poll` | `rhx git.crew.poll` |
| `rhx duct.list` | `rhx git.crew.list` |
| `rhx duct.open` · `rhx duct.stop` | `rhx git.crew.boot` · `rhx git.crew.stop` |
| `rhx duct.refresh --on '…'` | `rhx git.crew.refresh --tree <tree>` |
| `rhx duct.reboot --on '…'` | `rhx git.crew.reboot --tree <tree> --who <role>` |
| `rhx term.open` | `rhx git.crew.show` · `rhx git.crew.hide` |
| `tmux …` · `ssh <grove> …` · any hand-typed host | a crew verb — it derives the box for you |
| 🔴 `crew.read` → count the options → `crew.send --keys N` → `crew.read` | `rhx git.crew.modal --tree <tree> --who <role> --answer approve\|decline` |

🔴 **the last row is a different KIND, and it is the one that gets missed.** every other row is
a layer drop — a `duct.*` call where a crew verb exists. that row names a byhand cycle built
entirely from crew verbs, each correct alone, the SEQUENCE the defect
(`rule.always.entool-the-permission-modal-cycle`: the third hand-run in one session grades a
blocker). a supervisor who audits for "did I type a duct uri?" passes clean and has still run
the braid. `crew.modal` derives the key rather than count it by hand — `2` reads `No` on a
two-option modal and "yes, don't ask again" on a three-option one, and only a count tells
which. it never picks approve-vs-decline; that judgment stays yours.

🔴 **the three duct-replacement verbs are strictly ordered by WHAT DIES:**

| the crew verb | replaces | survives |
|---|---|---|
| `git.crew.refresh` | the **view** — a repaint; cannot signal a process | the program, the duct |
| `git.crew.reboot` | the **program** | the duct, its name, its cwd — never the conversation |
| `git.crew.stop` | the **duct** | the worktree only |

⚠️ `reboot` takes `--who` and refuses `--who all` — the two roles are never wedged at the same
moment, so a broadcast kills a healthy clone to cure a stuck one. `refresh` defaults to `all`
because a repaint carries no payload.

where the table names no crew verb for what you need, that absence is a GAP in the crew layer,
closed in the same round:

> **add the crew-layer verb. then use it.**

⚠️ a row absent from this table is where the gap hides — a verb that exists but is undocumented
here reads, to its only reader, as gone. when you add a crew verb, add its row the same round.

⚠️ the one carve-out: `rhx term.audit` stays — `rule.always.read-both-crew-halves` requires it
by name as the view half, and `crew.show`/`crew.hide` act on tabs, they do not audit them. its
localhost-only blind spot must be named out loud on every use. do not read this as a template —
it holds because a peer rule names the tool by name; "I could not find a crew verb" is a gap to
close, never a second carve-out.

## .why

`rule.require.speak-at-the-supervisor-layer` governs SPEECH. it had no verb behind it, so every
drill-in, steer, and modal answer dropped a layer and hand-built a uri — a supervisor that
speaks in crews and acts in ducts has not adopted the layer, only the vocabulary.

a hand-built duct uri re-derives three facts the crew layer already holds — the host (the
ledger row the crew wrote at boot), the tmux name form, and the uri shape — and each is a
chance to differ from the record. the failure mode is a TRUTHFUL answer about the WRONG box,
with no error and no tell, which is why a crew verb must derive its grove from the ledger
rather than default to `local`.

## .the test

before any call, read what you are about to type:

> am I about to type a duct uri, a tmux session name, or a host?

yes → 🔴 stop, the crew layer is short a verb; add it, then call it. no → right layer. the
three tokens are the tell — a crew-layer call names a tree and a role, never a machine.

## 🔴 .a BROKEN crew verb is a defect to REPAIR — never a license to drop

a closed road sends the traveler back onto the desire path, where the old call still works —
and the block then gets narrated upward as someone else's, which makes it permanent.

| the crew verb… | you |
|---|---|
| errors, and the repair is yours | repair it first, then run the task through it |
| errors, and you *believe* the repair is a human's | 🔴 try it. a believed gate is not a gate (`rule.require.trust-but-verify`) |
| errors on a gate a human truly owns | surface the exact command and stop — do not re-route through `duct.*` |
| does not exist yet | write it — this rule's main clause |

"the paved path is broken, so I took the old one" is the braided trail, said out loud. mend
the tread (`philosophy.pavement-saves-nature`).

## .what the new verb owes

1. derive the grove from the ledger, never default to `local` (`__crew_ledger_grove_of`)
2. fall back to local only where the ledger holds no row, and say which it chose
3. address a tree and a role, never a host
4. refuse what is unsafe at the crew grain — `crew.send --who all` exits 2 on purpose: a
   keystroke sent to a whole crew answers whatever modal each clone happens to hold, and the
   two are never at the same prompt. the crew grain is the right place to encode that refusal

## ⚠️ .when a drop IS legitimate

| case | why it holds |
|---|---|
| while you entool it | you cannot write `crew.read` without a `duct.read` inside it |
| the substrate IS the subject | "`duct.read --lines` trims the wrong end" is a claim about ductwork |
| mid-diagnosis, out loud | the VERDICT still gets a crew-layer sentence |

what unites all three: the duct is the SUBJECT, never the ROUTE. a drop taken as a route is
the violation. the trigger for a new verb is never "this is impossible" — it is "I dropped a
layer to do this", available on the first drop. a gap a workaround covers is invisible by
construction.

## .enforcement

- 🔴 a `duct.*` or `term.*` call typed by a supervisor, where the substitution table names a
  crew verb = **blocker** — no grace, no first-one-free
- a crew verb that errors, worked around by the very `duct.*` call it replaced = **blocker**;
  a repair relayed upward as a human gate with no attempt = **blocker**
- a repeat drop to the duct/term layer, where a crew verb could exist and was not added =
  **blocker**; a FIRST drop, closed the same round by a new crew verb = ✅ correct
- a crew verb that defaults its grove to `local` instead of the ledger = **blocker**; one that
  does not say which box it chose = **nitpick**
- a drop where the substrate is genuinely the subject = **false positive**

## .see also

- `rule.require.speak-at-the-supervisor-layer.md` — the SPEECH half. this is the OPERATION half
- `rule.always.read-both-crew-halves.md` — why `term.audit` is carved out above
- `rule.always.entool-the-skills-you-touch` (bhrain/learner) — the general form
- `rule.require.bulk-over-byhand.md` — the adjacent failure: a loop, where a flag was owed
- `define.work-primitive-hierarchy.md` · `term=crew._.choice._.md` — the split, and the axes
- `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/rule.always.entool-the-layer-you-drop-below.reason.md`
  — the evidence: three instruments, one wrong box (source repo, unpublished)

---

written by human + beaver 🦫
