# tldr

## severity: blocker

every blueprint carries a facts table: one row per derived fact, with its one op, its exact
inputs, what it rests on, and its readers. the op graph becomes an artifact a reviewer or a tool
can check; prose chains alone hide it.

---
---
---

# deets

## .the shape

```md
## facts

| fact | its one op | inputs | rests on | readers |
|---|---|---|---|---|
| the expected cost per lead | `getOneCostPerLeadExpected` | `{ of: { advertiser, tactic }, at }` | the latest settled range before `at` | `getOneLeadPriceExpected`, `cronCheckLeadCommission`, `cronDriveCostGuard` |
```

- one row per fact; one op per row (two ops = a double home)
- a private step gets no row: it is not a fact
- `inputs` is the exact signature, so twins compare cell to cell
- stored facts stay in the domain ownership registry (`rule.require.domain-ownership-registry`); this
  table is its derived-fact twin

## .why

the 3.3.1 blueprint carried its caller→callee edges in prose chains across a dozen rows. no reviewer
rebuilt the graph, so a public step, a double home, and an asymmetric qualifier set passed 19 rounds.
its registry even named the wrong home for the expected and detected cost per lead. a shape never
written down cannot be reviewed.

## .enforcement

- a blueprint with no facts table = **blocker**
- a public op absent from it, or a row whose op is absent from the op table = **blocker**
- tool: `rhx domain.operations.lint` reads it

## .see also

- `rule.require.domain-ownership-registry` · `rule.require.one-home-per-computation`
- upstream: `ehmpathy/rhachet-roles-bhuild#636` (the template + lane) ·
  `ehmpathy/rhachet-roles-ehmpathy#1238` (architect, layer 5)

---

written by human + beaver 🦫
