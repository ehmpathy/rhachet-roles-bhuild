# rule.always.grade-infra-on-unattended-operation

## .what

when you evaluate any credential, auth, or reach design for the fleet, the **first** question
is:

> "who touches this on a schedule?"

never "is it secure?" and never "is it cheap?" first. a design that needs a periodic human
reauth is **disqualified**, even where it is cheaper, simpler, and more secure than its rival.

## .why — autonomy has no natural advocate

the fleet's whole value is crews that work overnight with no human awake. a human on a timer is
not a papercut; it is the failure of the product.

| axis | how it surfaces |
|---|---|
| cost | computed, up front, in a table |
| security | argued, up front, by anyone who reads the design |
| autonomy | silent at design time — it surfaces at 3am, on grove N, mid-crew |

cost and security defend themselves in review; autonomy does not, so it must be graded first or
it is not graded at all.

## .the case for it

the keyrack expires in ~9 hours. a design that leans on a per-grove `keyrack unlock` puts a
human on a 9-hour cycle, multiplied by every grove, and each expiry stalls whatever crews were
live. a defer-to-manual-unlock proposal was correctly scored on security (temp creds,
revocable) and missed the structural win of the alternative — a `credential_process` that
refreshes with no human, ever. the deferral was itself a regression: a cheaper, simpler, more
secure design that still makes the supervisor a credential courier on a timer, across N
laptops.

## .check the chain end to end — a relocated expiry is no fix

swap a 9-hour keyrack reauth for a 24-hour cert default and you have gained naught — the design
still owes an auto-renew daemon (`step ca renew --daemon`, or a systemd timer), and the renewal
itself must need no human.

> ask what renews it. if the answer is a person, you moved the problem rather than solved it.

## .the cues

| when… | then… |
|---|---|
| evaluate a credential, auth, or reach design | ask "who touches this on a schedule?" before cost or security |
| a design needs periodic unlock/reauth/refresh | blocker-grade, even if cheaper and more secure |
| you propose "supervisor does X, pushes to the grove" | you made the supervisor a courier on a timer, × N groves |
| a fix replaces a 9h expiry with a 24h expiry | you relocated it — name what renews it |
| a credential is short-lived by default | check for an auto-renew daemon before it is counted solved |
| the design is sketched for one grove | multiply by N — a per-grove human act scales linearly; the fleet does not |
| no human in the loop, end to end | ✅ passes |

## ⚠️ the bound — not a mandate to automate every gate

human-only gates stay human-only. stone approval, commit quota, release auth, and credential
**provision** are deliberate human decisions (`rule.forbid.self-grant-human-gates`). this rule
targets the **refresh** of a credential a human already granted, never the grant. one grant,
then unattended operation.

## .enforcement

- an infra design adopted with a human act on a timer in its credential/reach path = **blocker**
- a fix that relocates an expiry with no auto-renew path named = **blocker**
- a design graded on cost or security with no autonomy verdict recorded = **nitpick**
- automation of a human-only grant = **blocker**, and it is `rule.forbid.self-grant-human-gates`,
  never this rule

## .see also

- `rule.always.drive-autonomously` (bhrain/driver) — the clone's autonomy; this rule is the
  infra's. a clone told to carry on cannot carry on past an expired credential
- `rule.forbid.self-grant-human-gates` — the bound above; what stays a human decision
- `howto.keyrack` (ehmpathy/mechanic) — the ~9h expiry this rule is measured against

---

written by human + beaver 🦫
