# domain.term: unread

term.chosen   = unread
term.kind     = adj
term.boundary = duct.box
term.synonyms.forbidden:
- unknown
- none
- empty
- shell
- blank
- silent

## .what

a **box whose pane capture came back empty** — so no claim about the box is available, in
either direction.

```
⌨️  empty       read fine, the input box holds no text     -> idle; route by its stone
🚧 prompt      read fine, a modal is up                    -> decide, then send keys
✍️ prefilled   read fine, text typed and unsent            -> relay it
📬 queued      read fine, text typed AND submitted         -> leave it; the clone drains it
👻 suggested   read fine, a dim autocomplete ghost         -> NEVER submit
⌨️  none/shell  read fine, no claude box at all             -> a plain shell duct
❔ unknown     read fine, the ladder matched no arm        -> read the text on the row
😶 unread      THE CAPTURE WAS EMPTY                       -> re-read the duct
```

## .it is the only box verdict that is a claim about the READ

every peer above asserts a fact about the **world** — what the pane holds. `unread` asserts a
fact about the **instrument** — that it returned naught, so no pane was judged.

that split is not coined here. it is `term=asleep`'s, at the crew boundary, adopted one layer
down:

| boundary | the word | the subject that went unseen | the cure |
|---|---|---|---|
| `crew`   | `asleep` | a grove that did not answer  | `rhx git.grove.wake <grove>` |
| `duct.box` | **`unread`** | **a pane whose capture was empty** | **re-read the duct** |

⇒ same claim, different subject, different cure — which is exactly the test `asleep` uses to
part itself from `down`.

## .the three paths that yield it

all three assert the identical fact — no pane was judged — so all three must render one word:

1. the read failed, `rc != 0` — an unreachable grove, an absent session (the default)
2. the plain read worked and the **raw** capture came back empty
3. the parallel worker wrote no verdict file at all

## .unread is NOT

- **`unknown`** — the boundary that costs the most, and the one this word was split from. it
  asserts the pane was **held and judged**, and the ladder matched no arm. opposite cure: read
  the text the row already carries. see `.reason` for the incident
- **`empty`** — asserts the pane was read AND the input box holds no text. a positive claim
  about a box we saw
- **`none` / `shell`** — asserts the pane was read AND holds no claude box. also positive
- **`clipped`** — the `route.stone` boundary, and the word this one was wrongly stretched to
  cover. `clipped` asserts the capture came back FINE and the pane WAS judged; only the **tail**
  was cut by a narrow surface. opposite cure: widen the pane, never re-read. see
  `term=route.stone.clipped._.choice.reason.md` for the overload — shipped, then caught the same
  session, 2026-09-03
- **`asleep`** — the same claim at the **crew** boundary. a crew may be `asleep` while a box is
  `unread` for a wholly different reason, so neither implies the other
- **a `malfunction`** — that is an instrument that could not **run**. the poll ran clean; one
  read of many returned empty, and the sweep is otherwise whole

## .refs

declared at `.agent/repo=.this/role=any/skills/`:

- `duct.poll.sh` — the classifier default, the empty-raw guard, the absent-verdict fallback,
  and the `box UNREAD` render arm
- `git.crew.poll.sh` — the `*'box UNREAD'*` join arm and the `❔unread` tally token
- `work/work.surface.classify.integration.test.ts` — `[case] … [t3]` clamps the split, the three
  could-not-read paths, the join, and the tally sentence

## .reason

see `term=duct.box.unread._.choice.reason.md` — the overload it was split from, why each render
site glossed the branch it did not cover, and the OPEN question of whether `unread` reads too
near `asleep`'s forbidden `unreached`.

---

written by human + beaver 🦫
