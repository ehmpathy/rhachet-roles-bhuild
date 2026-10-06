# domain.term: duct.refresh

term.chosen   = refresh
term.kind     = verb
term.boundary = duct
term.synonyms.forbidden:
- repaint
- redraw
- resync
- restore
- reset

## .what

**repaint every terminal attached to a duct, and hand its geometry back to the terminal.**
a repair of the VIEW, never of the work.

```
rhx git.crew.refresh --tree <slug>
   ├─ repainted /dev/pts/5
🔧 duct:///…/mechanic refreshed (1 client(s))
```

## 🔴 .the word is OVERLOADED today, and this file does NOT settle it

`refresh` names **two different concepts** on the same `duct` boundary:

| the call | what it refreshes | the layer |
|---|---|---|
| **`duct.refresh --on <uri>`** | the **view** — repaint clients, restore `window-size latest` | a terminal |
| `duct.list --refresh` · `__duct_refresh_host` | the **registry** — re-read live state into the cache | a data store |

⚠️ a boundary does not part them — both are `duct.*`, so
`rule.require.boundary-qualified-terms` offers no cure. they differ by **concept**, which makes
this a true overload under `rule.forbid.domain-term-ambiguity`, and the repair is a **second
word** for one of the two senses.

⇒ **this cluster claims only the VIEW sense.** the cache sense is owed its own word
(`resync`, `reload`, and `rescan` are the live candidates) and is **not decided here** — a
rename of a live flag is not a thing to do inside a babysit tick.

## .what it does, precisely

1. tells each attached client to repaint
2. restores a window stranded in `window-size manual` back to tmux's own `latest`, **and says
   so when it did**

## .why the geometry half matters more than the repaint half

tmux sizes a window to its client, so a window in `window-size manual` no longer tracks its
terminal and stays narrow. a narrow pane wraps claude's chrome, and then:

- a stone clips before its verdict — `blocked ✋…`
- 🔴 a modal option loses its shape — `2. Yes, and…` renders `2Yes, and…`, and the box detector
  reads a **live modal as an empty box**

⇒ the second is the dangerous one: the duct goes unbabysat while the sweep reports it healthy
(`term=false-report`).

## .it is NOT destructive, and that is a guarantee rather than a hope

no program dies, no byte of state is lost. `window-size latest` is tmux's **own default** — the
call hands geometry back to the terminal rather than takes it. zero clients attached is a
**success**, since a headless grove duct is normal.

⇒ so it is safe to run on a hunch, which is what makes it a first-line move rather than a last
resort.

## ⚠️ .what it does NOT cure

a clip has more than one cause. a `refresh` that reports **no geometry restore** has proven the
strand was absent — so the clip is a different defect, and its cure is still open. read the
report; do not assume the repair.

### 🔴 .a narrow pane whose cause is the TERMINAL — and the refresh still exits 0

`window-size latest` makes a window track its client. it does not make the **client** wide. so a
duct whose kitty window was born small is narrow with its geometry perfectly correct, and every
line above holds while the defect stands.

⚠️ **and the call SUCCEEDS.** it repaints, it restores no strand because there is none, it exits
`0`. so a caller who reads only the exit code, or only stderr, learns naught about the width.

⇒ that is why the report now carries the width on **stdout**, on both arms:

```
🔧 duct://…/mechanic refreshed (1 client(s), pane 45 cols)
   └─ ⚠️  NARROW at 45 cols — claude's modal chrome wraps below ~80
      fix: the cure is at the TERMINAL, never at tmux. attach a fresh
        client and it wins — `rhx git.crew.show --tree <t>` (no hide owed)
```

### ✅ .the cure is a FRESH CLIENT, and `crew.show` alone is the whole of it

tmux sizes a window to the **smallest** attached client, and a newly attached one wins outright
where it is the only client. so `git.crew.show` cures it with no `hide` first.

🔴 **do NOT prescribe a hide-then-show.** measured 2026-09-16: `crew.hide` failed outright —
`term.stop: terminal is alive but its window would not close`, then `Error: EOF` — and `crew.show`
alone then took the same duct from **45 cols to 93**. a hide in the recipe converts a one-call
cure into a stuck duct.

⚠️ **the upstream cause is kitty's `remember_window_size`.** it caches the last window size, so
**one** window closed small seeds every duct window booted after it. `term.open` cures that for
NEW windows; it cannot reach a window already open, which is what leaves `crew.show` as the cure
for the extant fleet.

🟡 **there is no bulk read for this yet.** `refresh` is per-tree, so a fleet scan means a loop —
which `rule.require.bulk-over-byhand` grades a blocker. the owed repair is a width column on
`git.crew.poll`, so the sweep names the narrow crews the way it already names the fellable ones.

## .refs

- `duct.refresh.sh` · `work/ductwork.sh` — the substrate
- `git.crew.refresh.sh` · `crew.refresh` — the supervisor-layer verb
- `term=duct._.choice._.md` — the subject
- `term=crew._.choice._.md` — the work/view axes this acts on the VIEW half of
- `rule.always.entool-the-layer-you-drop-below.md` — why the crew verb exists

## .reason

- `term=duct.refresh._.choice.reason.md`

---

written by human + beaver 🦫
