# howto.run-a-babysit-tick

## .what

the procedure a babysit tick follows, once the cron has fired. the **rule** that a cron is owed
at all is `rule.require.babysit-cron-per-dispatch-fleet`; this is its procedure half — the same
split as `rule.require.babysit-permission-approval` + `howto.review-permission-requests`: the
rule says what is owed, the howto says how it is done.

## .the ONE poll

**`git.crew.poll` answers four halves in one parallel call:**

| half | rendered by |
|---|---|
| the **tree** — dirty, merged, green, behind, orphaned, phantom | crew poll only |
| the **box** — empty, prompt, queued, prefilled | delegated to `duct.poll` |
| the **stone** — where on the route, and who owns the halt | delegated, then tallied |
| the **motion** — changed / unchanged, per duct and in aggregate | delegated, then tallied |

`duct.poll` answers one of the four, so a supervisor never calls it directly — its subject is
never a duct (`rule.require.speak-at-the-supervisor-layer`).

the **motion** half is a deterministic content-hash compare against the prior poll — the stall
signal `rule.require.throttle-babysit-cron-by-idle-streak` counts honestly rather than by eye.

the sweep is READ-ONLY by construction: it never sends a key, never approves a prompt, never
stops a duct. read the whole fleet, judge, THEN act.

### ⚠️ .when the crew poll does not render what you need

**add a flag. never fall back to a loop, and never fall back to `duct.poll`.** every column
above (`--boxes`, `--stones`, `🌊 ducts moved`) was added rather than hand-joined, because the
alternative becomes the silent default (`rule.require.bulk-over-byhand`).

a **drill-in** is not a fallback: once the sweep has named a subject, a
`rhx git.crew.read --tree <tree> --who <role>` on that one role is the paved move
(`howto.review-permission-requests` step 0 requires it).

## .the shapes

every row is a crew verb. there is no `duct.*` row, by design.

| want | call |
|------|------|
| the babysit tick | `rhx git.crew.poll --live --stones` |
| live crews + what each role awaits | `rhx git.crew.poll --live --boxes` |
| every crew ever booted, at work or down | `rhx git.crew.poll` |
| merged, clean trees to close — a name here triggers closeout THIS tick (`rule.require.tree-del-before-duct-close`); the foreman waits, never acts alone | `rhx git.crew.poll --fellable` |
| `limited` crews a nudge cures — a transient 429 or a stale cap, each row with its runnable `git.crew.heal`. a live/future cap is excluded. act on the emitted lines, never a name transcribed by hand (`rule.always.poll-the-fell-and-heal-sets`) | `rhx git.crew.poll --healable` |
| one tree, or a slug | `rhx git.crew.poll --only <slug>` |
| a slower grove | `rhx git.crew.poll --timeout 40` |
| ONE role's full pane, after the sweep named it | `rhx git.crew.read --tree <tree> --who <role>` |
| a steer or keystroke into ONE role | `rhx git.crew.send --tree <tree> --who <role>` |

the last two rows are the drill-in and the act: the sweep chooses its subject; the read supplies
the depth a summary cannot. a duct that fails to read reports `💥` (or `⏳` on timeout) and never
aborts the sweep — one down grove must not hide a live fleet.

## .the fleet is BOTH sides, and only the ducts you own

the default scope is `fleet` = every duct shaped `$tree/$role`. the shape alone bounds it: a
dispatch duct is `duct://<host>/<tree>/<role>` (two path segments); a human's personal shell is
`duct:///<name>` (one). so `fleet` needs no enumerated role list and never goes stale.

🔴 **never pin a tick to one role, and never to `--local`.** a role pin once hid a stalled
foreman for a whole session; a widened pin once swept the human's own terminals into the
report. a blind spot forms from an unnoticed shortcut, not a decision — answer a slow grove with
`--timeout`, never an excision.

## 🔴 .the ⭐ star scope is a PIN TOO — and it can report a dead fleet

`--live --stones` defaults to the **sponsored** set (`rule.always.read-stars-as-sponsored-
priorities`), which is right: the common question is *how does the funded work fare?* the
hazard is that every tally beneath it counts the stars ALONE, so a `0` there is a floor, never a
total — and the render says so.

🔴 **the state where it inverts: a grove the stars cannot reach.** if every star sits on a mute
tunnel, the star-scoped tick reports a DEAD fleet beside a live one. measured 2026-09-20: four
ticks reported `0 await approval · 0 blocked · 0 in review` while `--all --live --stones` on the
same minute showed 7 live human gates unrelayed — plèas, absent seats, parked clones. `--all` on
the derived sets (`--fellable` / `--healable`) does NOT cure it; only the stones view carries
pleas and parked clones, and it was the one never widened.

| when… | then… |
|---|---|
| the star tally reads all-zeros | 🔴 that is a floor. widen before you relay it |
| every star renders `😴 unread` / `asleep` | 🔴 the star scope can see NAUGHT — run `--all` |
| you would report *"0 await approval"* | ask which scope produced the 0 |
| you already ran `--all --fellable` / `--all --healable` | they do not cover the stones view. widen that one too |

the star scope stays the default and is correct; what is owed is the second read on the tick
where the first is blind by construction.

## .always `--brief` on a tick

pane bodies run ~30KB per sweep — context read once and discarded every 15 minutes. act only on
the VERDICT lines; drill into a single role with `rhx git.crew.read` only where a verdict flags
a state that warrants action.

## .a stalled mechanic is a DEDICATED verdict, never a judgment call

`🚧 PROMPT` is its own poll status, peer to `changed` / `unchanged`. a mechanic parked on its own
permission prompt is the most actionable state a sweep can find — never infer a stall by eye
from a pane body.

⚠️ a cursor-shape read misses it both ways: claude keeps an input box below the menu (a tail read
grabs the empty box and calls the duct idle), and a narrow pane wraps an option so its number
vanishes. the detector keys on the modal's own chrome (`Do you want to proceed?`, `requires
approval`, `Esc to cancel`) — a property of the pane no wrap can mangle.

**on a `🚧 PROMPT` verdict, reach for the paved verb:**

```sh
rhx git.crew.modal --tree <tree> --who <role>                      # read + parse, sends NAUGHT
rhx git.crew.modal --tree <tree> --who <role> --answer approve     # once you have judged it
```

a bare call is read-only: it renders the full command and the parsed option list and stops. the
judgment (`rule.require.babysit-permission-approval`) stays yours; the key travels only under
`--answer`, and from there the verb sends and verifies in one call.

⚠️ the key is DERIVED, never assumed: `approve` is the option whose text is exactly `Yes`;
`decline` is the option that starts `No` **and sits last**. a `No` not last is **refused**,
never guessed — a hand-count of `--keys 2` reads `No` on a two-option modal and "yes, and don't
ask again" on a three-option one.

⇒ the four-step hand cycle — `crew.read` → count → `crew.send --keys N` → `crew.read` — is the
**braid** (`rule.always.entool-the-permission-modal-cycle`); its third run in one session is a
blocker, even though every call in it is a legitimate crew verb. `crew.send --keys` now nudges
toward the verb at the moment of use.

never judge off the poll's option list alone — the poll shows the choices, not the command they
act on. prefer the narrow option: "yes, this once" (`1`) by default; the persistent "and don't
ask again" (`2`) only for a bounded, in-repo, read-only command that will otherwise re-stall on
every iteration. full scope-shape analysis of option 2 is in `howto.review-permission-requests`,
step 3.

## .a `--keys` that arrives LATE becomes stray text — and lies about who typed it

a poll is a snapshot; between the read and the send, a prompt can clear on its own, so the
keystroke lands in an EMPTY INPUT BOX as literal text, and the next poll reports `✍️ PREFILLED
"1"`. that is a **false human-typed signal, born of the supervisor's own keystroke** — the
`--raw` color check cannot catch it, because the text really was typed. it is also live
ammunition: a stray `1` prepends a digit to the next instruction the mechanic reads.

**how to apply:**
- ALWAYS re-poll after a `--keys` (`rule.require.verify-after-send`)
- if the box reads `PREFILLED` with the digit you just sent, that is YOUR keystroke. clear it
  with `--keys BSpace`, then re-poll to confirm `box empty`
- never report such text to the human as their queued message, and never relay it
- a clean arrival is VERIFIED, never assumed

## 🔴 .the box may hold a DIFFERENT numbered menu — and the poll cannot see it

worse than an empty box: a box that is neither empty nor a permission modal, but another
numbered menu with its own sense for `1`. measured 2026-09-04: a tick reported zero `🚧 PROMPT`
while the pane held a satisfaction-survey menu (`Bad / Fine / Good / Dismiss`, numbered 1–3 plus
0). the poll is right to omit it — it gates no permission — but the babysit `1 = approve` key
reads `Bad` against this box. it is worse than the empty-box case: it **consumes** the
keystroke, renders as a normal turn, and leaves no artifact a later poll can flag.

**how to apply:**
- the mandatory `crew.read` before a `--keys` reads **what the box holds**, never merely the
  command. if the box is not the modal you read, do not send
- a numbered box that is not a permission modal is never yours. leave it alone and say so
- this is an owed instrument gap: a `📋 BOX AWAITS` verdict for "a numbered box that is not a
  modal" would close it

## .enforcement

- a sweep that fires N sequential `crew.read` (or `duct.read`) calls where any bulk instrument
  covers the subject set = **blocker** (`rule.require.bulk-over-byhand`)
- a byhand loop reached for because a poll's render was thin, with no flag added and no gap
  recorded = **blocker**
- a supervisor tick that calls `duct.poll` at all = **blocker** — `git.crew.poll` calls it and
  answers three halves more
- 🔴 any `duct.*` call in a tick = **blocker.** the drill-in is `rhx git.crew.read`, the act is
  `rhx git.crew.send`; a crew verb that errors is a repair you owe, never a fallback
  (`rule.always.entool-the-layer-you-drop-below`)
- a tick pinned to a single role, or to a `--local`-style scope that skips a slow grove =
  **blocker**
- a stall detected by eye from a pane body rather than reported as a `🚧 PROMPT` verdict =
  **blocker**
- a `--keys` sent on a `🚧 PROMPT` without a `crew.read` of that role first = **blocker**

## .see also

- `rule.require.babysit-cron-per-dispatch-fleet.md` — the RULE half
- `rule.require.bound-grove-concurrency-by-saturation.md` — step 0 of the tick
- `rule.require.babysit-permission-approval.md` — the per-prompt safety test
- `howto.review-permission-requests.md` — the full per-modal procedure
- `rule.require.bulk-over-byhand.md` — close a render gap with a FLAG, never a loop
- `rule.require.throttle-babysit-cron-by-idle-streak.md` — the no-change streak the motion half
  feeds

---

written by human + beaver 🦫
