# domain.term.choice.reason: mech

## .etymology

`mech` is the clipped form of **mechanism**, and it was **not invented at a
keyboard**. the human coined it in one line, whole:

> *"what i asked you to do is to create a `git.grove.auth --brain claude --mech oauth`"*

that sentence settled three separate parts at once, which is why it is ground
truth rather than a suggestion:

| the part | what the sentence fixed |
|---|---|
| the **word** | `mech`, clipped — not `mode`, not `method` |
| the **slot** | a flag on a verb that already has a `--brain`; a peer axis, never a sub-mode of one |
| the **value** | `oauth` — a named road, so the set is closed rather than free text |

`def.domain-discovery` sets the bar at *"a domain expert recognizes it with no
gloss."* `mech` clears it: an engineer meets `--mech oauth` and needs no
definition, because *mechanism* is the word engineers already use for *which
machinery*.

## .the rejected words

| ⛔ word | why it distorts |
|---|---|
| `mode` | ⛔ **TAKEN, twice.** `plan\|apply` on ~8 skills, and `headfull\|headless` on `duct.open`. a third sense on the flag whose common sense is *"will this mutate?"* is the worst possible place for an overload |
| `method` | correct, long, and **spent in this exact domain** — claude's own screen reads *"Select login method"*, where it means which ACCOUNT TYPE (subscription vs console vs bedrock). `--method oauth` next to that screen asserts a claim about the account, not about our machinery |
| `via` | ⛔ **TAKEN.** `term.open --via kitty` names a terminal backend; `radio.task.push --via gh.issues` names a channel. both are CARRIERS that exist independent of the verb. a mech is a procedure the verb performs |
| `strategy` | implies a policy that adapts at runtime, and invites a `--strategy auto`. a mech is fixed at the call site, by a caller who knows the situation |
| `how` | an interrogative. it invites free-form text, where the value set is closed and per-verb |
| `driver` / `backend` | both name interchangeable implementations of one interface. these arms are NOT interchangeable — `attach` fails outright with no prompt up. see the preconditions table in the say file |
| `flavor` | suggests a cosmetic pick. the two arms differ in what they REQUIRE and what they mutate, which is the opposite of cosmetic |

## .evidence

### the crowded slot is measured, not asserted

a single grep over `*.sh` settles it, and the count is what makes `mode` a
blocker rather than a preference:

```
--mode plan | apply    git.release · sedreplace · git.repo.test · git.tree.del
                       set.package.install · set.package.upgrade · condense
                       git.branch.rebase · git.commit.set · git.commit.push
--mode headfull|headless   duct.open        ← a SECOND sense, already shipped
--via kitty                term.open · term.stop · term.read · term.send · term.list
--via gh.issues            radio.task.push · radio.task.pull
```

so **every near word was already spent** before this round began. `mech` was not
picked because it looks good; it was picked because it is the one clipped,
recognizable word left unclaimed on that surface.

⚠️ note the second row on its own terms: **`--mode` is ALREADY overloaded**, and
nobody has disputed it. `duct.open --mode headfull` is a real, shipped third
sense of a flag whose other ten uses mean plan-vs-apply. that is a live
`rule.forbid.ambiguous-labels` violation in this repo, found while this term was
paved — recorded here rather than repaired, because it belongs to ductwork and
deserves its own round.

### the two arms are what proved a second word was owed

`git.grove.auth` shipped with ONE road: scan every session on the grove for one
that already displays an oauth url. that road cannot raise a sign-in, so it
fails whenever nobody happened to leave one up — which is most of the time.

the second road boots claude itself. once two roads existed, the verb needed a
word for *which*, and the alternatives above were all taken. the need was
therefore produced by the code rather than imagined ahead of it — which is the
order `rule.prefer.wet-over-dry` asks for.

### the ARMS are named for what they DO, not for a protocol

`oauth` and `attach` look like an odd pair — one names a protocol, one names an
act. they are correct regardless, because each names the fact that **separates**
its road from the other:

- **`oauth`** — it drives claude's oauth selector itself, so it OWNS the whole
  handshake. the protocol IS the machinery here
- **`attach`** — it attaches to a session it did not make. what it does is find
  and read; it performs no handshake of its own

a symmetric pair (`own` / `find`, say) would look prettier and would hide that
`oauth` is the one arm which knows the protocol's screens by name. the asymmetry
is honest.

## .the replication ladder

**one party, one verb.** `term=replication`'s gate applies and comes back thin:
`--mech` exists on exactly one skill, coined in one afternoon, and no peer repo
has been observed to reach for it.

it is paved regardless, on the gate's own exception — it *"blocks an INVENTED
distinction, never a RECORDED one."* the distinction was recorded by the
**human**, in the sentence quoted above, and the crowded-slot grep is
independent evidence that a distinct word was forced rather than chosen.

what remains genuinely unreplicated is whether `mech` generalizes past this one
verb. two candidates are visible and neither is built:

| a verb that may want one | the arms it would carry |
|---|---|
| `duct.send` | how a payload is delivered — typed keys vs a paste vs a file |
| `git.tree.del` | how a tree comes down — the safe gate vs the husk sweep |

until a second verb takes a `--mech`, this cluster describes a word with one
user. that is stated rather than hidden, so a later traveler can judge whether
the generalization held.

---

written by human + beaver 🦫
