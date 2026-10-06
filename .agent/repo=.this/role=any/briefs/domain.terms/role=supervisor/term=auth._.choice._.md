# domain.term: auth

term.chosen   = auth
term.kind     = verb  (the noun form — *an auth* — is the same word, per `poll`'s precedent)
term.synonyms.forbidden:
- login
- signin
- connect
- authenticate
- link
- pair
- enroll

## .what

to **sign a brain in on a grove** — carry an oauth handshake across the boundary between the
machine that needs the credential and the browser that can answer for it.

```
rhx git.grove.auth <grove> --brain claude              read the sign-in url, open it here
rhx git.grove.auth <grove> --brain claude --code '…'   hand the code back to the grove
```

it is a **two-leg** verb, and that is what parts it from an ordinary login: the party that must
be signed in and the party that can sign in are on different machines, so one call cannot
finish it.

## .the SUBJECT is a machine, never a keyboard

the sharpest boundary, and the human drew it in three words — *"not duct auth. grove auth."*

| | what it would mean | why it is wrong |
|---|---|---|
| `duct.auth` | sign in one addressable keyboard | ⛔ a claude credential is written to `~/.claude`, so it is **machine-wide**. every duct on that grove inherits it at once |
| **`grove.auth`** | sign in the **machine** | ✅ matches where the credential actually lands |

so the noun a verb attaches to is a claim about SCOPE. `duct.auth` would have promised a
per-keyboard credential the substrate cannot give, and the next traveler would have signed in
twice for one machine.

## ⚠️ .the word is OVERLOADED against a peer repo's `--auth`

`rhachet-roles-ehmpathy` already ships `--auth as-human | as-ehmpath` on `git.commit.set` and
`git.commit.push`. that sense is **not** *"sign in"* — it is *"under WHOSE identity"*:

| the use | sense | part of speech |
|---|---|---|
| `git.commit.push --auth as-ehmpath` | **which identity** to act as | adjectival — it names a selection |
| `rhx git.grove.auth <grove>` | **do the sign-in** | verb — it names an act |

one word, two concepts. that is a **blocker** by this repo's own standard
(`rule.forbid.ambiguous-labels`), and it is **not settled here** — the other sense predates
mine and lives in a repo i do not own, so `rule.require.conform-toward-what-you-do-not-own`
puts the pressure on THIS side. a dispute is open in `.reason`.

until it closes, a reader parts them by the slot: a `--auth <value>` flag is the identity
sense; a `<noun>.auth` skill is the act.

## .auth is NOT

- **`unlock`** — TAKEN, and it is the opposite direction. `rhx keyrack unlock` reads a credential
  we already hold into the current process. `auth` **obtains** one that does not yet exist
- **`wake`** — TAKEN by `git.grove.wake`, which raises a hibernated box. a woken grove may still
  hold no credential; an authed grove may still be asleep. the two are orthogonal
- **a `send`** — the `--code` leg IS a send (`term=send`), but the verb names the whole
  handshake, of which the send is one step
- **idempotent** — a re-auth mints a NEW `state` and `code_challenge`, so the prior url dies. this
  is the rare non-idempotent operation `rule.require.idempotent-operations` asks be named as such

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `git.grove.auth.sh` — the dop; both legs, the validate gate, the row-join read
- `git.grove.wake.sh` · `git.grove.list.sh` · `git.grove.send.sh` — the peer verbs on the same
  noun, which fix `auth`'s grammatical shape

`brain` is **not** itemized alongside it: it is vocabulary imported from the `rhachet`
dependency (`Role.build`, `brain.repl.imagine`), so `rule.require.domain-term-itemization`
excludes it by construction.

## .reason

see `term=auth._.choice.reason.md` — etymology, the rejected `login` / `connect`, the OPEN
overload dispute, and the evidence.

---

written by human + beaver 🦫
