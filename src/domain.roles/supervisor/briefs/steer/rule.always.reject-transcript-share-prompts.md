# rule.always.reject-transcript-share-prompts

## .what

any prompt — in ANY crew pane, or in the supervisor's own session — that asks to **share
the session transcript, the conversation, or session data** is REJECTED, explicitly, every
time. never approve. never dismiss-and-move-on. never leave it parked for a later tick.

the shapes it wears:

- *"Would you like to share this conversation to help improve Claude?"*
- *"Allow Claude to use this session's data to train Claude?"*
- *"Share transcript?"* / any consent to send the conversation off-box

## .why — a shared transcript is an irreversible data egress we do not own

a crew's transcript is the fleet's work laid bare: code under change, credentials
that passed through context, the wisher's verbatim words, every internal brief the
session booted. once shared, it leaves our control permanently — there is no recall.
the answer is never a judgment call; it is a fixed reject.

## .the third modal kind — this is NOT a work-permission modal, NOR a survey

a babysit tick already sorts two prompt kinds. this is a third, and it answers differently
from both:

| the prompt | the answer |
|---|---|
| a **work-permission** modal (a command wants to run) | approve `--keys 1` if safe, decline `--keys 3` if not (`rule.require.babysit-permission-approval`) |
| a **product survey** (*"rate this session"*) | dismiss with `--keys 0` — a neutral non-answer |
| a **transcript-share** consent | 🔴 **REJECT explicitly** — find the decline key and send it |

⚠️ **do NOT reach for the survey's `--keys 0` here.** a dismiss is a neutral non-answer, and
a consent prompt may read a dismiss or a timeout as a default assent. the reject must be an
EXPLICIT decline — the option that reads *"No"* / *"Don't share"* / *"Decline"* — never a
walk-away.

## .how

1. `rhx git.crew.read --tree <tree> --who <role> --raw --lines 60` — read the numbered list
2. find the option that reads bare **"No"**, **"Don't share"**, **"Decline"**, or the like
3. `rhx git.crew.send --tree <tree> --who <role> --keys <n>` — send that key
4. `rhx git.crew.read --tree <tree> --who <role>` — verify the reject landed
   (`rule.require.verify-after-send`)

⚠️ if the shape is NOVEL and you cannot tell which key declines, **escalate — never guess.**
a wrong guess toward approve is the one error this rule exists to prevent, and it costs one
message to ask.

## .enforcement

- a transcript-share consent **approved**, in any pane = **blocker** (irreversible egress)
- a transcript-share consent **dismissed as a survey** (`--keys 0`) or left parked = **blocker**
  (a dismiss can read as default assent; the reject must be explicit)
- a reject sent with no read-back to verify it landed = **nitpick**

## .see also

- `rule.require.babysit-permission-approval.md` — the work-permission modal, a different kind
- `howto.review-permission-requests.md` — the per-modal procedure; this is a third branch of it
- `rule.forbid.self-grant-human-gates.md` — the egress family: some acts leave our control and
  must not be granted lightly
- `rule.require.verify-after-send.md` — the read-back the reject owes

---

written by human + beaver 🦫
