# rule.require.list-ducts-before-decisions

## .what

run `rhx git.crew.list` before any decision that spans more than one crew.

⚠️ the verb is a crew verb. `rhx duct.list` is the substrate call beneath it, never what a
supervisor types (`rule.always.entool-the-layer-you-drop-below`).

## .why

you may hold crews you forgot, and a human's reference — "close that one" — is ambiguous with
no full set in view. the list prevents an act aimed at the wrong crew, rarely reversible.

## .when

before you stop or fell a crew · decide which crew a human means · report "all of them" · any
act that touches more than one crew. the full set first, THEN the decision.

## ⚠️ .the instrument is LOCALHOST-ONLY

`crew.list` hardcodes `localhost`, so it shows local crews alone, with no trace of what it left
out (`term=partial-audit`). measured 2026-09-05: it printed `2 crew(s)` over a fleet of 29.

| you need | reach for |
|---|---|
| the full set, every grove | `rhx git.crew.ledger` |
| the full set, with live state | `rhx git.crew.poll --live` |
| local liveness alone | `rhx git.crew.list` |

say the localhost bound out loud on every use, until a `--grove` flag closes the gap.

## .enforcement

- a cross-crew decision with no prior read of the full set = **blocker**
- a decision made off `crew.list` alone, where a grove crew could be in scope = **blocker**
- `crew.list` run on a mixed fleet with the bound left unsaid = **nitpick**

## .see also

- `rule.always.entool-the-layer-you-drop-below.md` — why the verb is `crew`, not `duct`
- `rule.require.bulk-over-byhand.md` — the same claim for a sweep

---

written by human + seaturtle 🐢
