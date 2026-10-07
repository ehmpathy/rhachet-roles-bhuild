# domain.term.choice.reason: auth

## .etymology

`auth` is the clipped form the whole tool ecosystem already speaks — `gh auth login`,
`aws sso login`, `auth0`, an `Authorization` header. it arrives with its sense intact and needs
no gloss, which is the first bar `def.domain-discovery` sets: *"a domain expert recognizes it
with no gloss."*

it was **not invented at a keyboard.** the human named it in three corrections, each narrower
than the last, and each one settled a different half of the term:

| the ask | what it settled |
|---|---|
| *"a command which forwards that url to me and opens it in my local browser"* | the OUTCOME — two machines, one browser |
| *"not duct auth. grove auth"* | the NOUN — the subject is a machine, never a keyboard |
| *"git.grove.auth"* | the SHAPE — it joins the extant `git.grove.*` family |

the middle correction carries the load. i had reached for the duct layer because a duct is what
i address every other minute, and the correction is a `rule.require.speak-at-the-supervisor-layer`
slip caught by the domain expert rather than by me.

## .the rejected words

| ⛔ word | why it distorts |
|---|---|
| `login` | implies ONE machine and ONE step. the whole difficulty here is that the machine that needs the credential cannot open a browser, so a login is exactly what is unavailable |
| `signin` | same defect, plus it is two words fused. `auth` is the clipped form the tools already ship |
| `connect` | names a transport, and the transport already works — `git.grove.send` and every duct reach that box fine. what is absent is a CREDENTIAL, not a route |
| `authenticate` | correct and long. every peer verb on this noun is one clipped syllable — `wake`, `list`, `send` — so a five-syllable member breaks the family's shape for no gain |
| `link` / `pair` | both imply a durable BINDING of two parties. an auth mints a credential on one party; the browser is a transient courier and binds to no one |
| `enroll` | ⛔ **TAKEN** — `rhachet`'s enroller role owns it: `role + brain = actor`. one word, two concepts |

## .the disputes

### dispute: `--auth` (the identity sense) — raised 2026-09-02 — status: **OPEN**

- raised.by = beaver, as i authored `git.grove.auth`
- claim = the word is already spent. `rhachet-roles-ehmpathy` ships
  `--auth as-human | as-ehmpath` on `git.commit.set` and `git.commit.push`, and it means
  *"under whose identity"* — a SELECTION among identities we already hold. mine means
  *"obtain a credential we do not hold."* one word, two concepts, which
  `rule.forbid.ambiguous-labels` grades a blocker
- counter = the two never share a slot. the identity sense is always a `--auth <value>` FLAG
  and takes a closed value set; the act sense is always a `<noun>.auth` SKILL and takes a
  grove. no reader has ever had to disambiguate one from the other in a live call, and the
  clipped `auth` is the word both ecosystems already speak
- ⚠️ the tiebreak i may NOT take unilaterally: the identity sense **predates** mine and lives
  in a repo i do not own. `rule.require.conform-toward-what-you-do-not-own` puts the burden on
  THIS side, so a rename would be `git.grove.signin` here rather than a rename of `--auth`
  there
- resolution = **unresolved.** owed: a seed to `ehmpathy/rhachet-roles-ehmpathy` that states
  the collision and asks which sense keeps the word. until it answers, both stand and the slot
  is the discriminator

## .evidence

### the two-leg shape is forced, not chosen

this is the discovery that makes `auth` a distinct verb rather than a synonym for `login`. a
`gh auth login` is one call because one machine holds both the credential need and the browser.
here they are split:

```
the GROVE          needs the credential, has no browser
YOUR machine       has the browser, does not need the credential
```

so no single call can finish it, and the verb has to name a handshake rather than an act:

| leg | what crosses | the direction |
|---|---|---|
| 1 | the sign-in **url** | grove → here (a read, then `xdg-open`) |
| 2 | the **code** | here → grove (a `send`, per `term=send`) |

the human's own words captured leg 1 exactly — *"forwards that url to me"* — and **forward** is
the tell that this is not a login. you do not forward a login.

### the read is a `false-report` hazard, and the gate is what makes the verb trustworthy

leg 1 refuses to hand over a url unless it carries BOTH `code_challenge=` and `state=`. that gate
is not decoration — it fired on the first real run:

```
https://claude.com/cai/oauth/authorize?…&code_challenge_method=S256
                                                              ↑ ends here. state= absent
```

93 characters, cut mid-parameter, and it stops at a plausible terminus — so it reads exactly like
a whole url. a supervisor that opened it would have got a broken sign-in page and no way to tell
whether the fault was the url, the browser, or the grove.

that is `term=false-report` precisely: the tool ran clean, exit 0, ordinary format, and the
content was untrue. the gate is the countermeasure, and it doubles as the retry condition — the
read retries against the CORRECTNESS oracle rather than against a clock.

### it is non-idempotent, and that is named rather than hidden

`rule.require.idempotent-operations` asks that an intrinsically non-idempotent operation be named
as such and record why. a re-auth mints a fresh `state` and `code_challenge`, so the url from a
prior call is dead the moment a new one runs. two supervisors that auth the same grove in
parallel will each hold a url, and only the later one works.

no idempotency key can fix this — the non-idempotency is oauth's, by design (a replayable
`state` is the attack the parameter exists to prevent).

## .the replication ladder

**one party, one act.** `term=replication`'s gate applies, and it comes back weak: every instance
of this term is mine, on one skill, in one afternoon.

it is paved regardless, on the gate's own exception — it *"blocks an INVENTED distinction, never
a RECORDED one."* the distinction was recorded by the **human**, not by me: *"not duct auth.
grove auth"* is a domain expert's correction of a scope error, which is the discovery
`def.domain-discovery` calls ground truth. i did not derive it; i was corrected into it.

what remains genuinely unreplicated is the OVERLOAD dispute above — that is my judgment alone,
which is why it is filed OPEN rather than resolved.

---

written by human + beaver 🦫
