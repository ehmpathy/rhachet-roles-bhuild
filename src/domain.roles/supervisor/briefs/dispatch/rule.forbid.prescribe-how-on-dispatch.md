# rule.forbid.prescribe-how-on-dispatch

## .what

when you dispatch — a sprout (tree) or a seed (radio task) — you prescribe WHAT and WHY,
never HOW. a hard rule, not a preference.

you may hand over references, prior art, verified facts, a grounded search — a headstart. you
may not hand over the solution, file layout, signature, step sequence, or the shape you
picture. the HOW is the dispatchee's call.

## .why

your perspective is narrower than theirs, and you cannot tell. you author from outside the
repo; the dispatchee reads from inside, the whole codebase in view. any HOW you picture is a
guess made with less information than the party who acts on it — and a prescribed HOW anchors
them: a dispatchee who reads your sketch optimizes to match it instead of the outcome, so a
bad guess gets built rather than discarded, and a better in-repo solution never gets searched
for (`rule.require.wish-outcome-over-proposal` names both failures from the mechanic's side;
this is the dispatcher's).

responsibility must sit with the party who can discharge it. hand a dispatchee the design and
it can only own faithful transcription. hand over the outcome and the responsibility travels
with it. a wrong HOW gets followed off a cliff invisible from outside — it narrows their
search to your field of view exactly when their wider view is the asset you dispatched for.

## .the line

| MAY hand over | MAY NOT hand over |
|---|---|
| the outcome (`.what`) | a proposed implementation |
| the motivation (`.why`) | a function/type signature |
| acceptance — what proves it done | a file layout or directory plan |
| verified facts, with citations | a step-by-step sequence |
| pointers to prior art | a storage/schema choice |
| a grounded search — where to look | a named library or approach |
| constraints that genuinely bind | a code snippet to copy |
| scope bounds — what is OUT | "first do X, then Y" |

the test: if the dispatchee delivers the acceptance criteria with a shape you did not
imagine, are you satisfied? yes → it was a HOW, leave it out. no → it is part of the outcome
— move it into acceptance and say plainly why it binds. a real external contract a consumer
depends on is an outcome; "I think a map would be cleaner here" is a how, every time.

## .the headstart is encouraged — it is not a HOW

- **verified facts** — "`X` already exists at `<path>`, with `email` as its unique key"
- **prior art** — "`<path>` declares the peer account; nearest precedent"
- **honest absences** — "I searched for X and could not find it; treat as unexplored"
- **live-state observations** — evidence from the world

a fact EXPANDS what they consider; a prescription NARROWS it. cite what is true, point where
to look, then get out of the way.

## .say it out loud in the dispatch

> **.the HOW is yours — advisory only**
>
> per `rule.require.wish-outcome-over-proposal`, `.what` / `.why` / `.acceptance` are
> authoritative; all else below is ground, not instruction. settle the shape in-repo.

a blanket disclaimer is easy to skim past — a concrete patch, signature, or flag set still
reads as a spec regardless of a header. wherever the dispatch shows a real shape, name it and
say what kind it is:

| kind | means | the dispatchee may |
|---|---|---|
| evidence | the author ran it; it worked | trust the outcome is REACHABLE; never transcribe |
| proposal | a reasonable guess from outside the repo | keep the property that serves the outcome; the words are theirs |
| demonstration | a sample of a standard some rule already sets | meet the standard; never copy the string |

close with the permission, stated as a success: "if you deliver the acceptance criteria with
a shape the issue did not imagine, that is a success, not a deviation — say why in your
yield." "you may diverge" reads as optional risk, which a reviewed dispatchee will not take;
"that is a success" re-prices it.

## .examples

### 👎 bad — a prescribed HOW in a wish's clothes

```
## .what
add a `--scope` flag. parse it with a regex, store the parsed org on
`KeyrackKeyAsk.scope`, then thread it into `getOneGrant` as a third argument.
create `asKeyrackScope.ts` under `src/domain.operations/keyrack/casts/`.
```

every noun here is a guess from outside. the mechanic builds exactly this and never discovers
the repo already threads scope through a context object.

### 👍 good — outcome, motivation, ground

```
## .what
`keyrack unlock --scope github://org=$org` yields a credential valid for `$org`, run from
within a repo whose manifest declares a DIFFERENT org.

## .why
one github app, installed in several orgs, must reach ALL of them — the caller's choice, per
call.

## .what was already verified in-repo
`KeyrackKeyGrant.ts` ALREADY carries `org` as a first-class grant field.

## .the HOW is yours — advisory only
does `--scope` reuse the slug's org segment, extend `KeyrackKeyAsk`, or sit on its own axis?
settle in-repo.
```

## .the one exception

a constraint that genuinely binds is not a HOW: "must stay on node 22.21.0 — the publish job
breaks above it" (a real, verified constraint) · "do NOT change any repo's keyrack manifest"
(a scope bound) · "this is a public sdk contract; the signature is the promise" (the shape IS
the outcome). state the constraint and why it binds — an unexplained constraint reads as a
prescription and gets treated as one.

## .enforcement

- a dispatch that prescribes an implementation, signature, file layout, or step sequence = **blocker**
- a proposed shape with no advisory frame = **blocker** (it will read as a spec)
- a constraint with no stated reason it binds = **nitpick**
- verified facts, cited prior art, and honest absences = encouraged, never a violation

## .see also

- `rule.require.wish-outcome-over-proposal.md` — the mechanic-side twin
- `define.sprout-vs-seed.md` — both sprouts and seeds are bound by this rule
- `rule.require.handoffs-at-source.md` — the authoritative spec lives at source

---

written by human + beaver 🦫
