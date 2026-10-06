## ⛺ supervisor

- **scale**: camp-level, across every grove and every tree on it
- **focus**: what each crew actually does, right now
- **maximizes**: honest verdicts over a fleet nobody can watch by hand

used to tend the camps — sprout trees, seat crews, and poll them for a verdict.

---

### 🔴 .read this first

this role speaks a vocabulary assembled across **three repos**, and two of its words are
routinely misread:

- **`camper` is not a clone.** a clone *camps out* on a grove; `camper` is the OS login it
  enters **by**. `clone-user` and `crew-user` are forbidden synonyms
- **`camper` is not an AWS boundary.** IMDS answers any uid with no privilege, so a camper
  with zero sudo already holds the grove's full badge. camper bounds the **box**; the grove
  role's **tier** bounds AWS

⇒ the six terms, each with its source repo named: **`briefs/persona/define.camp-mythology.md`**.
it boots at `say` level, because the second bullet is a safety claim rather than a vocabulary one.

⇒ every other word this role speaks is one row in **`briefs/glossary.of=supervisor.md`**.

---

### the layers, innermost out

```
camp → grove → tree → crew → clone
```

a verdict is about a **crew**, a **tree**, a **grove**, or a **camp** — never about a duct, a
term, or a pane. those are substrate: diagnosis vocabulary, never a verdict's subject
(`rule.require.speak-at-the-supervisor-layer`).

---

### skills

| family | verbs | what it reaches |
|---|---|---|
| `git.crew.*` | 15 | the seats on a tree — poll, read, revive, ledger, prune |
| `git.grove.*` | 8 | the boxes — auth, wake, saturation, prune |
| `git.tree.*` | 8 | the worktrees — sprout, sync, supervise, behavior |
| `duct.*` | 9 | the tmux/ssh transport a crew is reached over |
| `term.*` | 3 | the local terminal tabs |
| unfamilied | 2 | `git.release.poll` — one release verdict per tree · `git.checkout` |

**45 verbs.** the last row is not filler: `git.release.poll` is a fleet-wide verdict, the same
shape as `git.crew.poll`, and a table of families alone would hide it.

```sh
rhx git.tree.behavior --grove cloud://my-grove   # sprout a tree
rhx git.crew.poll                                # one verdict per crew
```

---

### .setup — which groves may host a crew

a crew boot onto a remote grove **fails closed** until the grove is declared a work grove. two
ways, the first preferred:

| way | how | why |
|---|---|---|
| the grove's own marker | `rhx git.grove.send my-grove --what 'mkdir -p ~/.grove && echo work \| tee ~/.grove/purpose'` | it survives a rename of the box |
| the declared list | `export CREWWORK_GROVES_BOOTABLE=my-grove,my-other-grove` | a stopgap for a grove with no marker |

⚠️ the list ships **empty**. this package names no org's grove, so an undeclared grove is refused
with a fix that names both ways, never booted on a guess.

---

### .the four work primitives

`crewwork` · `ductwork` · `termwork` · `syncwork` — the shared libraries the verbs compose.
their fixtures live in `skills/work/.test/.assets/` — **56 files, each a bug that already
shipped**: 51 captured panes, 4 captured *renders* (a verdict the renderer got wrong), and 1
captured `eco.priority` body. they move with the classifiers or the classifiers move unguarded
(`rule.always.clamp-the-verbatim-pane-your-classifier-judged`).

⚠️ the 5 non-pane files are why this cites a **count** rather than the `pane.` prefix — the corpus
is named for its commonest member, never bounded by it.

🔴 this read *"51 panes plus 5 renders"* until a peer reviewer counted. `51 + 5 = 56` is
arithmetically true and factually false — there are **four** renders, and the 56th is the
`eco.priority` capture. ⇒ **a right total will hide wrong parts**, so the census is clamped per
part, never by its sum (`testFixtures.integration.test.ts` `[case2]`).

🟡 and the odd one out earns its place here: `eco.priority.get.truncated-body.log` is named for a
**prioritizer** skill and read by a **supervisor** test (`crewwork.poll.integration.test.ts` `[case29]`,
which grades `__crew_eco_star_verdict` against a 64 KiB short write). ⇒ a fixture belongs to
whoever **reads** it, never to whoever it is named after.

---

written by human + beaver 🦫
