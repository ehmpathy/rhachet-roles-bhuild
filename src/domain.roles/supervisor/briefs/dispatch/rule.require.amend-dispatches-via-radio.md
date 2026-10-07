# rule.require.amend-dispatches-via-radio

## .what

to amend a task you dispatched, push it again through the **radio**. never reach for a raw
`gh issue comment` or `gh issue edit`.

```sh
cat <wish>.md | rhx radio.task.push --via gh.issues --into <org>/<repo> \
  --exid <N> --title "<the same title>" --description @stdin --idem upsert
```

## .why

`gh issue comment` is not allowlisted, and the hook re-blocks rather than prompt — a retry buys
naught. an upsert lands the amendment at the top of the body, where a dispatchee reads first; a
comment sits below the whole wish. edit the local wish, then upsert FROM it — that is what
keeps `src/stream/` and the artifact in sync.

## .how

1. edit the local wish file
2. read the edited region back (`rule.require.verify-after-send`)
3. `cat` it into `radio.task.push` with `--exid <N> --idem upsert`
4. verify with `gh issue view <N> --repo <org>/<repo> --json body`

⚠️ **an upsert REPLACES the description.** re-send the whole file, never a fragment — a partial
upsert's success report is byte-identical to a complete one.

pass only the description; the radio re-wraps its own envelope.

## .the general form

> when a raw CLI is blocked, ask **"is there an rhx skill that owns this surface?"** before you
> retry or escalate. a block signals you reached past a paved path far more often than it signals
> that no path exists.

## .enforcement

- a `gh issue comment` / `gh issue edit` on a radio-dispatched task = **blocker**
- an upsert sent from typed text rather than from the local wish file = **blocker**
- an upsert with no read-back = **nitpick**
- a raw CLI retried after a hard block, with no check for an rhx skill that owns the surface =
  **nitpick**

## .see also

- `.agent/repo=.this/role=any/briefs/evidence/role=supervisor/rule.require.amend-dispatches-via-radio.reason.md` — the incident, and why an upsert beats a comment
- `rule.forbid.direct-tmux-duct-term.md` — the same reflex, on the duct surface
- `rule.require.verify-after-send.md` — why a success report is not proof

---

written by human + beaver 🦫
