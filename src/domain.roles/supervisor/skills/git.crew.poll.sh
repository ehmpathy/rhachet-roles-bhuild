#!/usr/bin/env bash
######################################################################
# .what = poll every CREW and its TREE, in one call — the fleet glance
#
# .why  = a supervisor acts on crews, and a crew is inseparable from its
#         tree. so one sweep answers both halves:
#
#           "who is at work?"       -> which crews hold live ducts
#           "who died with work?"   -> which tree is crewless but dirty
#           "got one to fell?"      -> which tree's work has MERGED
#           "what can ship?"        -> which tree is green and mergeable
#           "who is stuck?"         -> which tree failed ci or needs a rebase
#
# .why it SUPERSEDES git.release.poll (and the git.grove.poll rename)
#         `release` is a DIMENSION, never a subject — and a poll named for
#         a dimension had to pick some other axis to derive on. it picked
#         tmux sessions, i.e. CREWS, which is a NEIGHBOUR layer, and
#         term=poll's own rule forbids exactly that:
#
#           a poll derives its own subject set, so the axis it derives ON
#           is part of its contract, and that axis must belong to the
#           subject. a set derived from a neighbour goes blind whenever
#           that neighbour does.
#
#         it went blind on 2026-08-24. a machine death killed every duct;
#         `duct.poll` returned 💥 on 26 rows and `git.crew.list` returned
#         ONE crew of fourteen — while thirteen trees sat on disk, some of
#         them with uncommitted work nobody could see.
#
# .why the subject set is TREES, and why that is EXHAUSTIVE over crews
#         the glossary fixes the dependency, and it runs one way only:
#
#           crew  ↔  tree  ↔  branch  ↔  pr
#           a tree can have no crew; a crew cannot have no tree
#
#         so enumerate TREES and you cannot miss a crew. enumerate CREWS
#         and you miss every tree whose crew died — which is the fleet's
#         most actionable state, and the one no prior instrument reported.
#
#         a tree is on DISK, so it outlives tmux, the terminal, and the
#         machine. that is what makes this sweep survive a crash.
#
# .why the name is CREW and not TREE
#         a supervisor speaks in crews (rule.require.speak-at-the-supervisor-
#         layer), and the crew is what it ACTS on — boot it, hide it, brief
#         it, fell its tree. the tree is how the crew is FOUND, never what
#         the reader came for. so `crew` names the subject and `tree` names
#         the derivation, which is the honest way round.
#
# usage:
#   rhx git.crew.poll                  # every crew ACTIVE in the last 24h, dense
#   rhx git.crew.poll --all            # every crew ever opened, full blocks
#   rhx git.crew.poll --live           # only crews with a live duct
#   rhx git.crew.poll --only rhachet   # filter on the tree slug
#   rhx git.crew.poll --star           # ONLY the ⭐ sponsored stars (funded set)
#   rhx git.crew.poll --star --stones  # how the funded stars fare, on their route
#   rhx git.crew.poll --fellable       # ONLY trees whose work merged
#   rhx git.crew.poll --healable       # ONLY trees a nudge can cure
#   rhx git.crew.poll --boxes          # + each live role's input-box state
#   rhx git.crew.poll --live --boxes   # live crews + what each role awaits
#   rhx git.crew.poll --live --stones  # THE BABYSIT TICK — + where on the route
#   rhx git.crew.poll --search 'extra usage'  # which ducts' panes hold TEXT
#   rhx git.crew.poll --help
#
# args:
#   --only      text filter on the tree slug (optional)
#   --star      scope to the ⭐ SPONSORED stars — the funded set, joined off
#               `rhx eco.priority` by tree name (its sponsored rows' .refTree).
#               the supervisor's common read is "how do the funded stars fare?",
#               and a fleet poll answers MOTION where that asks the FUNDED set
#               (rule.always.read-stars-as-sponsored-priorities,
#               define.invariant.crew.inflight-implies-sponsored). the footer
#               declares how many non-star crews it hid; drop --star to widen
#   --live      only crews that hold at least one live duct
#   --all       clear the idle prune AND the dense render — every crew, full block
#   --idle-mins minutes of stillness before a crew folds into the hidden tally
#               (default: 1440 = 24h; 0 disables the prune)
#   --fellable  print only the 👌 merged rows — the fell candidates
#   --healable  print only the 🚫 rows `git.crew.heal` has ANY cure for — a
#               `limited` crew (every rate-limit state) or a `husk`. each row
#               carries its runnable `git.crew.heal` command, so the supervisor
#               heals in bulk THROUGH the tool, never by hand off the sweep
#
#               🔴 ⚠️ this listed "a live/future cap is EXCLUDED" until
#               2026-09-16, and it had been false since 2026-09-14, when a live
#               cap became healable BY AN AUTH.SWAP. read the flag as "a cure
#               exists", never as "a nudge is safe" — heal picks the axis, and
#               only heal reads the reset clock. a supervisor who trusted the
#               old line ran a heal against a cap 37m in the future
#               (define.invariant.crew.ratelimit.healable-transient)
#   --boxes     fold each live role's INPUT-BOX state into its crew row
#   --stones    + each live role's ROUTE STONE (implies --boxes; same call)
#   --search    grep every live duct's PANE for TEXT, one call across the
#               fleet — no --boxes/--stones classifier can pre-enumerate a
#               shared, incidental condition (an account-wide quota string,
#               a crash trace), so this is the general escape hatch: a fixed-
#               string, case-insensitive search, delegated to `duct.poll`
#               rather than a hand-loop of `crew.read` per named duct
#               (rule.require.bulk-over-byhand)
#   --timeout   seconds to wait per tree before it is called ⏳ (default: 20)
#   --stall-mins  minutes of stillness before an EMPTY box reads 😴 CLONE QUIET
#                 (default: 60; needs --boxes/--stones for the motion data)
#
# .the IDLE PRUNE — why a default, and why it is DECLARED
#
#   a 29-crew fleet renders ~180 lines, and the third of it that has not moved
#   in a day is the third a supervisor never acts on. so the default hides it.
#
#   🔴 but a hidden row and an absent row read identically, which is exactly the
#      defect `rule.forbid.clipped-sweeps` names — a reader clipped this sweep
#      with `| tail` for three ticks and reported "no prompt" off a third of a
#      fleet. so the prune is legal ONLY because the render DECLARES it: the
#      footer states how many crews folded, on which ground, and the flag that
#      restores them. a silent prune would be the same defect with better
#      manners.
#
#   ⇒ that is the whole difference between a flag and a pipe: a flag can be
#     reported by the instrument, and a pipe cannot.
#
#   .what folds
#     - a crew with NO live duct   — `down` / `phantom`. no clone, no activity
#     - a crew whose every live duct has been still >= --idle-mins
#
#   .what NEVER folds, on purpose
#     - 😴 `asleep` — its grove did not answer, so its activity was never
#       measured. to prune it would assert idleness from a failed read, which
#       is the false report this instrument already carries a term for
#     - any crew with a duct that MOVED this poll, or still < --idle-mins
#     - ⚠️ any crew whose age could not be parsed — an unreadable age SHOWS.
#       the fail-safe leans to noise, never to silence
#
# .the CREW verdicts — the local half, read from tmux
#
#   😶 at work    one or more live ducts   -> the roles are named
#   💀 down       no duct, tree on disk    -> rhx git.crew.boot
#   😴 asleep     its grove did not answer -> rhx git.grove.wake <grove>
#   👻 phantom    no duct, no tree HERE    -> a felled tree's stale rows
#
#   ⚠️ `asleep` and `down` are told apart by whether we could LOOK, never by
#      what we saw — an unreached grove and a grove with no crew both answer
#      with an empty list. so `asleep` is a claim about the READ; every other
#      verdict on this axis is a claim about the crew.
#
#   ⚠️ `phantom` says HERE on purpose. every read that produces it is local,
#      so it may only be asserted of a crew that lives on this box. said of a
#      cloud crew it claimed `tree is gone` about a grove nobody asked.
#
# .the REF column — `#` is a PR, `@` is a BRANCH
#
#   ehmpathy/rhachet#488              a pr exists; 488 is its number
#   ehmpathy/rhachet@beav/fix-thing   no pr yet; this names the branch
#
#   both read `#` until 2026-08-30, so one separator carried two senses in one
#   column, told apart only by whether the right side happened to be an integer.
#   and the branch form was the FALSE one: `owner/repo#N` is github's own
#   notation for an issue or pr, so `…#beav/fix-thing` read as a pr reference
#   when no pr existed. `@` matches `pkg@version` and git's own rev syntax.
#
# .the BOX verdicts — what each live role AWAITS (only with --boxes)
#
#   🚧prompt      SOME modal is up         -> READ it, then judge
#                 (howto.review-permission-requests). usually the most
#                 actionable state a sweep can find: stopped, and nobody at
#                 that keyboard. ⚠️ but see below — it is not always a
#                 PERMISSION modal, and the other kind takes the opposite move
#   ✍️prefilled   a human typed, unsent    -> --raw check, then relay
#   👻ghost       an autocomplete ghost    -> NEVER submit; it is not a message
#   📬queued      input waits, role busy   -> it clears itself
#   empty         idle box                 -> read its STATUS LINE, then route
#                 by owner (rule.require.nudge-parked-clones)
#   shell         a plain shell, no claude -> a foreman between commands
#
# ⚠️ .a 🚧prompt is TWO states, and they take OPPOSITE moves
#   the detector keys on modal chrome ("Do you want to proceed?", "Esc to
#   cancel"), and TWO different modals wear it:
#
#     a PERMISSION modal   the harness stopped the clone on its own command
#                          -> yours to judge. approve / decline / escalate
#     a DESIGN question    the clone RAISED a question FOR THE HUMAN
#                          (an AskUserQuestion widget: numbered choices, one
#                          marked "Recommended", a "Chat about this" option)
#                          -> NOT yours. a key here answers a question the
#                          human was asked, in their name
#
#   observed 2026-08-30 on `fix-test-tempdir-leak`: a 4-option design question
#   about a `--keep` escape hatch, rendered `🚧prompt`, sat beside a genuine
#   permission modal on a peer tree that rendered the same word.
#
#   the tells that part them, in the pane BODY, never in the verdict:
#     - options with prose bodies + a "Recommended" marker  -> design question
#     - a "Chat about this" option                          -> design question
#     - a `Bash command` block + "Do you want to proceed?"   -> permission
#     - the human's OWN words above it, ANSWERED             -> they are LIVE;
#       leave it entirely (howto.review-permission-requests, step −)
#
#   ⚠️ recorded, not repaired. to split the verdict (`🚧perm` vs `🚧ask`) the
#   detector must live in `duct.poll`, which owns it — a second copy here
#   would drift, and this one carries safety (rule.require.bulk-over-byhand:
#   delegate, never duplicate). until then the drill-in read is what parts
#   them, and step 0 already demands that read.
#
# .why --boxes is the flag a BABYSIT TICK wants
#   a tick asks two questions: who is at work, and what do they await. this
#   poll answered only the first, so a supervisor had to drop to a per-duct
#   `duct.read` loop for the second — the byhand path
#   `rule.require.bulk-over-byhand` forbids. one flag answers both, in one
#   sweep, and the per-duct read is then reserved for its real job: the FULL
#   command behind a 🚧prompt, which no summary line can carry.
#
#   a 💀 down crew whose tree is ✋ dirty is the fleet's loudest row: work
#   exists, nobody is on it, and no other instrument says so
#
# .the verdicts, ordered by what a supervisor does about them
#
#   👌 merged     the pr landed          -> FELL IT (rhx git.tree.del)
#   ✋ green      open, ci pass, clean   -> "release into prod"
#   ✋ awaited    ci still runs          -> wait a tick
#   ✋ failed     ci failed              -> gh pr checks (read it; do NOT send)
#   ✋ behind     needs a rebase         -> rhx git.branch.rebase begin
#   ✋ blocked    open, ci pass, gated   -> a review or a branch rule holds it
#   ✋ draft      pr is a draft          -> the mechanic is not done
#   ✋ closed     pr closed unmerged     -> diagnose, or fell it
#   ✋ no pr      pushed, no pr opened   -> rhx git.commit.push
#   ✋ unpushed   local commits only     -> the mechanic has not pushed
#   ✋ in flight  uncommitted work only  -> a mechanic mid-route
#   🫧 no work    no commits, clean      -> naught to release
#   🌐 on grove   the tree is on a grove -> this poll reads THIS box only
#   💥 unknown    could not be read      -> diagnose
#
# ⚠️ `🌐 on grove` is a DECLINED verdict, never a judgment. every tree read
#    below is local — `__crew_tree_dir`, `git -C`, `gh pr` — so a cloud crew's
#    tree is a subject this instrument cannot see, and it says so rather than
#    render `💥 unknown — no worktree on disk` about a worktree plainly there.
#    it is NOT litter and NOT a fault; it is an honest gap, and the crew half
#    of the same row still carries a real verdict.
#
# .the GLYPHS conform to `git tree status`, and it owns them
#   that renderer speaks two glyphs — 👌 for a tree that wants naught,
#   ✋ for one that wants a move — and lets the WORD carry which move.
#   this file diverged on four concepts (merged 🪵, no pr 🚫, uncommitted
#   🏗️, and a six-way split over what it calls ✋ unmerged), which is
#   `rule.forbid.domain-term-inconsistency` at the render layer.
#
#   ⚠️ the WORD is what parts these rows, never the glyph, and that is
#   deliberate: the verdict column stays six-way so `--fellable`, the
#   tallies, and the action lines below keep every distinction they had.
#   only the severity glyph is shared, so a reader who knows one
#   renderer can read the other.
#
#   a ✋ dirty suffix on any row means the worktree carries uncommitted
#   work — which is precisely what `git.tree.del`'s safety gate refuses,
#   so a 👌 merged row that is dirty is NOT yet fellable
#
# .why it reads github rather than each foreman duct
#   `rhx git.release` is the AUTHORITATIVE answer, and it must run inside
#   the tree — so a fleet-wide read would mean a `duct.send` into eleven
#   foremen. that costs two things this read should not:
#
#     - a keystroke into a live shell. a foreman mid-command gets its
#       line prepended, and a foreman is a fleet member, so every send
#       fabricates a `🌊 changed` on the next babysit tick
#       (rule.require.pause-babysit-cron-after-idle-streak)
#     - a serial wait. eleven ducts, each read back after its command
#
#   the same facts — pr, ci, mergeability — come from `gh` read-only, in
#   parallel, with no duct touched at all. so this is the fleet GLANCE;
#   `rhx git.release` inside the tree stays the authoritative drill-in,
#   and every row names it.
#
# guarantee:
#   - READ-ONLY: never sends a key, never opens a duct, never mutates a
#     branch, never touches a pr
#   - fleet derived LIVE from tmux sessions on every run (never cached)
#   - all trees read in PARALLEL; output printed in stable sorted order
#   - a tree that fails to read is reported 💥 and never aborts the poll
#   - exit 0 = polled, 1 = malfunction, 2 = constraint
######################################################################

set -uo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/crewwork.sh"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/pollwork.sh"

TIMEOUT=20
ONLY=""
# .why these stay OPT-IN, though the babysit tick names both on every run
#   `rule.prefer.defaults-match-common-case` argues to flip them, and the tick
#   IS the dominant caller — so the flip was tried on 2026-08-30 and reverted.
#
#   the deciding reason is COST: this is already an IN-DEPTH poll. the bare call
#   spends a `gh pr list` and a git status PER TREE, over every tree on disk.
#   `--boxes` then layers a WHOLE SECOND POLL on top (it delegates to
#   `duct.poll --brief`, which reads every duct). so the extension is not a
#   cheap extra column — it is a second sweep, and a caller who wants only the
#   crew/tree half must not pay for a duct sweep it never reads.
#
#   that is exactly the case `rule.require.bulk-over-byhand`'s "default it OFF"
#   was written for, and it holds. defaults-match-common-case governs which
#   INVOCATION is easiest; it does not license a default that doubles the work.
#
#   a second cost corroborates, and it is the sharper tell:
#
#     --live on by default   suppresses every `down` row, and an ORPHAN is
#                            `down` by construction — so the loudest row in the
#                            fleet vanishes from the bare call
#     --fellable             lists MERGED trees, which are near-always down, so
#                            it returns an empty set unless it clears --live
#
#   a default that another flag must UNDO is not a default, it is a coupling.
LIVE_ONLY="false"
FELLABLE="false"
HEALABLE="false"
# .why the bare poll scopes to the ⭐ SPONSORED stars by DEFAULT
#   the fleet's default question is "how do the funded stars fare?"
#   (define.invariant.crew.inflight-implies-sponsored,
#   rule.always.read-stars-as-sponsored-priorities). so the common read IS the
#   funded read, and it needs no flag. `--all` widens to every crew, and the
#   fell/heal sweeps widen too (a tree at merge or a limited tree is often
#   unsponsored by the time it closes) — both resolved after the arg loop, so
#   the widen is order-independent. `--star` forces star scope explicitly, and
#   wins over --all/--fellable/--healable.
STAR="true"
STAR_EXPLICIT="false"
BOXES="false"
STONES="false"
SEARCH=""
# .why 60 minutes, and why the number is arguable rather than derived
#   the quiet-clone test needs a floor under "long", and there is no principled
#   value: a review lane runs 15m, and a chain of them can hold a pane still for
#   the better part of an hour without a stall. 60m clears that comfortably and
#   still caught a 167m halt on the sweep it was written for. it is a starting
#   point, exposed as a flag precisely because it will want tuning.
STALL_MINS=60
# .why 1440 (24h), and why it is a DEFAULT where --stall-mins is not
#   --stall-mins grades ONE box and prints a row; a wrong value there costs a
#   read. --idle-mins decides whether a crew RENDERS AT ALL, so a wrong value
#   there costs a blind spot. the two want opposite defaults for that reason:
#   the first is set near the work (60m), the second far past it (a full day),
#   so that only a crew nobody has touched since yesterday can fold.
ALL="false"
IDLE_MINS=1440

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill|--repo|--role) shift 2 ;;
    --only)     ONLY="${2:-}"; shift 2 ;;
    --star)     STAR_EXPLICIT="true"; shift ;;
    --timeout)  TIMEOUT="${2:-20}"; shift 2 ;;
    --live)     LIVE_ONLY="true"; shift ;;
    # 🔴 --fellable REQUIRES the pane evidence too, at EVERY scope — and the
    #   comment below this block asserted the exact opposite for a week
    #
    # .the claim that was false — paraphrased, never quoted, because the clamp
    #   at crewwork.fell.integration.test.ts [case48][t0] forbids its literal in this
    #   file: the flag stood exempt on the argument that a fell verdict is a GIT
    #   fact read per tree and touches no pane map at all. the git half is true.
    #   the fell FENCE is the half nobody checked, and it reaches two of them —
    #   `__crew_clones_idle` (crewwork.sh) takes `CREW_BOXES` and
    #   `CREW_TURNENDED` as its two arguments, and its FIRST line is
    #   `[[ -n "$boxes" ]] || return 1`.
    #
    # 🔴 .so an ungathered box map is not a degraded fence — it is a TOTAL one
    #   --all skips the `ALL != true` gate ~165 lines down, which is the only
    #   line that sets BOXES. so on `--fellable --all` the map is EMPTY, the
    #   fence fails closed on its own first line, and EVERY merged tree renders
    #   FENCED — whatever its panes say, forever, on a calm grove as surely as
    #   a loaded one.
    #
    #   measured 2026-09-18: `infrastructure.beav.feat-grove-reach-ehmpathy-demo`
    #   (merged, pr #38) rendered `🐢 FENCED — no turn-end was seen for every
    #   live clone` on FOUR consecutive ticks. its mechanic pane, captured
    #   verbatim, carries `✻ Cogitated for 5m 21s`, an empty `❯`, and
    #   `🗿 route complete 🌴🤙`; `__duct_pane_turn_ended` reads it `VERDICT=yes`
    #   — clamped at ductwork.signal.integration.test.ts [case25][t5]. the detector was
    #   never the gap, and neither was the load. the map was never gathered.
    #
    # 🔴 .and the babysit contract prescribes the broken form BY NAME
    #   `rhx git.crew.poll --all --fellable` is what the tick runs, and
    #   rule.always.poll-the-fell-and-heal-sets forbids the hand-copied fallback
    #   that would have exposed it. so the one call a supervisor is REQUIRED to
    #   make is the one call that can never name a fellable tree.
    #
    # ⚠️ this is the defect the --healable block below already names in its own
    #   words — "the instrument picked its own EVIDENCE set" — committed four
    #   lines under itself, in the very comment that exempts this flag
    #   (rule.forbid.remedies-that-mimic-the-defect).
    #
    # ⚠️ .no new cost — __crew_gather_boxes sweeps the FULL duct set whatever the
    #   scope, so `--fellable --all` now costs what bare `--fellable` cost. and
    #   STONES stays FALSE: no fell arm reads a stone, so that one is genuinely
    #   a sweep this flag would not read.
    --fellable) FELLABLE="true"; BOXES="true"; shift ;;
    # 🔴 --healable REQUIRES the pane + stone evidence, at EVERY scope
    #
    # .why it rides HERE rather than at the `ALL != true` gate ~165 lines down
    #   that gate reads `if [[ "$ALL" != "true" ]]; then BOXES="true"; STONES="true"; fi`
    #   — so the BARE poll gathers the evidence and `--all` deliberately does not.
    #   the exemption is right for the DENSE render and wrong for this flag,
    #   because three of --healable's four axes are PANE FACTS:
    #     • `husk`    — read off `mechanic:shell` / `mechanic:husk` in the box map
    #     • `limited` — read off a 429 banner or a cap line in the pane
    #     • `frozen`  — read off an ENDED turn plus a parked queued row
    #   gather none of them and every arm falls through, so the set computes
    #   EMPTY and the render states that emptiness as a fact about the fleet.
    #
    # 🔴 .measured 2026-09-17 — one fleet, two calls, seconds apart
    #     rhx git.crew.poll --healable        -> 🦫 dam fine! 1 to heal
    #                                            🧊 rhachet-roles-bhrain.beav.feat-acceptance-under-5min
    #     rhx git.crew.poll --healable --all  -> 🦫 no tree to heal right now — …
    #                                            none a husk, none frozen
    #   captured verbatim, both renders in one file:
    #   work/.test/.assets/render.poll.healable-all-loses-every-pane-axis.log
    #
    #   ⇒ `--all` is the WIDEN flag and it cut the set to zero. worse, the
    #     babysit contract AND define.invariant.crew.inflight-implies-sponsored
    #     both send the heal sweep through `--all` (a tree at closeout is often
    #     unsponsored by then) — so a supervisor who follows the contract meets
    #     the broken form every tick, and
    #     rule.always.poll-the-fell-and-heal-sets forbids the hand-copied
    #     fallback that would have exposed it.
    #
    # ⚠️ this does NOT re-open the 2026-09-04 decision at that gate. it is the
    #   SAME decision, applied to a path that `exit 0`s before the dense render
    #   ever runs. that block already names this exact shape in its own words —
    #   "gather neither and the enum finds no prompt … so every arm falls
    #   through to its optimistic tail", term=false-report + term=partial-audit,
    #   "the instrument picked its own EVIDENCE set". the repair covered the
    #   render it was written for; the DERIVED sets sit above it and were missed.
    #
    # ⚠️ .no new cost — __crew_gather_boxes sweeps the FULL duct set whatever the
    #   scope (see its call site), so `--healable --all` now costs exactly what
    #   bare `--healable` already cost. the flag buys correctness, never a
    #   second sweep.
    #
    # ⚠️ --fellable carries the SAME repair now, for the same reason — see its
    #   own block above. it once stood exempt here, on an argument that graded
    #   the GIT half of a fell verdict and never the FENCE half. that exemption
    #   cost four ticks on one merged tree.
    --healable) HEALABLE="true"; BOXES="true"; STONES="true"; shift ;;
    --boxes)    BOXES="true"; shift ;;
    # .why ONE flag undoes BOTH the prune and the density
    #   they are one decision — "show me less" — taken at two layers. two flags
    #   would let a caller land in a state nobody designed (pruned + verbose),
    #   and would make the escape hatch a pair of names you must both recall.
    --all)      ALL="true"; IDLE_MINS=0; shift ;;
    --idle-mins)
      # ⚠️ the same `shift 2` trap --stall-mins documents below: bash refuses to
      #   shift past $#, so a bare flag at the end would spin this loop forever.
      shift
      if [[ $# -gt 0 ]]; then IDLE_MINS="$1"; shift; fi
      ;;
    # .why --stones IMPLIES --boxes rather than stands beside it
    #   both are joined off ONE delegated `duct.poll --brief` call. to let
    #   --stones run without --boxes would either skip that call (and render
    #   an empty column) or make a second one — so the implication is not a
    #   courtesy, it is the only shape that costs what the caller expects.
    --stones)   STONES="true"; BOXES="true"; shift ;;
    # ⚠️ the same `shift 2` trap documented on --idle-mins / --stall-mins: a
    #   bare `--search` at the end of the args, with no value, must not spin
    #   this loop forever.
    --search)
      shift
      if [[ $# -gt 0 ]]; then SEARCH="$1"; shift; fi
      ;;
    # .why a FLAG and not env-only: the quiet-clone test has one tunable, and a
    #   knob reachable only through the environment is a knob nobody finds. it
    #   is also the only way to exercise the arm on a healthy fleet — lower it
    #   and the row must appear (rule.require.clamp-edge-cases: prove it bites).
    --stall-mins)
      # ⚠️ `shift 2` is a trap in this loop, and a silent one: bash refuses to
      #   shift past $#, returns 1, and shifts NOTHING — so a bare trailing
      #   `--stall-mins` with no value would spin `while [[ $# -gt 0 ]]` forever
      #   on a read-only sweep. shift one at a time, guarded.
      shift
      if [[ $# -gt 0 ]]; then STALL_MINS="$1"; shift; fi
      ;;
    --help|-h)
      # .why the end is FOUND, never a pinned line number
      #   this read `NR<=110` and the header grew past it, so --help
      #   silently clipped its own args list. a literal bound goes stale
      #   on the next edit and stays silent when it does — a false report
      #   about the file it lives in. stop at the header's own terminator.
      awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "$0"
      exit 0
      ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    #    a poll that drops a misspelled `--fellabel` reads as the full sweep
    #    and is a scoped one, and its verdict prints identically either way
    -*) echo "✋ git.crew.poll: unknown flag '$1'" >&2
        echo "   known: --only --star --timeout --live --all --fellable" >&2
        echo "          --stall-mins --help" >&2
        exit 2 ;;
    *) shift ;;
  esac
done

# ── decide the star scope, order-independent ─────────────────────────────────
#
# .why here and not in the loop: an explicit `--star` must WIN over `--all` /
#   `--fellable` / `--healable` regardless of the order they were typed
#   (rule.forbid.order-dependence). decide once, after every flag is read.
#
# .the rule
#   --star given        → star scope, always (the funded read, forced)
#   --all / fell / heal → fleet scope (a tree at merge or a limited tree is
#                         often unsponsored by the time it closes; the fell and
#                         heal sweeps run over the whole fleet by the invariant
#                         define.invariant.crew.inflight-implies-sponsored)
#   otherwise           → star scope (the DEFAULT: how do the funded stars fare)
if [[ "$STAR_EXPLICIT" == "true" ]]; then
  STAR="true"
elif [[ "$ALL" == "true" || "$FELLABLE" == "true" || "$HEALABLE" == "true" ]]; then
  STAR="false"
else
  STAR="true"
fi

######################################################################
# --search: grep every live duct's pane for a caller pattern, one call
######################################################################
#
# .why this branch exists, and why it runs BEFORE crew-gathering
#   `--boxes` / `--stones` are classifiers: each covers only the conditions
#   its author enumerated in advance. a SHARED, incidental condition — an
#   account-wide usage-quota string, a crash trace, a package name — is
#   never one of those, by construction. the paved answer for an
#   un-enumerated pattern over a known corpus is a grep, not a new enum
#   value, so this is a search primitive rather than another classifier.
#
# .why it DELEGATES to duct.poll rather than open a second read channel
#   plain `duct.poll` already reads every live duct's pane, fleet-scoped by
#   default, in parallel, in ONE call — the identical instrument the rest of
#   this file delegates to for box/stone data (see the --boxes section
#   below). a second pane-read path here would drift from it exactly as
#   `rule.require.bulk-over-byhand`'s delegate clause warns against.
#
# .why fixed-string (grep -F), never a regex
#   the caller's pattern is prose lifted from a pane — an error string, a
#   phrase — and prose routinely carries regex metacharacters (`.`, `(`,
#   `*`) the caller never intended as regex syntax. a literal match is the
#   pit of success; a caller who wants a real regex can still get one by
#   grepping the raw `duct.poll --role fleet` output themselves.
#
# .why this exits before the rest of the pipeline runs
#   the render below this point (dense/full crew rows, box folding, stone
#   folding) answers "what is my fleet doing", and a caller who asked
#   `--search` asked a different question — "which duct SAYS this". mixing
#   the two into one render would force every future box/stone reader to
#   parse past search noise on a plain call, and every search caller to
#   wait on machinery whose answer they did not ask for.
######################################################################
if [[ -n "$SEARCH" ]]; then
  __search_flush() {
    local addr="$1" body="$2" pat="$3"
    [[ -z "$addr" ]] && return 1
    printf '%s' "$body" | grep -qiF -- "$pat" || return 1
    echo "$addr"
    printf '%s' "$body" | grep -inF -- "$pat" | sed 's/^/     ↳ /'
  }

  # ⚠️ NO --role here: `rhx`'s OWN top-level flag of the same name intercepts
  #   `--role fleet` as "run duct.poll under a role named fleet" and errors —
  #   fleet is duct.poll's default scope regardless, so the plain call is
  #   both correct and the only form that reaches duct.poll's own parser.
  __search_raw="$(rhx duct.poll 2>/dev/null)"
  __search_addr=""
  __search_body=""
  __search_matches=0
  while IFS= read -r __search_line; do
    if [[ "$__search_line" == 🔭\ * ]]; then
      if __search_flush "$__search_addr" "$__search_body" "$SEARCH"; then
        __search_matches=$((__search_matches + 1))
      fi
      __search_addr="$__search_line"
      __search_body=""
      continue
    fi
    __search_body+="$__search_line"$'\n'
  done <<< "$__search_raw"
  if __search_flush "$__search_addr" "$__search_body" "$SEARCH"; then
    __search_matches=$((__search_matches + 1))
  fi

  echo ""
  echo "🦫 ${__search_matches} duct(s) match '${SEARCH}'"
  exit 0
fi

# 🔴 .the DENSE render's data is not optional, because its verdict is not
#   the dense row states a `crew_status`, and that verdict is derived ENTIRELY
#   from box + stone data. gather neither and the enum finds no prompt, no
#   `👋`, no `exhausted`, no plea — so every arm falls through to its
#   optimistic tail and the whole fleet renders `inflight`.
#
# .the measured case — 2026-09-04, the tick that built the enum
#   `rhx git.crew.poll --live` (no --stones) reported `18 inflight · 9 frozen`
#   over a fleet that held 5 human gates and 1 driver block. not one row was
#   wrong-looking. every row was wrong.
#
# 🔴 .why this is WORSE than the clipped sweep it resembles
#   a clip renders FEWER rows, so a careful reader can notice a tree absent.
#   this rendered EVERY row, all green. there was no tell of any kind
#   (term=false-report, and term=partial-audit: the instrument picked its own
#   subject set — here, its own EVIDENCE set — and its verdict carried no
#   trace of what it declined to read).
#
# ⇒ so the flag does not gate the data; the RENDER does. a caller who asks
#   for the dense view has asked for the evidence under it, whether or not
#   they know the flag's name (rule.prefer.defaults-match-common-case).
if [[ "$ALL" != "true" ]]; then BOXES="true"; STONES="true"; fi

command -v gh >/dev/null 2>&1 || {
  echo "✋ git.crew.poll: gh cli not found" >&2
  echo "   fix: install the github cli, then re-run" >&2
  exit 2
}

######################################################################
# the sweep, stage by stage
######################################################################
#
# .what = each stage lives in work/pollwork.<part>.sh, in this order. they
#         share one set of global maps, so the order below IS the contract:
#         a stage reads only what the stages above it wrote.
__poll_gather_crews
__poll_render_header
__poll_read_trees
__poll_render_rows
__poll_render_sweeps
__poll_render_summary
__poll_render_actions

exit 0
