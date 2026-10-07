# `F27` — does a gitignored, engine-written artifact inside my route fall within this PR's review scope?

- **raised** — 2026-09-28, at `5.3.verification`
- **rework** — **clean** (a disposition on one concern; one command to reverse)
- **status** — best-guessed; **unruled**
- **confidence** — **92%**

---

## .the fork, stated fairly

the `repo-rules` lane (i006 · r001) raised one blocker against **21** files under
`$route/.route/`, each of which reads:

```
i promise i have completed the review.self for "has-fixed-all-gaps".
```

it cited `rule.require.slug-promise-format`, which asks that a promise read as
`i promise that it $slug`. **the reviewer is right about the text.**

> **so: do I concede — the files are on disk in my branch, they violate a rule this repo
> authored, and the stone says "if you detect it, you fix it" — or do I refute, because they are
> neither mine nor shipped?**

---

## .what I took, and why

**taken: refute.** three independent grounds, any one of which suffices:

### 1. 🔴 the files are GITIGNORED — they are not in the PR at all

```sh
git check-ignore -v '…/.route/5.3.verification.guard.promise.has-fixed-all-gaps.md'
# → .route/.gitignore:2:*
```

so they reach no reviewer of the PR, no consumer of the package, and no future traveler in this
repo. the only reason they entered the lane's scope is that **this branch has zero commits**, so
`--diffs since-main` unions the entire untracked set.

⇒ the lane graded a file that its own bind would never have shown it on a committed branch.

### 2. the text is written by ANOTHER PACKAGE

```sh
rhx grepsafe --pattern 'i promise i have completed|i promise that it' --glob 'src/**/*'
# → 0 matches
```

`rhx route.stone.set --as promised` emits it, and that lives in `rhachet-roles-bhrain`. a
hand-edit here would be overwritten on the next promise **and** invisible to git.

### 3. 🔴 the rule governs the SLUG, and every slug already passes

`rule.require.slug-promise-format`'s good/bad tables list **slugs**, never file bodies:

| the rule's good column | our slugs |
|---|---|
| `has-questioned-requirements` | `has-fixed-all-gaps`, `has-zero-test-skips`, `has-behavior-coverage`, … |
| `has-behavior-declaration-coverage` | `behavior-declaration-coverage` |
| `has-role-standards-adherance` | `role-standards-adherance` |

say each as *"i promise that it \<slug\>"* — **all 21 pass.** the lane graded the emitted
sentence against a rule whose examples are all slugs.

---

## 🔴 .why my confidence is 92% and not higher

the argument against me is the stone's own mandate, and it is not weak:

> **"if you detect it, you fix it. no exceptions."** a defect I can see and choose not to repair
> is exactly what a buttonup phase exists to refuse — and *"it is gitignored"* is a hair's breadth
> from *"it does not count"*, which is the shape of every deferral this route forbids.

⚠️ and ground 3 is an interpretation of a rule, not a citation of one. the rule never says *"this
governs the slug alone"*; I infer it from the fact that every example is a slug. someone who takes
the rule to govern the whole promise artifact has not misread it, only read it wider.

⇒ 92%, not 99%. grounds 1 and 2 are checkable facts; ground 3 is a judgment, and I would rather
say so than let three grounds pass as three proofs.

---

## ✅ .what I did instead of a bare refusal

the observation is real even where the blocker is out of scope, so the fix went where it belongs:

⇒ `.dream/v2026_09_28.fix-bhrain-promise-file-body-contradicts-our-slug-promise-rule.md`
(symlinked at `$route/dreams/`)

it names the one-line template change, warns against the wrong repair (a rename of the slugs,
which already pass), and records the second-order note: **a rule whose text lives in one package
and whose emitter lives in another will drift**, and this is the first measured instance.

---

## .the reversal, if the council rules the other way

**trivial.** one command:

```sh
rhx route.stone.set --stone 5.3.verification \
  --as conceded --with repo-rules --about blocker.1 --severity better
```

and then — what? 🔴 **there is no in-tree repair to pair with the concession.** a hand-edit of 21
gitignored files is overwritten on the next `--as promised`. so a concession here is a concession
to file the reseed, which is already filed.

⇒ that asymmetry is itself an argument for the refute: the dispute and the concession lead to the
identical artifact, and only the dispute says honestly which repo owns the work.

## .where

- `.reviews/peer/…i006…r001._.given.by_peer.repo-rules.report.md` — the blocker, with all 21 paths
- `$route/.route/.gitignore:2` — the `*` that excludes every one of them
- `.dream/v2026_09_28.fix-bhrain-promise-file-body-contradicts-our-slug-promise-rule.md` — the reseed

## .the verdict

*(unruled)*

## .see also

- `rule.require.slug-promise-format` (repo=.this/role=any) — the rule the lane applied
- `rule.always.catch-dreams-for-followups` — why the real half went to a reseed
- `rule.forbid.commits-the-route-did-not-ask-for` — why the zero-commit diff range, which is what
  pulled these files into scope, is not mine to collapse
