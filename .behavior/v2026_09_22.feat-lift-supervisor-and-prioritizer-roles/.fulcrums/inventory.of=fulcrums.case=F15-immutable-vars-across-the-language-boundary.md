# F15 — does a TypeScript immutability rule govern a bash argument parse?

- **rework** = ✅ clean — a dispute is a note; to concede later costs one `readonly` line per variable
- **status** = 🔴 disputed a peer at i012, as a class of 11
- **confidence** = 91%

## .the fork

`arch-hazards-maintenance` raised **11 nitpicks** at i012, all citing
`rule.require.immutable-vars`, all against **bash** variable assignments across three files:

| file | variables | in this diff? |
|---|---|---|
| `supervisor/skills/git.checkout.sh:26-29` | `branch` `create` `from` `pull` | ✅ lifted |
| `behaver/skills/review.behavior.sh:57-60, 225-228` | `BEHAVIOR_NAME` `AGAINST` `INTERACTIVE` `TARGET_DIR` `BLOCKERS` `NITPICKS` `REVIEWED_COUNT` `SKIPPED_COUNT` | 🟡 **a one-line glyph fix only** |
| `prioritizer/skills/eco.seed.sh:166-168, 492` | `FOR` `ALL` `GARDENS` `AUTH` `WORDS` `INTO` `MODE` `REPOS` `UNREADABLE` | ✅ lifted |

> **(a)** dispute the class — the cited rule's mechanism does not exist in the graded language
> **(b)** concede — add `readonly x="$x"` after each parse, ~30 lines across 3 files
> **(c)** concede narrowly — only the 4 in `git.checkout.sh`, the one file fully in this diff

## .taken, and why — **(a)**, at 91%

### 1. 🔴 the rule is TypeScript, in its mechanism and in every example it gives

```
rule.require.immutable-vars  (code.prod/pitofsuccess.procedures/)
  .how      = "use const for all bindings; forbid let or var"
              "use object spreads or .clone()"  ·  "use withImmute() and .clone()"
  .examples = const updated = { ...original, status: 'complete' };
              const newInvoice = invoice.clone({ total: 1200 });
  .links    = domain-objects.withImmute
```

⇒ `const` · `let` · `var` · `.clone()` · `withImmute()` · `domain-objects`. **not one bash
construct, and not one bash example.** the rule does not merely *prefer* immutability in the
abstract — it prescribes a specific instrument, and bash has no `const`.

🟡 the reviewer half-saw this and supplied the bridge itself: *"In bash, this translates to using
`readonly`."* that translation is **the reviewer's, not the rule's**, and a rule stretched by its
own reader is a rule applied outside its scope.

### 2. 🔴 every variable named is mutated BY DESIGN, and `readonly` at declaration would break it

these are argument-parse accumulators. `create=false` becomes `create=true` when `--create` is
passed; `BLOCKERS=()` is appended to in a loop; `UNREADABLE=0` becomes `1` on a bad read.

⇒ the reviewer knows, and says *"could be made readonly **after** parsing completes."* so the
concession is not a change of declaration — it is a **second declaration per variable**, ~30 added
lines whose only effect is to forbid a mutation that no longer happens anyway. the rule's own
severity for this class is **nitpick**, and the repair costs more legibility than it buys.

### 3. 🔴 this is the SECOND time, from the SAME lane, and the first answer is on record

at **i010** this lane cited this same rule against `set -euo pipefail` — a shell **option**, not a
variable. that `.taken` recorded it as a false positive on three grounds, one being verbatim:

> *"`rule.require.immutable-vars` is a **TypeScript** rule … its vocabulary does not exist in the
> graded language."*

⚠️ and it closed with the prediction that made this file necessary:

> *"an unanswered false positive returns next round wearing the same rubric."*

⇒ 🔴 **it was answered, and it returned anyway — amplified from 1 instance to 11.** so the i010
lesson needs a correction: **an answered false positive can return too.** a `.taken` persuades a
reviewer about a *concern*; it does not retire the *rubric* that generated it. the durable record
is a fulcrum, which is why this file exists rather than a fourth paragraph in a `.taken`.

🟡 the aim did improve between rounds — i010's target was not a variable at all, i012's are — so
the lane is reading better. **the boundary it crosses is the same one.**

### 4. 🟡 two of the three files are barely in this diff, and the bind is why they appear

`review.behavior.sh` is in the diff for **one line** — the 🌿 → glyph cutover at `:372`. the lane's
bind is `--diffs since-main`, so a one-character edit pulls the whole 400-line file into scope and
its prior bash idiom reads as this lift's.

⇒ the same instrument artifact `r002`'s `nitpick.2` turned on, one round earlier: **a count is a
property of the bind before it is a property of the code.** to concede here is to rewrite a file on
`main` because a glyph moved in it.

## .the 9% counter — stated, not buried

- **`readonly` IS real bash**, and a post-parse freeze is a genuine (if verbose) hardening. option
  (b) is not absurd; it is disproportionate
- the rule's **spirit** — mutation is a hazard — travels across languages perfectly well, even
  where its letter does not. a reviewer who applies the spirit is not wrong to try
- ⇒ so the honest verdict is **the rule is cited outside its scope**, not *"the concern is silly."*
  the right repair is a **bash-specific immutability brief** that names `readonly`, `local`, and
  the parse-then-freeze pattern — authored once, applicable to all 46 entrypoints. that is a
  dream, never a fix inside a relocation stone

## 🟡 .and `nitpick.1` is disputed on a different ground entirely

not a language boundary — **the reviewer flagged code it declares compliant**, in the same
paragraph:

> *"However, this implementation actually fails loud at the end by throwing a MalfunctionError with
> all stuck directories, **so it's compliant** but warrants attention to ensure the pattern is
> understood."*

⇒ `tempDirs.delAll` is the repair this lane's own i011 `blocker.1` asked for, and the
collect-then-throw shape exists because a rethrow inside the loop abandons the rest of the sweep.
a concern whose body says *compliant* carries no defect to repair.

## .where

- `$route/.reviews/peer/…i012…r006._.given.by_peer.arch-hazards-maintenance.md` — the 12
- `$route/.reviews/peer/…i010…r006._.taken.by_self.arch-hazards-maintenance.md` — the first answer
- `.dream/v2026_09_26.author-a-bash-immutability-brief.md` — the proportionate repair

## .the verdict

_open — ruled at the fulcrum council_

---

written by human + beaver 🦫
