# rule.forbid.clipped-sweeps

## .what

a **sweep** — an instrument whose whole purpose is to enumerate a set — is read **whole**. never
pipe one through `head`, `tail`, `grep`, or any other filter.

```sh
⛔  rhx git.crew.poll --live --stones | tail -125
✅  rhx git.crew.poll --live --stones
```

the same holds for every fleet-wide enumeration: `git.crew.list`, `git.grove.saturation`,
`term.audit`, `git.release.poll`.

## 🔴 .why — a clipped sweep is INDISTINGUISHABLE from a complete one

> **a truncated fleet renders exactly like a full one.** no ellipsis, no count mismatch, no warn
> line. the output looks like an answer, and it is a fragment.

the failure is silent by construction, which puts it in the `false-report` family: the
instrument was honest, the reader's inference was not. *"the fleet holds no 🚧prompt"* is false
while *"the 125 lines I read hold no 🚧prompt"* is true, and only one of those was ever measured.

⚠️ the clip defeats the one property a sweep is bought for. `rule.require.bulk-over-byhand`
forbids a loop of drill-ins precisely so one call covers the set. a clipped sweep costs the same
call and delivers a sample — the worst of both instruments.

## .the measured failure

2026-09-04, babysit ticks 41–43. three consecutive polls run as `| tail -125` against a
29-crew fleet. the clip cut roughly a third of the fleet and concealed a live `🚧prompt`. three
ticks reported "no prompt" and the human had to name it twice — and the same defect had been
paved as a render-side issue two ticks earlier by the same supervisor.

> **a rule you wrote does not fire on its own. you have to run it.**

## .the test

before any pipe, ask:

> **does this command's value come from the SET it returns?**

- **yes** → it is a sweep. read it whole
- **no** — it returns one subject's detail (`git.crew.read --lines N`, a log tail) → a filter is
  fine, and `--lines` is the paved way to bound it

⇒ a **drill-in** is bounded at the tool (`--lines`), which is honest because you chose the
subject. a **sweep** must not be bounded at all, because you did not.

## ⚠️ .context economy is never the reason

| the worry | the answer |
|---|---|
| *"the output is huge"* | that size IS the measurement. 29 crews take 29 crews' worth of lines |
| *"I only need the tallies"* | the tallies sit at the BOTTOM; the per-crew rows carry the 🚧prompts |
| *"I will catch it next tick"* | three ticks is what it actually cost |

if a sweep is genuinely too large to read, the repair is a **narrower flag on the tool** — one
the render then declares — never a pipe the render cannot see.

## .enforcement

- a fleet-wide sweep piped through `head` / `tail` / `grep` = **blocker**
- a verdict about the fleet — "no prompts", "none blocked" — stated off a clipped sweep =
  **blocker**
- a drill-in bounded with `--lines` = **false positive** (exempt — you chose the subject)

## .see also

- `rule.require.bulk-over-byhand.md` — the peer: enumerate once, never loop
- `term=false-report._.choice._.md` — the family this failure lands in, reader-inference branch
- `term=partial-audit._.choice._.md` — an instrument that picks its own subject set
- `term=duct.box.quiet._.choice.reason.md` — the render-side twin, paved two ticks before this
  rule was earned

---

written by human + beaver 🦫
