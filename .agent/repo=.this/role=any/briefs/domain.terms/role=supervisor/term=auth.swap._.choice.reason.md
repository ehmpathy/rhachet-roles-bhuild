# domain.term.choice.reason: auth.swap

## .etymology

**swap** — a plain trade: two things exchange places. it carries the one property that parts this
act from its neighbors — the account that leaves and the account that arrives are **peers**. one
is not a fresher copy of the other; they are different identities with different budgets.

chosen over:

| rejected | why |
|---|---|
| `relogin` / `re-signin` | the `re-` prefix claims a **repeat of the same act on the same account**. that is precisely what it is not — a re-login to the *same* account is a rotate |
| `switch` | generic, and already loaded in this fleet — a branch switch, a context switch. `rule.forbid.domain-term-ambiguity` refuses a word that does double duty |
| `changeover` | industrial jargon; names a scheduled transition with downtime, which a swap does not have |
| `re-auth` | reads as *"prove the same identity again"* — the ordinary sense of re-authentication |

## .disputes

### dispute: rotate — raised 2026-09-04 — status: RESOLVED (keep `swap`; `rotate` is a peer term)

- raised.by = beaver, mid-round
- claim = keyrack already ships rotation vocabulary (`fill --refresh`, `fill --repair`, and its
  help text *"rotate dangerous tokens"*). one credential-replacement word would be simpler than
  two, and `rotate` has the incumbent's claim
- counter = they replace **different things**, and the difference is the operative one. a rotate
  holds the account and mints a new token; a swap changes the account. **usage budget follows the
  account.** so a reader who collapses them reasons about the wrong quantity at exactly the
  moment the quantity matters — which is the whole reason this session existed
- resolution = keep both. `rotate` for same-account/new-token, `swap` for new-account. neither is
  a synonym of the other, so no forbid is owed in either direction; the `.choice._.md` table
  records the split so a future reader does not re-merge them

## .evidence

### 1. the wisher coined it, in correction, in caps

2026-09-04. the beaver read the ask as a first sign-in and moved toward one. the human corrected
it in two messages:

> we need to SWAP the login on that grove
> given that its about to run out of usage

the capitalization is the human's. a word a wisher **capitalizes while they correct you** carries
real load (`rule.always.archive-the-wishers-words-verbatim`).

and the second line supplies the motive that settles the `rotate` dispute above: *out of usage*.
budget is an account property, so only an account change can answer it.

### 2. an INDEPENDENT coinage, in a repo that never saw this conversation

`examplehuman/dev-env-setup`, `brains.auth.test.snap/help.use.snap`, line 15 — written before this
round, by another author:

> `exit codes with --reach (a SWAP), for a caller that reads only $?:`

that file also draws the **same** boundary this cluster draws, unprompted: `--reach` names an
account, and the exit codes distinguish *"the swap landed"* from *"your credentials are intact."*

⇒ two independent parties reached for the same word for the same act. that is the strongest
evidence available that a term is discovered rather than invented
(`rule.require.domain-discovery-for-term-proposals`).

### 3. the traversal split — measured, not reasoned

the claim in `.choice._.md` is that a swap walks a **different path** than a first auth. it was
not deduced; it was paid for.

`git.grove.auth.sh` had been exercised only on fresh boxes. the first real swap, 2026-09-04 on
`grove-ahbode-v20260901`, hit two defects in one run:

| defect | why only a swap reaches it |
|---|---|
| leg 1 hung on an unanswered `Quick safety check` | on a fresh box, trust arrives **after** sign-in, so leg 2 owned it. on an authed box it arrives at **startup** — a screen leg 1 had no arm for |
| leg 1 read a truncated url (44 chars) | the repl paints the url in a narrow **indented** box; the row-join right-trimmed but never left-trimmed, so every continuation row was rejected for its indent |

both are in the swap path alone. ⇒ **a word that names only an outcome would have predicted one
code path; the word names a traversal, and there were two.**

### 4. the terminus that a swap needs and an auth does not

the same run surfaced a report hazard unique to this act. leg 2's success message named the
account it landed on — truthfully — and the account was **the one already signed in**. the swap
had not swapped.

`claude auth status --json` settled it: `optimizer@ahbode.com`, unchanged. a second round with a
fresh account gave `casey@ahction.com` and a changed `orgId`.

⇒ so a swap's verdict is a **comparison**, never a bare read: *did the identity change?* an
auth's verdict is a bare read: *is one present?* a distinct question is a distinct term
(`term=false-report`, reader-inference family).

## .refs

- `term=auth._.choice._.md` — the parent act; this is that act on an already-authed box
- `term=false-report._.choice._.md` — evidence 4's family
- `rule.require.verify-after-send.md` — why the terminus compares rather than confirms

---

written by human + beaver 🦫
