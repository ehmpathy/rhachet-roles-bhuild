# rule.always.clamp-the-verbatim-pane-your-classifier-judged

> **every real-world pane your classifier judges in production becomes a VERBATIM regression
> fixture — captured byte-exact into a `.test/.assets/` log file, read via JS, asserted to
> classify right. a classification you did not clamp regresses unseen.**

`rule.always.clamp-the-production-defect-you-just-saw` clamps a pane the classifier got WRONG.
this clamps the panes it got RIGHT too — a correct verdict today is a regression risk
tomorrow, since the next detector refactor can silently break a form already proven, and no
one notices until that form idles a sponsored star for hours.

the surgoal names the mechanism: accrue a corpus of real-world stdout fixtures. this rule is
the reflex that grows it, one production pane at a time.

## .why — a classifier is only as trustworthy as its captured corpus

pane classifiers (`__duct_pane_is_husk`, `__duct_pane_cap_line`, `__duct_pane_has_ratelimit`,
the box classifier) each read a scrap of claude's own UI — spinners, todo lists, surveys, box
chrome, compaction banners, stale scrollback layered over the one line that tells the truth.
every real pane is a new arrangement of that noise.

- a detector proven on a hand-written fixture is proven on the author's imagination of the noise
- a detector proven on a captured fixture is proven on the noise the world actually produced
- ⇒ the captured corpus is the only test set that grows toward the real distribution

two live panes once classified correctly on a tick — a husk under a stale survey, a
date-qualified cap under a compacted conversation — and neither was in the corpus, so a future
detector edit could have broken either with zero signal.

## .the fixtures are LOG FILES, never hardcoded strings

| a hardcoded inline string | a captured `.test/.assets/` log |
|---|---|
| hand-typed → a tidied pane that never existed | byte-exact, piped straight from the read |
| trips the gerund/term write-hooks on real UI text | a `.log` asset the hooks leave alone |
| drifts as the author "cleans" it | frozen as the world produced it |
| buried in a `.ts` array, unreadable as an artifact | a real file a reviewer opens and diffs |

pipe the pane straight from the read command into the asset:

```sh
rhx git.crew.read --tree <t> --who <role> | rhx teesafe .agent/…/work/.test/.assets/pane.<slug>.log
```

then read it in the test, never retype it:

```ts
runClassifier({
  fn: '__duct_pane_is_husk',
  fixture: readFileSync(join(__dirname, '.test/.assets/pane.<slug>.log'), 'utf8'),
});
```

⚠️ capture the FLATTENED read (bare `crew.read`, not `--raw`) — the detectors consume
ansi-stripped text, so the flattened read is both the genuine log and the detector's true
input. a `--raw` capture carries ansi that breaks the anchors.

## .the move — five steps, when a tick judges a real pane

| # | step |
|---|---|
| 1 | pipe the pane from `crew.read` into `.test/.assets/pane.<slug>.log` via `teesafe` |
| 2 | name the slug for the noise-form it holds (`husk.below-stale-scrollback`, `cap.date-reset-under-compaction`) |
| 3 | add a `when` case whose fixture is `readFileSync(join(__dirname, '.test/.assets/…'))` |
| 4 | assert the verdict the tick relied on |
| 5 | prove it passes, and note what noise-form it adds that no prior fixture held |

## .the test

> is this exact pane form a captured asset in the corpus — and if a future detector edit broke
> it, would a test go red?

yes → corpus holds it, move on. no → capture it; a novel arrangement the corpus does not hold
is one edit from a silent regression.

## .the bound — novelty, not volume

clamp a pane that adds a new noise-form — a new banner layout, reset shape, stale overlay, or
chrome arrangement. do NOT re-capture a tenth pane identical in form to one already held. the
corpus grows toward coverage of the noise distribution, never toward a transcript of every
tick. the tell a pane is worth a fixture: "a detector that keys on X reads this wrong" — if you
can name that element, the form is novel enough to clamp.

## .enforcement

- a judged pane whose exact form is absent from the corpus, adds a novel noise-arrangement, and
  is left unclamped before the tick moves on = **blocker**
- a fixture hand-typed inline instead of a captured `.test/.assets/` log = **blocker**
- a `--raw` (ansi-laden) capture fed to a detector that consumes flattened text = **blocker**
- a clamp with no assertion of the verdict the tick relied on = **blocker**
- a re-capture of a noise-form already covered = **nitpick**

## .see also

- `surgoal.polish-the-supervisor-and-prioritizer-tools.md` — the surgoal whose mechanism is this corpus
- `rule.always.clamp-the-production-defect-you-just-saw.md` — the twin: clamp the panes it got WRONG
- `rule.require.clamp-edge-cases` (ehmpathy/mechanic) — the clamp-with-teeth this instances
- `define.invariant.crew.husk.discriminator-parity.md` — the husk truth the corpus guards
- `define.invariant.crew.ratelimit.healable-transient.md` — the cap/429 states the corpus guards
- `__duct_pane_is_husk` (work/ductwork.pane.sh), `__duct_pane_cap_line`, `__duct_pane_has_ratelimit`
  (work/ductwork.signal.sh) — the classifiers; `runClassifier` + `.test/.assets/*.log` in
  `ductwork.pane.integration.test.ts` and `ductwork.signal.integration.test.ts` hold the corpus

---

written by human + beaver 🦫
