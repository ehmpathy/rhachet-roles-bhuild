# rule.require.confirm-behavior-size-above-nano

## .what

nano is the default behavior size. before you boot ANY size above nano
(mini / medi / mega / giga), you MUST:

1. state the size and a one-line reason it is warranted, and
2. get an explicit human ok BEFORE the boot.

nano dispatches proceed without this gate. mini+ do not.

## .why

each step up adds stones and review gates, and is expensive to undo once booted — the route is
bound and work begins.

🔴 the asymmetry is easy to misremember backwards: the cheap moment to size DOWN is before
boot; no such moment exists for a size UP. never manufacture a deadline around a size — a nano
tree that later proves to need a blueprint gets one then, on evidence, cheaper than the round
trip spent to extract a guess up front.

## .how to size

start at nano. step up only when the task TRULY needs the extra structure — the per-size
route is in `rule.require.behaviors-over-adhoc`.

⚠️ a task with a given signature + a prior pattern to mirror is nano, **even if it has
tests**. "it has a test harness" or "it has error handlers" is NOT enough to leave nano —
those fit inside a nano vision.

## .the lever

`git.tree.behavior` fails fast (exit 2) on a non-nano `--size` that carries no
`--size-why '<reason>'`. the fail forces you to articulate the cost, and the reason rides
in the visible command so the human can veto before boot.

```bash
rhx git.tree.behavior --into org/repo --name beav/feat-token-endpoint --size mini \
  --size-why 'design unsettled — token-endpoint harness + error taxonomy need a blueprint' \
  --wish src/stream/$Q/$date.dispatch.repo=repo.behavior=feat-token-endpoint.wish.md
```

🔴 **the `--size-why` satisfies the TOOL gate; it does NOT replace the human ok.** surface
the size + reason and wait for the go-ahead before you run it.

## .the sequence for mini+

1. draft the size + one-line reason
2. surface both: "this is <size> because <reason> — ok to boot?"
3. only on their ok, run `git.tree.behavior --size <size> --size-why '<reason>' ...`
4. if unsure which size, ask — do not guess

## .enforcement

- boot of a mini+ behavior without a prior human ok = blocker
- a `--size-why` used to skip the human ok (a self-grant) = blocker
- `--size mini|medi|mega|giga` without `--size-why` = blocked by the skill, by construction

## .see also

- `rule.require.justify-a-feat-classification.md` — the SIBLING toll, and the same `--why`
  mechanism. `--size-why` prices the ROUTE; `--feat-why` prices the CLAIM. a caller meets both on
  one command line, so read them together
- `rule.require.behaviors-over-adhoc.md` — the per-size routes; ask if unsure
- `howto.dispatch-workers.md` — the dispatch flow (author wish → boot behavior)

---

written by human + seaturtle 🐢
