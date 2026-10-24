## .what

add a reflector skill `reflect.on.feedback.given`. for now it only echoes a fluid prompt. the prompt tells the brain that called it to run a structured reflection on the feedback its human gave in the session.

v1 is a prompt, not a mechanism. it echoes to stdout and does no parse, no write, no network.

## .why

humans make the same kind of correction again and again across sessions: a verb outside the grammar, a flag that differs between `set` and `del`, an address built from repo/branch where the tree is the grain, an example that shows only the happy path, a glyph that fails contrast. each correction fixes one artifact, and the lesson stays in that chat. the next session makes the same call and the human says it again.

the cure is to ask each time: why did the human have to say this, and why did no extant rule force the decision first? then distill the gap into a rule and dispatch it to the repo that owns that rule. this skill makes that reflection a single paved call, so it is not improvised.

## .the provenance

measured on `rhachet-roles-bhuild` @ `beav/feat-phone-text`, stone `1.vision`: 17 human corrections in one vision pass. ten generalized rules came out of them and went upstream as separate dispatches. the human asked for the reflection by hand: *"itemize the feedback i have given, and reflect on why i had to say it and why our extant rules didnt force those decisions to begin with. we'll want to enqueue dispatches upstream to ensure we never relitigate these types of points."*

## .the shape

```
rhx reflect.on.feedback.given            # echo the prompt
rhx reflect.on.feedback.given --help
```

the prompt asks the brain to:

1. **itemize** every piece of feedback the human gave this session, in the human's own words, verbatim where it can
2. **for each**, state:
   - what the brain did that drew it
   - why the human had to say it
   - **which extant rule should have forced the decision, and why it did not**: the rule is absent, out of scope (e.g. it governs code but not cli surfaces), unwritten (a convention that lives only in a peer role's code), or present and ignored
3. **cluster** the gaps into root causes, so the cure is not one rule per complaint
4. **distill** generalized rules: a name (`rule.<directive>.<topic>`), a one-line statement, and which items it covers
5. **route** each rule to the repo and role that owns it, and draft a `rhx radio.task.push` dispatch for each
6. **offer** to push the dispatches and to fix the instances still in the artifact. do not push before the human confirms

the output is a table of feedback and gaps, then a table of rules and targets. every rule ends up either in an upstream repo or in this repo's `.agent/repo=.this/`.

## .the require + forbid pair the prompt must demand

a forbid bites faster than a require: a reviewer greps for a forbidden shape, but must reason to spot an absent one. so step 4 of the prompt must distill **both halves** of each rule:

- every `rule.require.*` or `rule.always.*` ships with a `rule.forbid.*` twin
- the twin names the concrete shapes to grep for, as a 👎 / 👍 table

the skill itself pairs with **`rule.forbid.relitigated-feedback`** (reflector): a correction the human already gave, which a later session draws again, is a blocker. the reflection is what makes that forbid enforceable.

## .the bound

- v1 only echoes. later it may read the session transcript, or `.taken` / fulcrum verdicts, to pre-fill the itemization
- the prompt is fluid prose, not a rigid template. the brain adapts it to the session

## .done when

- `rhx reflect.on.feedback.given` prints the prompt and exits 0
- an acceptance test snapshots the stdout
- the reflector readme lists the skill
