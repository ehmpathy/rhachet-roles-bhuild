# domain.term.choice.reason: poll.flap

## .etymology

**`flap` is adopted from network operations, never coined here.** a *route flap* is a route that
alternates between advertised and withdrawn; an *interface flap* is a link whose reported state
alternates up/down. bgp carries damp timers precisely because a flap costs more than either
steady state does.

⇒ the semantic fit is exact, and it is exact in the part that matters: **what alternates is the
REPORT, and the link beneath it is often fine the whole time.** that is the same split this term
needs — an unchanged subject under a verdict that moves.

## .the enumeration that settled the word

per `rule.require.enumerate-before-you-name`, the instances were listed **before** a candidate was
scored, because a word tested against one instance has been tested once.

| # | the instance | measured |
|---|---|---|
| 1 | a **box verdict** on a byte-identical pane: `❔unread` → classifies → `❔unread` | 2026-09-05, `fix-grepsafe…/foreman`, three polls |
| 2 | a **tree verdict** over one dead mechanic: `unread`→`inflight`→`frozen`→`inflight`→`unread` | 2026-09-05, `feat-telepath-role`, five polls, `💥143` at a fixed timestamp throughout |
| 3 | a **fleet tally**: 🙋 7·7·7·4·5 across five ticks, zero grants issued | 2026-09-05 |
| 4 | a **count**: `❔unread` 13·10·11·14·14 while `ducts moved — 3 changed` | 2026-09-05 |

**the too-narrow check.** a candidate scoped to panes (`repaint-flap`, `capture-flap`) covers rows
1–2 and fails rows 3–4, which are aggregates rather than panes. rejected.

**the too-wide check.** `nondeterminism` covers all four rows **and** covers every unstable
process in the repo besides — it is the genus, so it discriminates naught. rejected.

`flap` covers all four and excludes `frozen`, `false-report`, `partial-audit`, and `phantom` by
the series property. it holds.

## .the rejected candidates

| candidate | why rejected |
|---|---|
| 🔴 `flake` | **taken.** the ci/test sense is live in this org — `cicd.deflake` is a shipped skill — so reuse would overload one word onto two concepts (`rule.forbid.domain-term-ambiguity`) |
| `race` | names a **mechanism**, and that mechanism is favored rather than settled. a word tied to a hypothesis dies with it |
| `jitter` | variance in **time**. a flap is variance in **verdict**, and its schedule is irrelevant |
| `flicker` | no established technical sense, and it implies a fast return to truth. a flap carries no such guarantee |
| `churn` | already carries a population-turnover sense here, and churn implies the subject really did change. a flap's subject does not |
| `nondeterminism` | the genus — see the too-wide check above |

## 🔴 .the warrant — `false-report` had already carved this concept out and left it homeless

this cluster was not proposed from taste. `term=false-report._.choice._.md` lists its own
rejected names, and one row reads:

> | `flake` | implies nondeterminism. a broken glob false-reports every single time |

⇒ **that rejection is an assertion that a nondeterministic twin exists and is not
`false-report`.** the glossary drew the boundary and never named what sat on the far side of it.
this cluster fills that hole, and the discriminator it uses — one read versus a series — is the
same one `false-report` used to push the concept away.

## .disputes

none open.

## ⚠️ .the boundary question, left open on purpose

`poll` was chosen over `duct.box` because **the subject that alternates is the verdict, and the
poll owns verdicts** — the box is the half that holds still, so a boundary of `duct.box` would
name the wrong one.

⚠️ **but the boundary may be too narrow, and there is not yet evidence to widen it.** all four
measured instances came from `git.crew.poll`. should `term.audit`, `crew.list`, or `crew.ledger`
later be found to alternate on an unchanged subject, the concept is plainly instrument-general
and the boundary wants a word above `poll`.

⇒ **do not widen it on this evidence.** wake the question on a first instance from a different
instrument — the same discipline `rule.require.enumerate-before-you-name` asks of the word itself.

## .evidence

- **discovery**: five consecutive supervisor ticks, 2026-09-05, one fleet of 29 crews
- **the byte-comparison**: `fix-grepsafe…/foreman` read three times via `git.crew.read --raw`,
  output identical each time while the poll's verdict alternated
- **the count that corroborates**: one tick where the poll self-reported `ducts moved — 3 changed`
  while two separate tallies each moved by three, over trees that were not those three
- **the cost, realized**: a supervisor asserted *"a repaint is inert"* off a single post-refresh
  read, retracted it when the next poll disagreed, then found the original verdict likely correct
  after all — a full retraction cycle caused entirely by a flap. `term=substituted-criterion`
  compounded it: width was measured where classification was meant

## .invariants

- a flap **cannot** be claimed from one read. one read yields a verdict, never a series
- a flap **cannot** be refuted by one read either — the same face may be drawn twice
- an intervention judged by the **single** read that follows it is unsound under a flap, because
  a flap rewards any intervention roughly half the time

---

written by human + beaver 🦫
