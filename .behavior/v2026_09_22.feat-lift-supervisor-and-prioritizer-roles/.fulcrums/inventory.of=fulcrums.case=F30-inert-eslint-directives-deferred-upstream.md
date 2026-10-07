# F30 — the six declapract-managed inert lint directives stay deferred

- **status** — itemized, unruled
- **rework** — clean
- **confidence** — 90%
- **where** — `jest.config.ts`, `jest.unit.config.ts`, `jest.integration.config.ts`,
  `jest.acceptance.config.ts`, `jest.integration.env.ts`, `jest.acceptance.env.ts`
- **caught** — 2026-09-28, post-pass, at stone `5.3.verification`

---

## .the fork, stated fairly

the `lint` gate went red on two files I authored this session. both carried
`// eslint-disable-next-line`, and **this repo has no eslint** — measured three ways:

| probe | result |
|---|---|
| `rhx globsafe --pattern '.eslintrc*'` | `files: 0` |
| `rhx globsafe --pattern 'eslint.config.*'` | `files: 0` |
| `rhx grepsafe --pattern 'eslint' --glob 'package.json'` | `matches: 0` |

so the directives were inert: a guardrail that reads as present and holds naught
(`rule.forbid.failhide`). I fixed mine at cause — a plain string plus `toContain`, which biome
never objects to, rather than one suppression swapped for another.

`rule.forbid.sampled-instances` then obliged me to hunt the **class**, not stop at my sample.
the hunt found nine total. after my two and one standalone `src/` file, **seven remain**, and six
of those live in declapract-managed template files.

⇒ the fork: **strike the six here and now, or defer them upstream?**

| option | the case for it |
|---|---|
| **A — strike them locally** | the class is real, the mandate is *"if you detect it, you fix it"*, the edit is six deletions, and the lint gate is green either way |
| **B — defer to `declapract-typescript-ehmpathy`** ✅ | the template owns those lines, so a local strike is erased or conflicts on the next `rhx declapract.upgrade` — the repair reads correct and is not durable |

## .taken, and why at the time

**B.** the decisive fact is ownership, never effort: `declapract.use.yml` declares
`declarations: npm:declapract-typescript-ehmpathy`, so those six lines are rendered from a
template this repo consumes. an edit here is not a fix — it is a local divergence that the next
upgrade reverts, and in the meantime it makes the upgrade noisier for whoever runs it.

⇒ **a repair that the toolchain undoes is not a repair. it is a fix that reports itself as done.**
that is the same failure shape as the inert directive itself, one level up — which is precisely
why I would not trade one for the other.

`rule.always.fix-forward-under-scouts-honor` grades this as row 2: **safe, but not clean.** the
CLEAN question asks whether the fix lands in the diff I already have or ripples into contracts
this change never intended to open. it ripples into the declapract template contract. so the rule
itself prescribes defer-plus-record, and the record is this fulcrum and its paired dream.

the three rows that passed SAFE *and* CLEAN were fixed in the same turn, not deferred:

| row | why it was clean |
|---|---|
| `computeFeedbackOutput.test.ts` | I authored it this session |
| `computeFeedbackTakeGetOutput.test.ts` | I authored it this session |
| `getGithubTokenByAuthArg.test.ts:11` | already open in this diff; the directive's *reason* kept as a `.note` |

## .rework, and why

**clean.** the deferral costs one dream file and this row. to reverse it — strike the six here
after all — is six single-line deletions in six files, with no caller hardened against them and no
later work built upon the choice. nobody is blocked either way; the `lint` gate is green with the
directives present, because biome simply never reads them.

## .confidence, and why it is not higher

**90%.** the 10% doubt is not about the ownership fact, which `declapract.use.yml` documents and
no one disputes. it is about whether `declapract` would in truth revert a *deletion* — I did not
run an upgrade to prove it, and some declapract checks are additive rather than exact-match, in
which case a local strike might survive.

⇒ I would rather record that as an unverified premise than let the fulcrum read as measured. the
conclusion does not turn on it: even where a strike survives an upgrade, the durable home for a
template defect is the template, so B holds on the architectural ground alone.

## .the verdict

*(unruled — awaits the foreman's council)*
