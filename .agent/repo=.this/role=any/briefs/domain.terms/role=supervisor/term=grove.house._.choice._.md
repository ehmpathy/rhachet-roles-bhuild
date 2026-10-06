# domain.term: house

term.chosen   = house
term.kind     = adj
term.boundary = grove          # a value on the grove's LOCATION axis
term.synonyms.forbidden:
- touch
- close
- home
- onprem
- self-hosted
- owned
- edge
- private
- near

## .what

a **house** grove — a machine the house owns and operates, reached over a wire. *the house* reads
two ways at once and both are meant: **the place** (a laptop in your house, a desktop in a closet)
and **the establishment** (in-house, as against rented in).

```
local      the machine you are at — monitor, keyboard, the supervisor's own session
house      a machine the house owns and operates — reached over a wire
cloud      a machine the house rents
```

⇒ **the sense is custody, and the idiom already carries it.** a *house band* is the band the venue
keeps; *house rules* are the rules of this establishment; *in-house* is the industry word for work
you do not outsource. one syllable, and every reader already holds it.

🟢 **a flat triple. three values, no subtypes, no aliases.**

```
--grove local | house://<groveslug> | cloud://<groveslug>
```

## .what the triple settles

| the question | `local` | `house` | `cloud` |
|---|---|---|---|
| **reach layer** | 🟢 **none** | ssh over the wire | ssh over the wire |
| **can you read it without a tool** | 🟢 yes — look at it | 🔴 no | 🔴 no |
| who holds the disk | the house | the house | a vendor |
| remote hands at 3am | you, in person | you, in person | a vendor console |
| what a cancellation costs | naught; the house owns it | naught; the house owns it | the grove |
| per-month cost | power | power | rent |
| uptime guarantee | yours — no SLA | yours — no SLA | the vendor's |

🔴 **read the table by its two seams, and the triple explains itself:**

- **rows 3–7 are CUSTODY.** `local` and `house` agree on every one; `cloud` differs on every one
- **rows 1–2 are REACH.** `local` stands alone; `house` and `cloud` agree

⇒ so the three values are not three points on one line. **each neighbour pair differs on a different
axis**, and that is why a two-value vocabulary could never hold it.

## .what `house` settles that the extant pair could not

`term=grove` declares `local | cloud://<groveslug>` today, and that pair conflates the two seams:

| | is it THIS machine? | who owns it? |
|---|---|---|
| `local` | yes | the house |
| `cloud://…` | no | a vendor |

⇒ the pair holds only while every non-local grove is rented. **a machine the house owns, reached
over a network, satisfies neither** — it is not `local` (it has no monitor you are at) and it is not
`cloud` (no vendor rents it to you). that machine is `house`, and it had no cell.

with no word for it, such a grove files under `cloud://` and the vocabulary then asserts a
falsehood: that a vendor holds the machine. every reader who acts on that — about disk custody,
about who to call when it dies, about what a cancellation means — is misled.

## .why `local` keeps its own word

⚠️ **for a reason custody says naught about: it has no reach layer.** no ssh, no tunnel, no tailnet,
no cross-network identity. it cannot drop a tunnel, cannot be reaped, and needs no credential to
authenticate across a wire.

⇒ **a value that changes the transport earns a word.** that is rows 1–2, and it is the whole reason
`local` is not simply *the house grove you happen to sit at*.

## 🟢 .the collocated grove — `house://localhost`

a **second unix user on the very machine the supervisor runs on**, with its own `camper` and
`ground` (both **FOREIGN** terms — `ahbode/infrastructure`), addressed as a house grove over
loopback.

🔴 **it is the sharpest proof that the second seam is EYES-AND-WIRE, never DISTANCE.** it is
maximally proximate — same silicon, zero network hops — and it is still **not** `local`:

| | same machine? | the supervisor's own session? | verdict |
|---|---|---|---|
| the supervisor's shell | ✅ | ✅ | `local` |
| 🔴 **a second user, same box** | ✅ | 🔴 **no** | **`house`** |
| a laptop in a closet | no | no | `house` |
| a rented EC2 | no | no | `cloud` |

⇒ rows 2 and 3 are the **same kind of grove**, distinct only in latency. **a word keyed on proximity
would have split them** — which is exactly why `near` was rejected.

⚠️ and it yields a boundary an EC2 grove cannot: `term=camper` records that **IMDS answers any uid**,
so on EC2 a second unix user holds the grove's full AWS badge regardless. a house grove has no IMDS,
so its credential is a **file with unix permissions** — ⇒ the OS boundary can buy a real AWS boundary
there. 🟡 unverified until the identity mechanism is chosen; tracked at `#18`.

## .`blind` is prose for the ROW, never a `--grove` value

a **blind** grove has no eyes — no monitor to show you a stack trace, no keyboard to answer a modal
at. every fact you learn about it arrives over the wire, through an instrument you chose.

🔴 **the word is load-heavy, never decorative.** on a blind grove, an instrument's silence and a
machine's silence are the same bytes — which is exactly why `rule.always.read-both-crew-halves` and
`term=partial-audit` exist. at `local` you would simply look at the screen.

⛔ **but it is NOT a flag value**, because it spans two of the three cells:

```
                   │ has eyes    │ blind
───────────────────┼─────────────┼─────────────────
the house owns it  │ local       │ house
the house rents it │ —           │ cloud
```

⇒ *"the grove is blind"* is true of `house` **and** `cloud` alike. that span is its whole value, and
a `--grove blind` would destroy it — plus it would imply cloud groves have eyes, which is false and
acted upon. see the resolved dispute in the `.reason`.

## ⚠️ .the boundary case, stated so it is not re-derived

a server the house **bought outright and racked in a vendor's datacenter** is owned and is **not** a
house grove — it files as `cloud`.

🔴 **this one does NOT follow from the word, so it is written down rather than derived.** *in-house*
in the establishment sense would say yes; the verdict says no. the tiebreak is the table's own row
4: **remote hands at 3am are the vendor's**, so every operational property that matters behaves as
`cloud`.

⇒ conversely a **rented** Hetzner box is one the house operates day to day and is also not house.
**operation alone does not make a grove a house grove; ownership plus hands-on recovery does.**

🟡 zero instances today. the verdict is recorded to stop a re-derivation, never because a case is
live.

## .refs

where the term composes declared contracts — **all prospective**; `house` is coined here and is not
yet implemented:

- `.agent/repo=.this/role=any/skills/work/crewwork.sh` — `--grove` takes `local | cloud://…` today
- `term=grove._.choice._.md` — the axis this corrects
- `term=partial-audit._.choice._.md` — why `blind` is a load-heavy word, never a decorative one
- `.dream/v2026_09_11.reseed.cut-grove-cost-via-flat-rate-hardware.md` — the work that surfaced it

## .reason

see the ref-level cluster beside this choice:
- `term=grove.house._.choice.reason.md` — the etymology, the rejected synonyms, and the **four**
  resolved disputes — among them the one that retired `touch` as a live verb with 103+ instances,
  and the one that tried a subtype nest and dropped it

---

written by human + beaver 🦫
