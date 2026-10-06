# rule.require.abandon-poisoned-conversations

## .what

when a clone's api errors name a **defect in the request body itself**, that conversation is
**terminal**. stop it, boot a fresh one **without `--resume`**, and drive it from the route.

do not retry. do not wait. do not report it as a stall.

```
rhx git.crew.stop --tree <tree> --roles mechanic
rhx git.crew.boot --tree <tree> --roles mechanic          # ⚠️ NO --resume
rhx git.crew.send --tree <tree> --who mechanic --anyway --what 'rhx route.drive'
```

the `route.drive` is the fresh conversation's boot prompt, never a steer — it hands the clone
the route, which is the instruction (`rule.forbid.steer-a-clone-beyond-a-permission-key`).

## .the signature

```
API Error: 400 {"type":"error","error":{"type":"invalid_request_error",
  "message":"The request body is not valid JSON: no low surrogate in string:
   line 1 column 1169676 (char 1169675)"}}
```

a lone utf-16 high surrogate — a multi-byte character clipped at a boundary — sits in the
serialized body. **that body IS the transcript**, so it re-serializes on every turn.

the discriminator, and it costs one read: **the same error under a DIFFERENT `request_id`.**

| the error | is it terminal? |
|---|---|
| `400`, names the **body** — invalid json, bad surrogate, malformed field | ✅ **yes.** every turn resends it |
| `429`, or `You've hit your limit` | ⛔ no — a vendor cap (`rule.require.resume-quota-capped-clones`) |
| `5xx`, `overloaded`, a timeout | ⛔ no — transient. retry is correct |
| a `400` seen **once** | ⛔ not yet. a second request_id settles it |

## .why it must be abandoned rather than retried

the body is regenerated from the transcript on every request, so the defect is **not in the
attempt** — it is in the state the attempt is built from. a retry constructs the identical
bytes and receives the identical rejection, forever. an operator who reads it as transient
buys naught per tick and spends the clone's whole session.

## ⚠️ .`--resume` restores the poison

`crew.boot --resume <role>` reattaches the SAME transcript, which is the one artifact that
must not survive. the recovery is a **resume-less** boot.

this is the one case where the paved resume is the wrong verb, so it is worth stated twice:
a poisoned conversation is recovered by **replacement**, never by continuation.

## .why abandonment is cheap — the route holds the state

the transcript holds the clone's memory; **the route holds the work**. stones, guards, yields,
`.given.by_peer` / `.taken.by_self`, the review ledger, the fulcrum inventory — all on disk,
all authored, none of it in the conversation.

so a fresh clone resumes at the same stone for the cost of one `rhx route.drive`. that is the
whole reason this rule can demand a stop rather than a rescue.

## .the producer is unestablished

a lone surrogate comes from a multi-byte character clipped mid-encode. this fleet is
emoji-dense (🦫 🐢 🦉 🗿) and several surfaces clip by character count — `duct.poll
--brief` truncates box text at ~60 chars, and tool results clip on length. which one
produced it is not known, and a killed transcript cannot be re-read to find out. do
not cite a cause this file does not have.

## .the cost when it is misread

a body-defect classified as a stall routes to a nudge, a reviewer ask, a budget
top-up — all of which leave the poisoned conversation in place and spend the whole
session on zero progress.

## .enforcement

- a body-defect `400` retried, or waited on, after a second request_id shows the same error =
  **blocker** (every tick spent buys naught)
- a poisoned conversation recovered with `--resume` = **blocker** (it restores the defect)
- a body-defect `400` reported to the human as a stalled or blocked stone = **blocker** (it
  routes the reader to cures that cannot work)
- a fresh boot with no `route.drive` sent = **nitpick** (the clone holds the work and not its
  place in it)

## .see also

- `rule.require.nudge-parked-clones` — the stall routes this is NOT one of
- `rule.require.resume-quota-capped-clones` — the vendor-cap arm of the discriminator table
- `term=volunteered-diagnosis._.choice._.md` — why an honest error read beside a wrong
  conclusion is the expensive part
- `term=crew._.choice._.md` — why `crew.stop` is irreversible, and why that is acceptable here

---

written by human + beaver 🦫
