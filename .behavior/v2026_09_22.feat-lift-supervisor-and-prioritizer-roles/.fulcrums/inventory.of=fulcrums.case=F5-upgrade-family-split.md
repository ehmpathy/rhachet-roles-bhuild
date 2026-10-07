# F5 — the four-file upgrade family: supervision or mechanic

| | |
|---|---|
| **rework** | clean |
| **status** | best-guessed |
| **confidence** | 75% |
| **where** | handoff §5 |

## .the fork, stated fairly

§5 lists ~20 nheuron-bound briefs that must **not** lift, then flags four as undecided:

```
howto.upgrade-best-practices.md
howto.upgrade.scope=node-package.md
howto.declapract-upgrade-libraries.md
howto.dispatch-dependency-upgrades.md
```

the handoff's own words: *"the dispatch half is supervision; the package-upgrade half is mechanic
material."* it names the test but does not apply it.

## .taken, and why at the time

apply the test §5 names — `define.work-primitive-hierarchy`: **does its description need a tree, a
crew, or a pr?**

| brief | needs | verdict |
|---|---|---|
| `howto.dispatch-dependency-upgrades.md` | a **tree** — it is how a supervisor dispatches the work | 🦫 **lifts** |
| `howto.upgrade-best-practices.md` | a **pr** | ⛔ mechanic material — does not lift here |
| `howto.upgrade.scope=node-package.md` | a **pr** | ⛔ mechanic material — does not lift here |
| `howto.declapract-upgrade-libraries.md` | a **pr** | ⛔ mechanic material — does not lift here |

⚠️ **the one that must lift is `howto.dispatch-dependency-upgrades.md`**, and not by taste: sprout
rung 3's `declapract` refusal **cites it by name** as the brief that argues the gate (`case=1`
`[t9]`, handoff §2.4's gate table). to leave it behind ships the refusal without its argument and
mints a phantom path (`case=5`).

🟡 the three mechanic-side briefs are **not** this PR's to place. they are nheuron-bound today; a
later behavior may lift them into `rhachet-roles-ehmpathy`. that is a seed, not scope.

## .rework, and why it is clean

four markdown files. to move one later is a `git mv` plus a citation fix — and the citation audit
of `case=5` already runs over this set.

## .confidence, and why it is 75%

the test is the handoff's own and `dispatch-dependency-upgrades` is pinned by a live citation, so
that row is near-certain. the 25% sits on the other three: "needs a pr" is my read of briefs i
have **not** opened. i verified the citation, not the content.

⇒ cheap to check at blueprint: open the three and confirm none is cited by a supervisor artifact.

## .the verdict, once ruled

🔴 **REVERSED — all four lift. the 75% guess was wrong, exactly where its own 25% doubt sat.**

ruled 2026-09-25, and **raised by a peer reviewer rather than by me** (`r10`
`enroll-impl-behavior-intent`, round i001). its blocker was correct on the process: four files
shipped where this record ruled one, and this field read `_(unset)_` — *"a silent reversal, not a
recorded decision."* that is `rule.always.itemize-the-fulcrums-you-best-guess`'s own blocker, and it
is the defect, never the file count.

### the check this record prescribed, finally run

the 25% was booked against a named remedy: *"cheap to check at blueprint: open the three and confirm
none is cited by a supervisor artifact."* run at last, it returns the opposite:

| citation | what it proves |
|---|---|
| `howto.dispatch-dependency-upgrades.md:101` → *"`howto.upgrade-best-practices.md` — **the supervisor entry point**"* | 🔴 the ONE brief this record pinned as must-lift names another of the three as its own entry point |
| `briefs/domain.terms/term=steer._.choice.reason.md:134` | a supervisor **term cluster** leans on it too — a second, independent citer |
| `howto.upgrade-best-practices.md:142-143` → the other two | the three are one cluster; they cite each other |

⇒ **to leave the three behind would have minted the exact phantom path this record warned about one
paragraph earlier** — from `dispatch-dependency-upgrades.md:101`, the brief it pinned. `case=5`'s
bidirectional citation audit would have gone red on it.

### why the guess failed — and it is not that the test was wrong

the test (*"does it need a tree, a crew, or a pr?"*) is sound, and the three genuinely describe
**pr**-grain work. the error was to treat **subject grain** as **home**: a supervisor brief may
describe pr-grain work when a supervisor is the one who dispatches it. the record even names its own
blind spot — *"'needs a pr' is my read of briefs i have **not** opened. i verified the citation, not
the content."*

⇒ 🔴 the transferable part: **a fulcrum that books its doubt against a named check is only as good as
whether anyone runs the check.** this one named it, priced it *"cheap"*, and it went unrun through
execution and eight self-reviews — until a peer asked why the field was empty.

### the seed left behind

the three stay **supervisor-homed** for now. whether they later belong in
`rhachet-roles-ehmpathy:role=mechanic` is a live question, and it is a **behavior of its own** — the
cluster would have to move with the two supervisor citations above, which is a cross-package edge
this PR does not open.

---

written by human + beaver 🦫
