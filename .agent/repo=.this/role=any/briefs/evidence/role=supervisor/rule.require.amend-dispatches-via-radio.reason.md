# rule.require.amend-dispatches-via-radio — reason

the incident, the comparison, and the general form in full. the say-level rule is the reflex; this
is the record behind it.

## .the incident — 2026-08-24

a seed had just been filed to `rhachet-roles-bhrain` (#381). minutes later a broader cure was filed
to `rhachet-roles-rhachet` (#23), which **supersedes** #381's scope — so #381's recipient risked a
name convention that #23 would then have to reconcile.

the amendment was needed. the reach was for `gh issue comment`.

| attempt | outcome |
|---|---|
| 1 | ✋ blocked — not on the allowlist |
| 2 (retry, per the hook's own "retry it" line) | ✋ **blocked again** — the hook re-blocks, it does not prompt |

two attempts, naught gained. the human asked: *"why can't you use the radio to do this?"*

`rhx` is fully allowlisted. `radio.task.push --help` documents `--exid` and `--idem upsert` in its
own header block, and that header **boots at say-level every session**. the affordance was in
context the whole time and was never read.

## .the lesson beneath it — a block tells you where the road is

the retry was the real error, not the first attempt. the first attempt was an honest guess about
which tool owned the surface. the retry was a decision to push against a wall rather than ask what
the wall was for.

> a block signals that you reached past a paved path, far more often than it signals that no path
> exists.

the allowlist is not an arbitrary fence. it is a **map of the paved paths**, and a denial is that map
that points elsewhere. to read a denial as an obstacle rather than as a direction is to discard the
one piece of information it carries.

this is `rule.forbid.direct-tmux-duct-term` generalized. that rule names three surfaces (tmux, duct,
term) and one reflex; the reflex is what transfers, and it transfers to every surface the repo has
paved a skill over.

## .why an upsert BEATS a comment — it is not a workaround

this is what makes it a rule rather than a fallback. had `gh issue comment` been available, the
upsert would still have been the correct move:

| | a comment | a radio upsert |
|---|---|---|
| where it lands | below the fold, after the whole wish body | **at the top of the body**, first thing read |
| what a skimmer sees | the original task, unamended | the amendment, first |
| the local record | diverges — `src/stream/` no longer matches what was sent | **stays true** — edit the wish, upsert FROM it |
| a later round's read | must scroll the thread to find the scope change | reads the wish and has it |

measured on #381: the wish body runs ~200 lines. a comment would have sat beneath all of it.

### the scope-change argument

an amendment that changes **what a dispatchee should do** — *"this is narrower than you think"*,
*"the shape is decided elsewhere"*, *"do not settle a convention here"* — must be read **before** the
body, or it is read too late to change any decision.

a comment is the wrong instrument for a scope change, in the same sense that a footnote is the wrong
instrument for a retraction.

### the drift argument

an amendment typed straight into a github box exists in exactly one place, and it is not the place a
later round reads. `src/stream/$Q/$date.dispatch.*.wish.md` is the durable record of what was
dispatched; a comment leaves it stale the moment it posts.

the upsert-from-file discipline makes drift structurally impossible rather than merely discouraged.

## .the upsert hazard, and why the read-back is required

an upsert **replaces** the description. a partial upsert — a fragment sent instead of the whole file
— silently clobbers the rest, and:

> its success report is byte-identical to a complete one.

`🎙️ updated:` prints the same for a whole body and for a truncated one. that is a `false report` in
the making, and the only defense is a `gh issue view --json body` read-back against the local file.

this is `rule.require.verify-after-send` applied to a third surface — after a duct send, after an
Edit, and now after a radio upsert. the shape recurs because every write tool reports on **its own
act**, never on the **state it produced**.

## .the envelope

`radio.task.push` wraps the description in its own frame — a `🦫🎙️ dispatch to foreman` header, an
enqueued block, then `**title**` and `**description**` markers.

so pass **only** the description. the radio re-wraps on every push, and an upsert that included the
envelope would nest it.

## .see also

- `rule.require.amend-dispatches-via-radio.md` — the say-level rule this record backs
- `rule.forbid.direct-tmux-duct-term.md` — the same reflex, first paved on the duct surface
- `rule.require.verify-after-send.md` — the read-back discipline, and its other two surfaces
- `term=false-report._.choice._.md` — why a success report that cannot fail is worth naught

---

written by human + beaver 🦫
