# domain.term.choice: blocklist

## .what

a **blocklist** names the trees a review lane must NOT grade. its pair, an **allowlist**, names the
dirs a lane MUST grade. one axis: **which set the template enumerates.**

```
term.boundary = review.scope     # "a blocklist, of WHAT?" → of a review's scope
```

## .the cluster

| term | kind | enumerates | what it costs when wrong |
|------|------|-----------|--------------------------|
| ✅ `blocklist` | noun | the **non-deliverable** trees — closed, org-wide | a new tree is un-excluded; the lane still grades real code |
| `allowlist` | noun | the **deliverable** dirs — open, per-repo | 🔴 **zero targets**, and a confident verdict over them |
| `non-deliverable tree` | noun | `.agent/**` · `.dream/**` · `.behavior/**` | — |

## 🔴 .the choice, and it is not a style call

**the two sets are asymmetric.** the deliverable set is open, varies per repo, and is unknowable
from a shared template — `src`, `blackbox`, `terraform`, `bin`, `infra`, `scripts`, `.github`. the
non-deliverable set is **closed**, org-wide, and already fixed by convention.

⇒ so their failure modes are opposite: **an allowlist fails to EMPTY; a blocklist fails to WIDE.**
an empty target set still returns a well-formed verdict, so it is silent. a wide one merely costs
context.

## .forbidden synonyms

| forbidden | canonical | one-line |
|-----------|-----------|----------|
| `blacklist` | `blocklist` | org standard; and `blocklist` says what it does where `blacklist` says only what colour it is |
| `whitelist` | `allowlist` | same |
| `denylist` | `blocklist` | a real synonym in the wild; one word per concept |
| `exclude list` / `include list` | `blocklist` / `allowlist` | prose, not a term |

## .refs

- `ehmpathy/rhachet-roles-bhrain#446` — the structural default this term names
- `ehmpathy/rhachet-roles-bhrain#448` — the failure mode an allowlist shares with a guessy parser
- `term=review.scope.blocklist._.choice.reason.md` — etymology, the measured reversal, evidence
