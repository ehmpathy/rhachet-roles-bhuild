# rule.require.justify-a-feat-classification

## .what

> **`fix` is the default half of the branch convention. `feat` is a CLAIM — and a claim owes a
> reason, in the visible command, before the tree exists.**

a `beav/feat-*` name fails fast (exit 2) unless it carries `--feat-why '<the capability this
ADDS>'`. a `beav/fix-*` name passes silently and owes no reason. the toll is one-sided on
purpose.

## .why — the two mislabels do NOT cost the same

| the mislabel | what it does | repair cost |
|---|---|---|
| a fix called a feat | cuts a minor release for a speedup, writes a changelog line that names a capability nobody can use | a published version + changelog entry — history to rewrite or live with |
| a feat called a fix | under-sells one line in a changelog | one line |

a rule that charged both halves equally would tax the common, cheap, correct case to guard the
rare expensive one. so the gate fires on the side whose error is dear.

the mislabel is not caught downstream — the branch name rides into the worktree, duct slug,
tmux session, ledger row, eco store, pr, and release, and each instrument merely repeats the
first. the only cheap moment to catch it is before the sprout, which is where this gate sits.

## .the test — one question, about the ASK

> **does this add a capability a human can ASK FOR that did not exist before?**

- yes → a `feat`. name the capability in `--feat-why`, in one line
- no — it makes an extant capability work right (faster, correcter, safer, cheaper) → a `fix`

| the work | level |
|---|---|
| a speedup | fix |
| a defect repair | fix |
| a refactor, rename, dep upgrade | fix |
| a test added, a clamp landed | fix |
| an observability improvement over an extant path | fix |
| a new verb, flag, or surface a human can invoke | feat |
| a new state a tool can detect and report | feat |

"it was a lot of work" is not the test — effort measures cost; `feat` measures what a human
gains that they could not ask for yesterday. "it changes behavior" is not the test either —
every fix changes behavior; the question is whether the changed behavior is an ask that had no
answer before.

## .why the gate, not just a brief

`feat` reads as the weightier word, so a clone that judges its own work important reaches for
it, and every reach feels locally defensible — a judgment call this easy to misjudge needed a
gate, not only a brief (`philosophy.entoolment-is-the-pinnacle`).

## .the cure — where the gate lives

`__crew_guard_feat_level` in `.agent/repo=.this/role=any/skills/work/crewwork.sh`, called by all
three birth paths:

| verb | what it births |
|---|---|
| `git.tree.duct` | worktree + ducts, no clone |
| `git.tree.achievement` | + a clone on a goal |
| `git.tree.behavior` | + a bound behavior |

all three, deliberately — a gate on two of three paths leaves a door beside it. `behavior` and
`achievement` each forward `--feat-why` down to `duct`, so the question is asked once and
answered once. the error prints the test, the six `fix` examples, and two runnable commands
(the renamed branch, or the same branch with a `--feat-why`) — the caller picks, never guesses.

## .the cues

| when… | then… |
|---|---|
| about to type `--name beav/feat-…` | 🔴 run the test out loud: what can a human ask for now that they could not yesterday? |
| cannot answer in one line | it is a `fix`. rename it |
| answer is "it works better" / "it is faster" | 🔴 that is a `fix`, said in a feat's voice |
| work is large, test says `fix` | the test wins — size is not the axis |
| gate fires, you reach for a plausible `--feat-why` | 🔴 the sharpest cue — an invented reason is the gate at work |
| you write a real `--feat-why` | good — it rides into the boot render, vetoable before the tree exists |
| branch follows no convention (`bert/upgrade-cache`) | not gated, correctly — the gate reads the `feat-` prefix, never intent |
| you would author a commit header `feat(scope):` | same test, one layer down — foreign to this gate |

## ⚠️ .the bound — this gates a WORD, never a judgment

the gate cannot tell a true `feat` from a false one. it fires on the literal `feat-` prefix
after the last `/`; a non-convention name is untouched. `--feat-why` is never validated for
content — a bad reason still gets a tree, but a human who reads the boot render gets a chance
to object. a `--feat-why` satisfies the TOOL, never a human — same as `--size-why`
(`rule.require.confirm-behavior-size-above-nano`). the gate buys one deliberate, vetoable
moment at the cheapest point on the chain.

## .enforcement

- a `feat-` branch sprouted with no `--feat-why` = **blocked by construction** (exit 2, all
  three verbs)
- a `--feat-why` invented to clear the gate where the test says `fix` = **blocker**
- a speedup, refactor, rename, dep upgrade, or test addition named `feat` = **blocker**
- a new birth path with no `__crew_guard_feat_level` call = **blocker**
- a genuine capability named `fix` = **nitpick** (under-sells one line; the cheap half)
- a non-convention branch name left ungated = **false positive**

## .see also

- `rule.require.confirm-behavior-size-above-nano.md` — the paired toll: `--size-why` prices
  the ROUTE, `--feat-why` prices the CLAIM
- `rule.require.exit-code-semantics` (ehmpathy/mechanic) — why exit 2, never 1
- `rule.require.errors-name-the-fix` (ehmpathy/ergonomist) — why the message prints runnable
  commands rather than a verdict
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — `[case30]` clamps the gate behaviorally
- `rule.always.clamp-the-production-defect-you-just-saw.md` — the reflex this round performed
- `philosophy.entoolment-is-the-pinnacle` (bhrain/learner) — why a cheap-to-misjudge call earns
  a mechanism, not only a brief

---

written by human + beaver 🦫
