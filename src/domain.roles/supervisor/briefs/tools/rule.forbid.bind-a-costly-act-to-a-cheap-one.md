# rule.forbid.bind-a-costly-act-to-a-cheap-one

> **never make a cheap, universal act depend on an expensive, optional one.** the bind is paid
> by every caller of the cheap verb, forever — and the first bill it sends is a verb you invent
> to dodge your own bind.

a **cheap** act is local, fast, idempotent, and wanted by every caller: register a row, open a
shell, make a dir. an **expensive** act crosses a boundary — a network, a credential, a quota,
a human — and only some callers want it.

## .why — the cost returns as a NEW VERB, which reads as progress

the bundle feels convenient at first: one call does the whole job. the bill arrives one step
later, disguised: bind the costly act to the cheap one → the cheap verb is now costly for
every caller → exclude the case to keep it cheap → the case now has no verb → invent one.

that last step reads as a capability added. it is a capability removed, then rebuilt worse:
the new verb serves one case, duplicates the cheap verb's whole body, and drifts from it — and
the case it serves is the one the cheap verb handled before the exclusion.

**the exclusion is the tell.** the moment you write an exclusion to keep a cheap verb cheap,
check what you excluded it from — if the answer is a cost you bound there yourself, the
exclusion is the bind's symptom, not a design.

## .the test

1. does every caller of the cheap act want the costly one?
2. if the costly half were removed, would the cheap half still be useful alone?

| 1 | 2 | verdict |
|---|---|---|
| no | yes | two verbs — the cheap one stands alone; the costly one runs when wanted |
| yes | yes | two verbs, plus a composite that calls both — never a fusion |
| — | no | one verb — the "cheap" half was never a whole act, just a step inside one |

question 2 is the one skipped, because the answer sounds like no when it is yes — "an empty
dir is useless", but a registered seat with an empty dir IS a seat: in the roster, with a duct,
pending one later call to fill it. useful-alone is a lower bar than finished-alone, and a
fusion argument always tests the higher one.

| when… | then… |
|---|---|
| you write an exclusion to keep a cheap verb cheap | check what you excluded it from |
| you are about to name a verb `<cheap-verb>.<case>` | the case belongs IN the cheap verb |
| you argue "X without Y is useless" | run question 2 — useful-alone ≠ finished-alone |
| a cheap verb grows a `--no-<costly>` flag | that admits the default is wrong — two verbs |
| the costly half can fail | the cheap half now fails for a reason unrelated to it |
| the costly half needs a credential, quota, or human | you just gated a local act on a human |
| a caller wants the costly act alone | the fusion cannot serve them |
| the cheap act is idempotent and the costly one is not | a re-run of the cheap verb gets a side effect its caller never asked for |

## .what to build instead

```
crew.boot        registers the seat   (cheap, local, every caller)
git.tree.sync    fills it             (costly, network, some callers)
crew.show        shows it             (cheap, local, every caller)
```

a composite that calls all three is fine — what is forbidden is a composite with no
decomposition beneath it, so a caller who wants one half has no verb to call. aim for: the
costly act is a verb the cheap one never mentions.

## ⚠️ .the bound

| forbidden | fine |
|---|---|
| a cheap verb that cannot run without the costly one | a composite that calls both, beside two verbs that each run alone |
| a case excluded from a cheap verb to keep it cheap | a case handled by the cheap verb, its cost deferred to another |
| a `--no-<costly>` flag on a cheap verb | a `--<costly>` flag that ADDS the costly act, off by default |

opt IN to cost, never opt out of it. a default that crosses a boundary fails for reasons its
caller never asked about.

## .enforcement

- a cheap, universal act that cannot run without a costly, optional one = **blocker**
- a case excluded from a general verb to keep it cheap, where the same author bound the cost
  there = **blocker**
- a `<verb>.<case>` verb whose body re-implements `<verb>` = **blocker**
- a `--no-<costly>` opt-out on a cheap verb = **nitpick**
- a composite that calls two decomposed verbs = correct

## .see also

- `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/rule.forbid.bind-a-costly-act-to-a-cheap-one.example=the-seat-that-needed-its-own-verb.md`
  — the worked case
- `rule.always.entool-the-layer-you-drop-below.md` — the mirror failure: a verb that should
  never have been written
- `rule.require.single-responsibility` (ehmpathy/mechanic) — the file-level parent; this is the verb-level form
- `rule.require.fewer-paths-via-idempotency` (ehmpathy/architect) — why the cheap half stays safe to re-run

---

written by human + beaver 🦫
