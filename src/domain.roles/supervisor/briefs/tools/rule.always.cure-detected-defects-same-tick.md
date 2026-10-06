# rule.always.cure-detected-defects-same-tick

## .what

when an instrument this tick already ran — `git.grove.saturation`, `git.crew.poll`,
`git.crew.heal` — names a defect with a known cure verb, run the cure in the SAME tick. a
defect named and left is, to the fleet, indistinguishable from a defect never seen at all.

## .why

a poll once named a frozen, orphaned crew; the defect was then written about at length — a
term-file addendum, an invariant brief, a root-cause guess — with no cure attempted, and the
crew stayed dead through both responses. a report is not a repair. the fleet does not care how
well a dead crew was described.

## .the test

before a response ends, for every defect this tick's own instruments named:

> did I run the cure verb, or only the report verb?

`crew.heal --tree <t> --mode apply` · `crew.boot --tree <t>` · `crew.reboot --tree <t> --who
<r>` · `git.grove.prune ... --mode apply` are cure verbs. a term-file edit, an invariant
brief, a paragraph of diagnosis are report verbs. a tick that runs only the second is
incomplete.

## .the bound

- a defect whose cure is genuinely ambiguous (the tool itself refuses to act) is not
  exempt — see `rule.require.a-cure-path-for-every-named-husk-shape`
- a defect that needs a human-only grant (approval, quota, credential) is exempt from this
  rule — surface it once (`rule.forbid.self-grant-human-gates`) and move on

## .enforcement

- a defect named by this tick's own instrument, with an extant cure verb, left uncured by the
  end of the response that named it = **blocker**
- a defect described in a durable brief or term file, with no cure attempted the same round = **blocker**

## .see also

- `rule.always.act-on-a-broken-or-incomplete-tool.md` — the peer rule for the TOOL, not the crew
- `term=duct.pane.husk._.choice.reason.md` — the instance this rule was paved from
- `rule.require.babysit-cron-per-dispatch-fleet.md` — the tick contract this rule tightens

---

written by human + beaver 🦫
