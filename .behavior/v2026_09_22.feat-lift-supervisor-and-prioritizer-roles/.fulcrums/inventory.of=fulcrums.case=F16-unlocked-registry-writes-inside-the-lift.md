# F16 — do the four unlocked registry read-modify-write sites get their lock primitive INSIDE this lift?

- **rework** = ✅ none — there is no call to reverse
- **status** = 🔴 **DISSOLVED at its premise, by an executable line. the sites are already locked.**
- **confidence** = 93% → **0%**

## 🔴 .the verdict first — this fulcrum should never have existed

it was written at i012 to back a dispute of `enroll-impl-arch-defects`' `blocker.2`, on the premise
that `crewwork.sh`'s `__crew_ledger_set` ships an unlocked read-modify-write and that the fix was
deferred to a dream.

**the premise is false. the fix is in the tree, and it was in the tree before this file was written.**

```sh
# src/domain.roles/supervisor/skills/work/crewwork.sh
2109  __crew_lock_path() {                      # one lock per ROW, keyed on the canonical name
2120  __crew_ledger_set() {
2129    {
2130      if ! flock 9; then
2131        echo "💥 MalfunctionError: crew.ledger.set could not lock the row for '$canon'" >&2
2140      first="$(jq -r '.bootedFirst // empty' "$file" 2>/dev/null)"   # the READ, inside the lock
2144      cat > "$file" <<EOF                                            # the WRITE, inside the lock
2153    } 9>"$lockpath"
```

⇒ the read at `:2140` and the write at `:2144` are **both** inside the lock, which the code's own
`.lock` note at `:2115-2119` argues is *stronger* than `termwork.sh`'s read-then-lock-then-re-verify
shape — available here because `bootedFirst` is read for no purpose but to carry into the write.

## .the whole class, measured 2026-09-25 against the executable lines

| site | shape | locked? |
|---|---|---|
| `crewwork.sh:2120` `__crew_ledger_set` | read-modify-write | ✅ `flock 9` `:2130` · `} 9>` `:2153` |
| `ductwork.sh:198` `__duct_register_duct` | read-modify-write | ✅ `flock 9` `:211` · `} 9>` `:229` |
| `ductwork.sh:262` `__duct_set_duct_session_id` | read-modify-write | ✅ `flock 9` `:272` · `} 9>` `:287` |
| `termwork.sh` ×5 | read-modify-write | ✅ the reference, lifted already correct |
| 🔴 `ductwork.sh:105` `__duct_register_host` | **NOT the class** | unlocked, and correctly so |

### 🔴 the fourth "site" was never in the hazard class

```sh
105  __duct_register_host() {
110    now=$(date +%s)
111    cat > "$file" <<EOF
112  {
113    "lastSeen": ${now}000
114  }
```

it **reads not one byte**. one field, unconditionally written, re-derived from the clock. so there is
no check-then-act and no lost update: two concurrent writers each write a valid `lastSeen`, and the
later value is the one the field is *for*.

⇒ counting it as a fourth site inflated a class of 3 into a class of 4, and the inflation is what
made *"one shared primitive across four sites in two files"* read as unclean. **the CLEAN answer
turned on a miscount.**

## 🔴 .so `blocker.2` was CONCEDED and HONORED — the defer never happened

the i004 `.taken` recorded it `conceded · DEFERRED WITH A RECORD`, and a later round **fixed it
anyway** and left every prose record behind:

| artifact | says | true? |
|---|---|---|
| the code | locked, read+write inside, per-row | ✅ authoritative |
| `.dream/2026_09_25.clamp-crewwork-unlocked-ledger-write.dream.md` | *"unlocked … defers"* | 🔴 stale |
| the i004 `.taken` §4 | *"CONCEDED · DEFERRED"* | 🔴 stale |
| this fulcrum, as first written | *"the disposition the defer always owed"* | 🔴 false |

🔴 **three prose artifacts agreed with each other and all three disagreed with the file.** that is the
worst possible configuration: mutual corroboration among caches, with no cache checking the source.

## 🔴 .the failure mode — `F4`'s, repeated, with the warning already on file

`F4` is this inventory's recorded instance of *a fork whose every branch assumed a fact that an
executable line refutes*. this route then wrote down the lesson twice:

- the inventory's own `F11` section — *"a dispute cannot be a bare disagreement"*
- the yield's known-facts table — **"a header is a cache … read the executable line"**
- and a standing memory: *"verify a fulcrum's premise, not its branches — low confidence means
  re-derive the fork; check the premise against an executable line"*

⇒ **i wrote three options, priced the doubt at 7%, and never opened the file.** the doubt was priced
against the wrong axis entirely: every percent of it was spent on *"is the defer justified?"* and not
one on *"is there anything left to defer?"*

⚠️ and the tell that should have fired: the reviewer cited `crewwork.sh:2091-2116` for the defect, and
`:2091` now holds the **lock helper's doc comment**. a cited line span that no longer means what the
citation says is a fix that moved the lines. ⇒ **a stale line number is evidence, not noise.**

## ✅ .what actually stands, and what it means for the stone

`blocker.2` needed no dispute: **the concession was kept.** so the residual `2/0 blockers` is not two
unfixed harms — it is **two repairs an exhausted lane has never been allowed to read**:

| concern | state |
|---|---|
| `blocker.1` — the ratchet hid `F1`'s proof | ✅ repaired — extracted to `ecoworkGain.integration.test.ts`, required gate 18 → 19 suites, 8/8 green |
| `blocker.2` — `__crew_ledger_set`'s unlocked RMW | ✅ repaired — per-row `flock`, read+write inside |

⇒ this is the case `rule.always.spend-own-levers-before-escalation` names outright: *"a reviewer that
spent its round to RAISE a blocker has none left to CONFIRM your fix."* the warranted lever is a
**budget top-up on that lane**, and its purpose is confirmation rather than another argument —
exactly the i011 → i012 move that took `arch-hazards-maintenance` from 14 blockers to 0.

## .where

- `src/domain.roles/supervisor/skills/work/crewwork.sh:2109-2153` — the lock, and the proof
- `src/domain.roles/supervisor/skills/work/ductwork.sh:105-116` — the site that was never in the class
- `$route/.reviews/peer/…i004…r011._.taken.by_self.enroll-impl-arch-defects.md` — amended
- `.dream/2026_09_25.clamp-crewwork-unlocked-ledger-write.dream.md` — retired, with a reason

## .the verdict

🔴 **dissolved — no call to rule on.** kept rather than deleted, because a fulcrum that records a
premise checked too late is worth more to the next traveller than an absent row.

---

written by human + beaver 🦫
