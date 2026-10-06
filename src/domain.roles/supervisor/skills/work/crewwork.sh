#!/usr/bin/env bash
######################################################################
# crewwork — boot, stop, show, hide, and open a CREW
#
# 🔴 .a LIB: sourced, never executed. rhachet scans `skills/` RECURSIVELY,
#     so this file is dispatchable as `rhx crewwork` — and a sourced-only
#     file run directly defines its functions, says naught, and exits 0.
#     the verbs that source it are `rhx git.crew.<boot|list|poll|…>`.
#
# .what = a **crew** is the set of clones that work ONE tree.
#         our standard crew is two roles: mechanic + foreman.
#
# .the four verbs, on two axes
#
#         a crew has two halves that are easy to confuse and must never
#         be: the WORK (tmux ducts — where a clone lives and thinks) and
#         the VIEW (kitty tabs — how a human watches it). one is
#         precious and hard to rebuild; the other is free.
#
#           axis   | turn on    | turn off
#           -------|------------|-----------
#           work   | crew.boot  | crew.stop
#           view   | crew.show  | crew.hide
#
#         so each verb has an exact inverse, and the pairs never cross:
#           crew.boot  ↔ crew.stop   — creates / kills the clones
#           crew.show  ↔ crew.hide   — opens / closes the windows
#
# .and one composite, in the safe direction only
#
#           crew.open  = crew.boot + crew.show, each a findsert
#
#         it is the front door: it ensures a crew is at work AND in
#         view without a caller who must first read which half is up.
#
#         there is deliberately NO crew.close. the off-verbs cost
#         wildly unequal amounts — hide is free, stop ends a claude
#         conversation for good — so a composite off would bundle the
#         cheap act with the irreversible one. the convenience exists
#         only where it is free.
#
# .why the split matters
#         crew.hide costs you a keystroke to undo. crew.stop ends every
#         conversation in that crew, and no flag brings one back. before
#         these were separate verbs the safe act was a FLAG on the
#         destructive one (`crew.stop --keep-ducts`) — the safety exactly
#         backwards, since the cheap act cost more to ask for than the
#         expensive one (rule.require.safe-by-default).
#
# .why  = a crew op was also a hand-run sequence of three lower verbs,
#         in an order that mattered and lived nowhere:
#
#           1. tree  — the worktree must exist, and each duct must start
#                      INSIDE it (a duct in the wrong directory resumes
#                      the wrong conversation)
#           2. duct  — the tmux session per role, findserted
#           3. term  — the kitty tab per role: the FIRST role becomes the
#                      window's base tab, each later role adds a +tab
#
#         term.open findserts a duct of its own, so a tab run before its
#         duct spawns that session in the CALLER's directory. crewwork
#         owns the order so a caller never has to.
#
# .the layers
#   clone  — one worker (a role: mechanic, foreman)
#   crew   — the set of clones on one tree      ← this file
#   tree   — one worktree = one branch = one pr
#   grove  — the machine a tree's crew runs on (local, or cloud://<name>)
#   fleet  — every crew across every tree
#
# usage:
#   crew.open --tree <slug> [--grove local|cloud://<g>] [--roles a,b] [--resume mechanic]
#   crew.boot --tree <slug> [--grove local|cloud://<g>] [--roles a,b] [--resume mechanic]
#   crew.show --tree <slug>
#   crew.hide --tree <slug>
#   crew.stop --tree <slug>
#   crew.list
#
# guarantee:
#   - idempotent: each verb finds what is already so and changes only
#     what is not
#   - every duct starts inside the tree's own worktree
#   - a tree with no worktree fail-fasts rather than opens a crew that
#     points at the wrong directory
#   - crew.boot NEVER opens a tab; crew.show and crew.hide NEVER touch
#     a duct. crew.open is the only verb that reaches both axes
#   - exit 0 = done, 1 = malfunction, 2 = constraint
######################################################################

# the roles our standard crew is made of, in order.
# the FIRST role takes the window's base tab; each later role adds a +tab.
#
# .the third seat is `reflector`, added 2026-09-07 at the wisher's ask.
#   the mechanic drives; the foreman is an empty seat (a human, or an ad-hoc
#   clone, sits in it) — and neither gives a place to look BACK at the round.
#   a reflector's duct is the place that read happens,
#   so it exists on every crew rather than on the ones somebody remembered to
#   add it to (an artifact nobody has to opt into is one nobody forgets).
#
# ⚠️ a role here is a DUCT NAME, never a launched program. crew.boot opens a
#    shell duct per name and crew.show gives each a tab; the clone that lives
#    in one is launched by git.tree.behavior. so a fleet booted before this
#    line changed has two ducts, and gains its third on the next crew.boot —
#    which is idempotent, and creates only what is absent.
#
# 🔴 .seats four and five are `reviewer.take` and `reviewer.give`
#
#   they are the local-only seats (CREWWORK_ROLES_LOCAL), so their ducts open on
#   THIS box, cwd'd into the tree's mirror dir. that is the only thing special
#   about them, and it is handled at two seams — __crew_role_host for the box,
#   __crew_role_cwd for the dir.
#
#   ⚠️ the reviewer was excluded from this list until 2026-09-11 and given a
#      verb of its own, on the claim that to boot it meant to `git.tree.sync`
#      it. the human struck that: "why would you cut the crew registration out,
#      just to arbitrarily bind sync to crew registration". a boot REGISTERS a
#      seat; a sync FILLS it. the two are separate verbs and always were
#      (rule.forbid.bind-a-costly-act-to-a-cheap-one).
#
# 🔴 .why the reviewer is TWO seats, split 2026-09-13 at the wisher's ask
#
#   one reviewer seat had to hold two acts that BOTH occupy the keyboard, and
#   neither yields it:
#
#     take — absorb what the crew did. `nvim` on the mirror, a long read that
#            holds the pane for as long as the review takes
#     give — answer it. `rhx give.feedback`, which needs a free prompt
#
#   ⇒ so a single seat forces the human to quit their editor to say a word, and
#     to re-open it — losing cursor, buffers, and their place in the diff —
#     every time. the read and the reply are concurrent by nature, and a seat
#     is a serial resource, so ONE seat can never hold both.
#
#   verbatim: "i want to be able to `rhx give.feedback` in the give tab, while i
#   nvim take in the take tab".
#
#   ⚠️ this is a VIEW-shaped want served at the WORK layer, on purpose. two tabs
#      onto one duct would share one shell and one keyboard, so they would not
#      solve it — the contention is over the PROMPT, never the window. two
#      ducts is the smallest thing that actually parts them (term=crew: the
#      axes are independent, and this is a work-axis need that merely LOOKS
#      like a view-axis one).
#
# 🔴 .the names are DOTTED, and that costs a rewrite this file now carries
#
#   `reviewer.take` / `reviewer.give` are boundary-qualified — the boundary is
#   `reviewer`, the leaf is the act (rule.require.boundary-qualified-terms). a
#   qualified pair is explicitly NOT an ambiguity with the behaver's own
#   `feedback.take` / `feedback.give`; they are four terms, not two overloaded.
#
#   ⚠️ but tmux rewrites EVERY '.' in a session name to '_', and until now only
#      the TREE half was defended against that (every tree is `repo.beav.slug`;
#      every role was one bare word). so the role now takes the same undo at
#      each of the four sites that parse a session name — see
#      __crew_duct_has_role for the full account and the measurement.
CREWWORK_ROLES_DEFAULT="${CREWWORK_ROLES_DEFAULT:-mechanic,foreman,reflector,reviewer.take,reviewer.give}"

# where worktrees live: <root>/<org>/_worktrees/<repo>.<user>.<slug>
CREWWORK_GIT_ROOT="${CREWWORK_GIT_ROOT:-$HOME/git}"

# the same root, as a string the GROVE's shell expands rather than this one.
#
# .why a second constant: CREWWORK_GIT_ROOT expands $HOME HERE, so it holds
#      /home/bert — true of this box and false of every grove, whose user is
#      `camper`. a remote lookup that interpolates it asks the grove about a
#      path that exists only on the laptop, and answers "absent" for a tree
#      that is plainly there. keeping `~` unexpanded defers the question to
#      the machine that owns the answer.
CREWWORK_GIT_ROOT_REMOTE="${CREWWORK_GIT_ROOT_REMOTE:-~/git}"

######################################################################
# internals
######################################################################

# .what = load the lower verbs this file composes — ALWAYS, never conditionally
# .why  = crewwork is a COMPOSER: it owns the order, never the mechanism.
#
#         the load is UNCONDITIONAL on purpose. an earlier revision guarded it
#         with `declare -f duct.open >/dev/null || source ...`, which read as a
#         thrifty skip and was in fact a silent downgrade: a skill runs under a
#         shell whose rc has already sourced ~/.bash_aliases.ductwork.sh, so
#         duct.open was ALREADY defined — as the older global copy — and the
#         repo's own version never loaded. the first crew.boot failed with
#         "unknown arg '--cwd'" against a lib that had supported --cwd for an
#         hour.
#
#         so: the repo's lib is the truth, and it must WIN over whatever the
#         ambient shell happened to load. that is the whole reason these live
#         beside the skills rather than in ~/.
__crew_load_peers() {
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  source "$here/ductwork.sh"
  source "$here/termwork.sh"
}
__crew_load_peers

# .what = find the worktree directory a tree slug names
# .why  = a duct MUST start inside its own tree. the two names differ:
#         tmux forbids '.' in a session name and writes '_' instead, so a
#         duct reads   declapract-typescript-ehmpathy_beav_fix-sha-pins
#         while the fs holds
#                      declapract-typescript-ehmpathy.beav.fix-sha-pins
#         so we translate '_' -> '.' and glob the org level. both forms
#         are tried, because a caller may hand us either.
__crew_tree_dir() {
  local slug="$1"
  local dotted="${slug//_/.}"
  local candidate
  for candidate in \
    "$CREWWORK_GIT_ROOT"/*/_worktrees/"$dotted" \
    "$CREWWORK_GIT_ROOT"/*/_worktrees/"$slug"; do
    if [[ -d "$candidate" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

# .what = find the worktree directory a tree slug names, ON A GROVE
# .why  = the exact sibling of __crew_tree_dir, for the one question this box
#         cannot answer. a cloud tree lives on the grove's disk, so no local
#         `-d` test can find it — but the CONVENTION is ours, and the grove's
#         own shell can expand it.
#
# ⚠️ .why it must exist at all: without a --cwd, `tmux new-session` starts the
#    pane in the ssh login dir — $HOME. so a grove crew came up in /home/camper
#    rather than on its tree, and no instrument said so: crew.boot printed its
#    ordinary `✔ 2 duct(s) up`, the poll read the crew `at work`, and every
#    command a mechanic ran landed in the wrong directory. measured on the
#    first grove crew, 2026-09-02: `pwd` -> /home/camper.
#
#    that is a `term=false-report` — exit 0, ordinary success shape, and the
#    claim "this crew is on tree X" untrue of the pane. it is the third member
#    of the same family found today (the crew-poll localhost pin, the duct.open
#    -d test): a behavior written when every tree was local, left in place when
#    trees learned to travel.
#
# .why ssh here, and why that is NOT two writers on the duct artifact
#    (rule.forbid.two-writers-on-one-artifact): ductwork owns duct SESSIONS —
#    it creates them, registers them, and tears them down. this creates none,
#    registers none, and reads no registry. it asks a path question, and the
#    worktree convention is the CREW layer's knowledge, not the duct layer's.
#    to push it down into ductwork would leak `_worktrees` into a layer whose
#    whole subject is "one addressable keyboard".
#
# .why it cannot ride in the -c instead: ductwork single-quotes the cwd into
#    its ssh string, so a glob would arrive at tmux literally and tmux does not
#    glob. the expansion has to happen in a remote SHELL, which is what this is.
__crew_tree_dir_on_grove() {
  local host="$1" slug="$2"
  local dotted="${slug//_/.}"
  local found
  # `ls -d` over both name forms, first hit wins. 2>/dev/null swallows only the
  # "no matches" noise; a genuine ssh failure still shows in an empty result
  # and is reported by the caller, which knows what it wanted the path FOR.
  #
  # ⚠️ two things here are load-bearing, and each was a defect first:
  #
  #   1. the root is CREWWORK_GIT_ROOT_REMOTE, never CREWWORK_GIT_ROOT. the
  #      latter is `$HOME/git` already expanded on THIS box, so it carried
  #      /home/bert to a grove whose user is `camper` — a local answer to a
  #      remote question, the very defect this function exists to end. the
  #      remote form keeps `~` unexpanded so the GROVE's shell resolves it.
  #
  #   2. the glob runs under `sh -c`, never the login shell. a grove's login
  #      shell is zsh, and zsh ERRORS on an unmatched glob ("no matches
  #      found") instead of leaving it literal — so a merely-absent tree
  #      printed a shell error to stderr and looked like a transport fault.
  #      sh leaves it literal, `ls -d` fails on it, and 2>/dev/null keeps the
  #      absent case quiet, which is what "absent" should sound like.
  #
  #   3. `-n`. ssh reads stdin by default to forward it to the remote command,
  #      so an ssh called from inside a `while read` loop EATS that loop's own
  #      input and the loop ends one iteration in. this function is not in such
  #      a loop today; the flag is here because whether it is safe would then
  #      be a property of every CALLER, and a rule with N readers is a rule
  #      that drifts. full account at __duct_list_host_sessions in ductwork.sh,
  #      where the same defect cost a fleet report. clamped by work.surface.
  local root="${CREWWORK_GIT_ROOT_REMOTE:-~/git}"
  found=$(ssh -n "$host" "sh -c \"ls -d $root/*/_worktrees/$dotted $root/*/_worktrees/$slug 2>/dev/null | head -1\"") || return 1
  [[ -n "$found" ]] || return 1
  printf '%s' "$found"
}

# .what = split a --grove value into a host ('' = local)
# .why  = one flag, two shapes: `local` and `cloud://<name>`. the empty
#         host is the canonical "this machine" form a duct uri already
#         uses (duct:///<tree>/<role>), so local stays the zero value.
__crew_grove_host() {
  local grove="${1:-local}"
  case "$grove" in
    local|"") printf '' ;;
    cloud://*) printf '%s' "${grove#cloud://}" ;;
    *)
      echo "✋ crew: --grove must be 'local' or 'cloud://<name>' (got '$grove')" >&2
      return 2
      ;;
  esac
}

# ── is a `feat` really a feat? ────────────────────────────────────────
#
# 🔴 .measured 2026-09-16, and it is the whole reason this gate exists.
#   `beav/feat-acceptance-under-5min` sprouted as a FEAT and not one
#   instrument said a word. it makes the acceptance suite finish faster. it
#   adds no capability any human can ask for — the suite did the same thing
#   before, slower. that is a `fix`, and the tool took `feat` on the caller's
#   say-so.
#
# ⚠️ .the asymmetry that makes the gate worth its friction
#   the two halves do NOT cost the same to get wrong:
#
#     a fix mislabelled feat   the changelog grows a feature nobody can use,
#                              release-please cuts a MINOR for a speedup, and
#                              a reader scanning `feat:` for what is new reads
#                              a lie. the repair is a rewritten history
#     a feat mislabelled fix   the changelog under-sells one entry. the repair
#                              is one line, whenever someone notices
#
#   ⇒ so the gate is one-sided ON PURPOSE. `fix` is the default and passes
#     silently; `feat` is the claim, and a claim owes its reason.
#
# .the shape is the extant `--size-why` toll, and deliberately so: a non-nano
#   --size fails fast unless it carries --size-why, and the reason then rides
#   in the VISIBLE command where a human can veto it before the tree exists
#   (rule.require.confirm-behavior-size-above-nano). same lever, second axis.
#
# .what = read the level out of a branch name — `feat`, `fix`, or '' if neither
# .why  = the convention is `beav/<fix|feat>-<slug>`, so the level is the
#         segment after the LAST `/`, up to the first `-`. a name that is
#         neither (a human's `bert/case-refund-appeal`) yields '' and is never
#         gated — this rule governs the fix/feat vocabulary, not every branch.
__crew_branch_level() {
  local tail="${1##*/}"
  case "$tail" in
    feat-*) printf 'feat' ;;
    fix-*) printf 'fix' ;;
    *) printf '' ;;
  esac
}

# .what = refuse a `feat` branch that carries no --feat-why
# .why  = see above. exit 2 = ConstraintError — the CALLER must fix it
#         (rule.require.exit-code-semantics), and the error names the two
#         ways out rather than merely the refusal
#         (rule.require.errors-name-the-fix).
__crew_guard_feat_level() {
  local name="$1"
  local why="${2:-}"

  [[ "$(__crew_branch_level "$name")" == 'feat' ]] || return 0
  [[ -z "$why" ]] || return 0

  local slug="${name##*/}"
  slug="${slug#feat-}"

  echo "✋ '$name' claims a FEAT — and feat is the rarer half." >&2
  echo "" >&2
  echo "   the test: does this add a capability a human can ASK FOR that did" >&2
  echo "   not exist before? if it merely makes an extant one work right —" >&2
  echo "   faster, correcter, safer, cheaper — it is a fix." >&2
  echo "" >&2
  echo "     a speedup is a fix.      a defect repair is a fix." >&2
  echo "     a refactor is a fix.     a test added is a fix." >&2
  echo "     a rename is a fix.       a dep upgrade is a fix." >&2
  echo "" >&2
  echo "   so re-run with ONE of:" >&2
  echo "     --name beav/fix-$slug" >&2
  echo "     --name $name --feat-why '<the capability this ADDS, in one line>'" >&2
  echo "" >&2
  echo "   the reason rides in the visible command and into the boot render," >&2
  echo "   so a human can veto the claim before the tree exists." >&2
  echo "   see rule.require.justify-a-feat-classification." >&2
  return 2
}

# ── which groves may carry a crew ─────────────────────────────────────
#
# 🔴 .measured 2026-09-07, and it cost a boot + a fell.
#   the forest holds two groves. one is a WORK grove; the other is tagged
#   `deletable` in ec2 — the LAB, kept for experiments and thrown away. a
#   supervisor read `git.grove.saturation`, found the work grove 🔴 on its ram
#   life row, took the rule's own rung 3 (`sprout onto a different grove`), and
#   sprouted onto the lab. every instrument agreed: the lab was reachable,
#   idle, and 🟢 on both axes. NOT ONE of them said `do not boot here`.
#
#   ⇒ the constraint was real, deterministic, and held in a human's head. that
#     is the definition of a gap in the tool (rule.always.entool-the-skills-
#     you-touch): a rule with one reader is a rule that drifts.
#
# .the authority, in order
#   1. the grove's OWN marker — `~/.grove/purpose`, one word. the box is what
#      the ec2 tag describes, so the box is the right party to answer
#   2. this list, as the stopgap while no grove carries a marker
#   3. neither ⇒ REFUSE. a grove of unknown purpose is exactly the case that
#      cost the boot, so the default is closed rather than open
#
# ⚠️ .why the list is a STOPGAP and not the design
#   the grove slug is REMINTED on every rebuild — `grove-sandpine-v20260811` ->
#   `grove-sandpine-v20260901` (rule.always.sprout-on-a-grove-never-local). so a
#   slug hardcoded here goes stale the next time the forest is rebuilt, and it
#   goes stale SILENTLY: the new work grove reads `unknown` and is refused,
#   which at least fails closed, and the old lab slug lingers as a lie.
#
#   ⇒ the durable fix is upstream, in whoever provisions the box
#     (`sandpine/infrastructure`): write `~/.grove/purpose` at provision time, or
#     enable `InstanceMetadataTags` so the tag itself is readable from IMDS.
#     measured on the lab grove: `/latest/meta-data/tags/instance/` returns 404
#     today, while `/instance-id` answers — so the option is simply off.
#
# ⚠️ .why the default is EMPTY
#   this role ships in a published package. a default that names one org's
#   grove would mark that grove bootable in every consumer's fleet. so the list
#   is the consumer's to declare — `export CREWWORK_GROVES_BOOTABLE=a,b` — and
#   an undeclared list leaves only the marker, which still fails closed.
CREWWORK_GROVES_BOOTABLE="${CREWWORK_GROVES_BOOTABLE:-}"

# .what = what is this grove FOR — `work`, `lab`, or `unknown`
# .why  = one read, so every caller asks the same question the same way
__crew_grove_purpose() {
  local host="$1"

  # local is always bootable — it is this machine, and nobody deletes it
  if [[ -z "$host" ]]; then
    printf 'work'
    return 0
  fi

  # 0. the seam. a test fabricates its grove, so it must be able to declare
  #    that grove's purpose without a real box to ssh to. same shape as
  #    CREWWORK_DIR and FAKE_GROVE_TREE_DIR — one env, and the gate is
  #    exercised in both directions rather than skipped.
  if [[ -n "${CREWWORK_GROVE_PURPOSE:-}" ]]; then
    printf '%s' "$CREWWORK_GROVE_PURPOSE"
    return 0
  fi

  # 1. the grove's own marker wins, when it carries one
  #
  # ⚠️ bounded and non-interactive on purpose. this call sits in front of every
  #    sprout, so an unreachable or asleep grove must cost seconds rather than
  #    a hung prompt — and its failure must fall through to the list below,
  #    never abort the caller.
  local marked=""
  marked="$(ssh -n -o BatchMode=yes -o ConnectTimeout=5 "$host" \
    "sh -c 'cat ~/.grove/purpose 2>/dev/null | head -1'" 2>/dev/null)" || marked=""
  marked="${marked//[[:space:]]/}"
  if [[ -n "$marked" ]]; then
    printf '%s' "$marked"
    return 0
  fi

  # 2. the declared list, while no grove carries a marker
  case ",${CREWWORK_GROVES_BOOTABLE}," in
    *",$host,"*) printf 'work' ;;
    *) printf 'unknown' ;;
  esac
}

# .what = refuse a crew boot onto a grove that is not a work grove
# .why  = the gate belongs BELOW every tree verb, so no caller can forget it.
#         git.tree.duct is the one choke point that git.tree.behavior and
#         git.tree.achievement both delegate to; crew.boot is the other opener.
__crew_grove_assert_bootable() {
  local host="$1"
  local grove="${2:-cloud://$1}"
  local purpose
  purpose="$(__crew_grove_purpose "$host")"

  if [[ "$purpose" == "work" ]]; then
    return 0
  fi

  echo "" >&2
  echo "✋ $grove is not a work grove — refused" >&2
  echo "   ├─ purpose: $purpose" >&2
  if [[ "$purpose" == "unknown" ]]; then
    echo "   ├─ why: it carries no ~/.grove/purpose marker and is absent from" >&2
    echo "   │       CREWWORK_GROVES_BOOTABLE. an unknown grove fails CLOSED" >&2
  else
    echo "   ├─ why: a lab grove is tagged deletable in ec2 — it is thrown away," >&2
    echo "   │       so a crew booted there loses its worktree with the box" >&2
  fi
  echo "   ├─ bootable today: ${CREWWORK_GROVES_BOOTABLE:-(none declared — export CREWWORK_GROVES_BOOTABLE=<grove>,…)}" >&2
  echo "   └─ if this grove IS a work grove, mark it at the source:" >&2
  echo "      rhx git.grove.send $host --what 'mkdir -p ~/.grove && echo work | tee ~/.grove/purpose'" >&2
  return 2
}

# .what = the UNREACHED caveat that must ride an ACTIONABLE-SET verdict line
#
# 🔴 .why a verdict is the one line that MUST carry it, header or no header
#
#   `rhx git.crew.poll --fellable` closed with a flat
#
#     🦫 no tree to fell — 39 polled, none merged
#
#   and on that view it is the LAST line a reader meets — on the empty arm,
#   very nearly the ONLY line. it reads as a claim about the WORLD. it is a
#   claim about the groves that ANSWERED. a merged tree on a grove we could
#   not ask is invisible to it, and the line carries no trace of the failed
#   read: term=partial-audit with a confident face.
#
#   ⚠️ the sweep header DOES name the unreached groves — and it prints ABOVE
#      the report. a reader who scrolls to the answer meets the verdict
#      without it, so the header is no repair. the count must ride the
#      VERDICT (rule.forbid.clipped-sweeps: a hidden count is declared,
#      never silent).
#
#   measured 2026-09-14 with SIX groves unreached, and again 2026-09-15 with
#   four — PERMANENT while any grove sleeps, never intermittent.
#
# .how = it takes the COUNT as an argument rather than a read of the caller's
#        `HOSTS_UNREACHED`. that keeps this lib free of a caller's globals and
#        makes the render clampable with no live fleet within reach.
#
# usage: echo "🦫 no tree to fell — $ROWS polled, none merged$(__crew_unreached_caveat "$n")"
# 🔴 .why it takes TWO counts, and names them apart
#
#   `UNREACHED` once carried both populations under one word: a grove that is
#   registered and did not answer, and a grove the forest no longer holds. the
#   two are indistinguishable from a failed session list, and they take
#   OPPOSITE cures — a wake repairs the first and exits 2 on the second.
#
#   measured 2026-09-16: the header was parted and this footer was not, so one
#   report carried `⚠️  4 grove(s) UNREACHED` beneath a header that had just
#   named 2 UNREACHED and 2 RETIRED. two counts of one set, in one render
#   (`rule.require.enumerate-before-you-name`, the tenth instance).
#
# ⚠️ the retired count is OPTIONAL, so every extant caller reads as it always
#    did: a one-arg call names the wakeable population and nought else, which
#    is exactly what it named before.
__crew_unreached_caveat() {
  local count="${1:-0}" retired="${2:-0}"
  # ⚠️ SILENT at zero, on purpose. a caveat that prints on a complete sweep is
  #    noise on every healthy tick, and noise is what trains a reader to skip
  #    the line — the same decay a permanently red suite causes.
  (( count > 0 )) && printf ' · ⚠️  %s grove(s) UNREACHED' "$count"
  (( retired > 0 )) && printf ' · ⚠️  %s grove(s) RETIRED' "$retired"
  return 0
}

# .what = the guidance line that pairs with the caveat above
#
# 🔴 .why a caveat alone is only half the tool's job
#
#   a tool must GUIDE, never merely classify
#   (rule.require.poll-recommends-every-cure-heal-has). the caveat says the
#   verdict is partial; this says what that costs the reader and hands over
#   the one runnable command that repairs it.
#
# .how = the grove name is the caller's FIRST unreached host, since a wake is
#        per-grove and one name is a runnable command where a list is not.
#        it falls back to the `<grove>` placeholder the sweep already uses
#        when the caller knows no name.
#
# 🔴 .why the retired half gets its OWN line, and never the wake
#
#    the wake is the whole payload of this guide, and it is precisely what a
#    retired grove cannot use. to name one there is worse than silence: the
#    reader runs it, meets `not registered`, exit 2, and learns to distrust
#    the guide rather than the row (`rule.require.errors-name-the-fix` — a
#    fix that cannot run is not a fix).
#
#    ⚠️ and the grove NAME this guide prints is the caller's first WAKEABLE
#       host, never its first unreached one. a fused `[0]` could name a
#       retired grove and hand over a command that exits 2 by construction.
__crew_unreached_guide() {
  local count="${1:-0}" grove="${2:-<grove>}" retired="${3:-0}"
  (( count > 0 )) && echo "   └─ 😴 a tree on an unreached grove is INVISIBLE to this verdict — rhx git.grove.wake $grove"
  (( retired > 0 )) && echo "   └─ 🪦 a tree on a RETIRED grove is invisible too, and no wake reaches it — the grove is gone — rhx git.grove.list"
  return 0
}

# .what = is EVERY live clone on this crew provably between turns and idle?
#         exit 0 = idle · exit 1 = at work, or we could not prove otherwise.
#
# 🔴 .why = `--fellable` fenced a merged tree on `a clone EXISTS`, and named
#   that fence `at work on real work, right now`. the two are not the same
#   claim, and only the first was ever tested.
#
#   the fence reads `crew_state == "at work" && ! cloneless`, which is
#   satisfied by any live claude session — a clone that delivered its final
#   report twelve minutes ago and sits at an empty box satisfies it too. so
#   the render `merged and clean, but a clone still holds the pane — wait for
#   it to finish` names a wait THAT NEVER ENDS. the refusal is permanent and
#   it reads as temporary, so the tree is never closed out.
#
#   measured 2026-09-17: `rhachet-brains-fireworksai.beav.fix-prompt-cache-
#   affinity` carried that line for three consecutive ticks over a mechanic
#   idle on `✻ Brewed for 12m 18s`. a human read the pane and asked
#   "fellable?" — the tool would never have said so.
#
# 🔴 .the discriminator was ALREADY DERIVED, one file over
#   `CREW_TURNENDED` is filed per role by `__crew_record_turnended`, and its
#   own comment at the join site reads "it refutes exactly two `inflight`
#   claims". the fell fence is a THIRD, and it never reached for it.
#   ⇒ `rule.require.enumerate-before-you-name`: the fence enumerates LIVE
#     CLONES where the set it meant is CLONES AT WORK. same shape as the
#     ghost fencer, whose discriminator also sat declared in its own file.
#
# 🔴 .it FAILS CLOSED, and that is most of what this function is
#   the incident the fence was built for is real — a mechanic 2m42s into
#   `git.release --into prod --mode apply --watch` on a tree github had
#   already merged. a fell there kills a prod release in flight. so `idle` is
#   asserted only where EVERY live pane proves it:
#
#     a foreman            skipped — a bare shell by design, it carries no
#                          vote either way (the orphan arm takes the same
#                          exemption, for the same reason)
#     a `shell` box        skipped — no clone in this pane to be mid-turn
#     box != `empty`       FENCED. a modal is a decision owed, a queue is a
#                          message no turn will drain, an unread box is a
#                          failed read. each names a sharper cure than a fell
#     no turnended entry   FENCED. this is the mid-turn case, and the whole
#                          reason the fence exists
#     no live clone at all FENCED. the caller already routes a cloneless crew
#                          through `crew_cloneless`; this must not become a
#                          second, looser path to the same act
#
# .how = it takes both maps as ARGUMENTS rather than a read of the caller's
#        globals — the same shape `__crew_unreached_caveat` uses, and what
#        makes it clampable with no live fleet in reach.
#
# usage: __crew_clones_idle "$__boxes_s" "${CREW_TURNENDED[$(__crew_canon "$tree")]:-}"
__crew_clones_idle() {
  local boxes="${1:-}" turnended="${2:-}" rb role box live=""
  [[ -n "$boxes" ]] || return 1
  for rb in $boxes; do
    role="${rb%%:*}"
    box="${rb#*:}"
    [[ "$role" == "foreman" ]] && continue
    [[ "$box" == "shell" ]] && continue
    live=1
    [[ "$box" == "empty" ]] || return 1
    # ⚠️ NEWLINE-ANCHORED. a bare `*"${role}="*` would let `reviewer` match
    #    the `reviewer.give=` line and read a peer's ended turn as its own.
    case $'\n'"$turnended" in
      *$'\n'"${role}="*) ;;
      *) return 1 ;;
    esac
  done
  [[ -n "$live" ]] || return 1
  return 0
}

# .what = classify an `rhx eco.priority get --output json` body, for the star scope
#
#   echoes exactly one of three words:
#     unreadable    no json line at all — the render produced none
#     truncated     a body that STARTS with `{` and does not PARSE
#     rows=<n>      a parsed body, and its row count
#
# 🔴 .why the middle one exists, and why it must be tested BEFORE the count
#
#   a TRUNCATED body still begins with `{`, so an `^{` grep passes it and the
#   unreadable branch never fires. then every jq below it dies silently under
#   `2>/dev/null` — and `.priorities | length` is one of them, so the count
#   reads EMPTY rather than a number.
#
#   ⇒ so a `rows > 0` precondition excludes the exact case it was written to
#     catch. **parse first, THEN count.** where a zero and a failure are
#     indistinguishable, the guard must test the FAILURE, never the zero.
#
# 🔴 .the harm, which is why its caller halts rather than warns
#   with jq dead the sponsored set reads empty, so every funded star is
#   re-classified an unsponsored INFLIGHT anomaly — and each anomaly row emits
#   a RUNNABLE `rhx git.crew.fell --tree <t>`. a truncated read hands the
#   supervisor a list of commands to fell FUNDED work, with no tell that the
#   verdict is wrong (`term=false-report`).
#
# .the measured cause, recorded so the next reader does not re-derive it
#   the cut lands at exactly 65536 bytes — 64 KiB, the linux pipe buffer. two
#   independent truncations on the same power of two is no race; it is an
#   unchecked short `write()` to a pipe, the producer gone before its drain.
#   ⇒ a truncation at a power of two is a TRANSPORT defect, never a data one.
#   the store reads `count: 45` correctly before, between, and after, so it is
#   innocent. the write half is seeded at `ehmpathy/rhachet#535` (foreign).
#
# .how = it takes the BODY as an argument rather than a run of `rhx` itself, so
#        the classification is clampable against a captured fixture with no
#        PATH stub, no live store, and no fleet within reach. the caller owns
#        the halt; this owns only the verdict (the detector/threshold split).
__crew_eco_star_verdict() {
  local body="${1:-}"
  [[ -n "$body" ]] || { printf 'unreadable\n'; return 0; }
  local rows
  rows="$(printf '%s' "$body" | jq -r '.priorities | length' 2>/dev/null)"
  [[ -n "$rows" ]] || { printf 'truncated\n'; return 0; }
  printf 'rows=%s\n' "$rows"
}

# .what = read the `rhx eco.priority get --output json` body, whole
#
#   echoes the one json line of the render, or naught if there is none. every
#   caller that needs the sponsored set reaches THROUGH this, never through a
#   pipe of its own.
#
# 🔴 .why a FILE and not a pipe — this is the CURE for the 64 KiB cut, and it
#    is ours to make
#
#   the verdict above CLASSIFIES a truncated body. this stops the body from
#   ever being cut, and the whole difference is one redirect:
#
#     👎  $(rhx eco.priority get --output json | grep -m1 '^{')
#     👍  rhx eco.priority get --output json >"$f"; grep -m1 '^{' "$f"
#
#   node's stdout is ASYNCHRONOUS when fd 1 is a pipe and SYNCHRONOUS when it
#   is a regular file. so a producer that writes past the 64 KiB pipe buffer
#   and then exits loses the remainder through a pipe — and loses naught
#   through a file, because that write completed before the exit returned.
#
#   ⚠️ the READER's drain speed decides whether it fires, which is why it
#     worsens under grove load and why an eager reader hides it. `grep -m1` is
#     a slow reader bound by the scheduler: on a busy box the producer's
#     remainder is still queued when it exits.
#
# .measured 2026-09-16, 8 reads per shape, on a 688%-cpu grove:
#     pipe-to-grep    70441 · 70441 · 70441 · 🔴 65537 · 70441 · 70441 · 70441 · 70441
#     file-then-grep  70441 × 8
#   ⇒ 1 of 8 cut at the pipe buffer; 0 of 8 through a file.
#
#   ⚠️ a node `spawnSync(stdio:'pipe')` probe does NOT reproduce it — the parent
#     drains eagerly, so no remainder is ever left at exit. the probe must run
#     the shape the CALLER runs, or it proves the wrong claim.
#
# 🟡 .what this does NOT do — the WRITE half is still owed, and still foreign.
#   `ehmpathy/rhachet#535` must await the drain before it exits, because every
#   OTHER consumer of that render still reads through a pipe and still inherits
#   the cut. this cures the poll; it does not cure the producer.
__crew_eco_json_read() {
  local file
  file="$(mktemp)" || return 1
  rhx eco.priority get --output json >"$file" 2>/dev/null
  grep -m1 '^{' "$file"
  rm -f "$file"
}

# .what = the ON-GROVE caveat that must ride a FELL-set verdict line
#
# 🔴 .why it is a SECOND caveat rather than a wider form of the unreached one
#
#   they name two different omissions, and a reader who conflates them draws
#   the wrong conclusion about the fleet:
#
#     UNREACHED  the grove did not ANSWER. a wake repairs it, and the caveat
#                above hands over that runnable wake.
#     ON GROVE   the tree's release read did not ANSWER. ⚠️ this description
#                was stale until 2026-09-18: it read "the grove answered
#                fine … the TREE half is local by construction … the
#                instrument does not exist yet". every clause of that was
#                retired when `__poll_tree_facts_on_grove` landed
#                2026-09-17 — the grove arm now sshs, so this bucket is
#                the FAILURE path, not a scope declined by design.
#
#   ⇒ so a tree lands here when its ssh came back empty: a saturated grove,
#     a dropped tunnel, an asleep box, a worktree the glob missed. it is
#     transient, and a re-run often settles it.
#
#   .measured 2026-09-18 — two `--all --fellable` runs minutes apart, grove
#   at runq 13: 9 ON GROVE with the fell set EMPTY, then 6 ON GROVE with a
#   merged tree named. same fleet, same tree, opposite verdicts.
#
#   .measured 2026-09-16: `svc-reservations.beav.feat-rec-waitlist-capture`
#   shipped to production — PR #355 merged 07:12:14Z, release-please cut
#   v0.74.0, prod deploy green — and the very same tick rendered
#
#     🦫 no tree to fell — 40 polled, none merged · ⚠️  4 grove(s) UNREACHED
#
#   the unreached caveat DID ride that line, and it named the wrong omission.
#   all six sponsored crews sit on groves that answered, so the sentence
#   "none merged" was a claim about the world derived from the trees on THIS
#   box alone: `term=partial-audit` with a confident face, one caveat richer
#   than the last time and still silent about the subject set it dropped.
#
# .why it carries NO runnable guide, unlike its peer
#   `rule.require.poll-recommends-every-cure-heal-has` asks a tool to
#   recommend the cure it HOLDS. this one holds none — the cure is a
#   grove-side `git status` + `gh pr` per tree, an instrument that is owed
#   and not yet built. to invent a command here would fare worse than
#   silence. so the caveat names the count, says the read is owed, and stops.
#
# .how = it takes the COUNT as an argument, exactly as its peer does, so the
#        render is clampable with no live fleet within reach.
#
# usage: echo "🦫 no tree to fell — $ROWS polled, none merged$(__crew_ongrove_caveat "$n")"
__crew_ongrove_caveat() {
  local count="${1:-0}"
  # ⚠️ SILENT at zero, on purpose — the same reason its peer is: a caveat on
  #    an all-local fleet is noise on every tick, and noise trains a reader
  #    to skip the line.
  (( count > 0 )) || return 0
  printf ' · ⚠️  %s tree(s) ON GROVE — release state NOT read' "$count"
}

# .what = the REACH clause inside the on-grove blind-spot guide — the half of
#         that sentence which speaks about the BOX, rather than about the trees.
#
# 🔴 .why it is DERIVED and not prose — the fifth false reason, 2026-09-20
#
#   the clause read, unconditionally:
#
#     ⚠️ the GROVE is up: it answers the crew half of this very poll, so do
#        NOT halt a sprout on this line.
#
#   it was added to cure the FOURTH false reason on this line, and it is true
#   in the common case. but it was asserted on EVERY run, and one run inverts
#   it. measured, in a single `--fellable` report:
#
#     ├─ ⚠️  UNREACHED: grove-sandpine-v20260901.ground … (4 groves)
#     🦫 no tree to fell — 34 of 38 read, none merged · ⚠️ 4 tree(s) ON GROVE
#        └─ 🌐 … ⚠️ the GROVE is up: it answers the crew half of this very
#           poll, so do NOT halt a sprout on this line.
#
#   the header and the guide contradict each other FOUR LINES apart. the crew
#   half did answer — off the LEDGER, with `still 3255m` clocks that are the
#   tell no pane was read. `git.grove.list` then measured the tunnel leg bound
#   with no answer on it.
#
# 🔴 .the harm is a DECISION, never the words. "do NOT halt a sprout on this
#   line" is an instruction the babysit tick keys on, and a halt is exactly
#   what an unreached grove warrants. so the one run where the clause is false
#   is the one run where a reader acts on it — `term=false-report`, with its
#   own refutation already printed above it in the same render.
#
# 🟡 .what is NOT changed. the reachable case keeps its clause verbatim: it is
#   true there and it earns its place. and this says naught about the CAUSE of
#   the unread set, which stays unmeasured — to borrow a cause here would
#   repeat the fourth reason this line already retired.
#
# .how = it takes the UNREACHED COUNT, exactly as its peers take a count, so
#        the render is clampable with no live fleet within reach.
#
# usage: echo "   └─ 🌐 $n tree(s) … empty.$(__crew_ongrove_reach_clause "$UNREACHED_N") what failed is …"
__crew_ongrove_reach_clause() {
  local unreached="${1:-0}"
  if (( unreached > 0 )); then
    printf ' 🔴 but %s grove(s) are UNREACHED this run, so these reads had no box to answer them — and the crew half of this very poll answered off the LEDGER, never off a pane. a halt IS warranted here, and the GROVE is its subject, never these trees.' "$unreached"
    return 0
  fi
  printf ' ⚠️ the GROVE is up: it answers the crew half of this very poll, so do NOT halt a sprout on this line.'
}

# .what = the SCOPE PHRASE inside the empty-fell verdict — the count that
#         sentence quotes, before any caveat is appended beside it.
#
# 🔴 .why a phrase, when `__crew_ongrove_caveat` already rides that line
#
#   the caveat and the headline are two clauses of one sentence, and they
#   disagreed. the caveat was added and was correct; the headline it rode
#   beside kept its original claim:
#
#     🦫 no tree to fell — 41 polled, none merged · ⚠️  25 tree(s) ON GROVE …
#
#   "41 polled, none merged" asserts a RELEASE verdict over 41 trees while 25
#   of them were never read for one. the caveat then disclaims, downstream in
#   the same line, what the first clause already asserted — and a reader who
#   keys on the count meets the assertion first.
#
#   ⇒ a caveat cannot repair a false headline. it can only sit next to one.
#     so the count itself must be scope-honest, and this is where that happens.
#
# 🔴 .the harm is a DECISION, and it was measured on a STALLED grove
#
#   the babysit tick contract keys on this exact verdict:
#
#     "on a genuine stall … fell what `git.crew.poll --fellable` names;
#      0 fellable on a stalled grove is a PROVISION decision for the human"
#
#   so an empty fell set is the input that escalates a spend. .measured
#   2026-09-16, grove-sandpine-v20260901 at load 7.17/4, idle 0%, runq 6,
#   stall 47.74%@10s: this view rendered `41 polled, none merged` while
#   `svc-reservations.beav.feat-rec-waitlist-capture` held PR #355, MERGED
#   07:12:14Z — verified by hand that same tick. a real fell was available,
#   the render said there was none, and the contract's next rung is a
#   provision ask. the defect would have bought hardware to relieve a grove
#   that already held a free slot.
#
# ⚠️ .this is NOT the owed instrument, and must not be read as one
#   the release read for a grove tree needs org/repo/branch, and for a grove
#   tree those are derivable only from the slug's dots — which
#   `git.crew.poll.sh` forbids by name ("a claim about a NAME rather than a
#   read of the subject"). that instrument stays owed. what is cured here is
#   the SENTENCE: a verdict may not quote a denominator it did not read.
#
# .how = it takes both COUNTS as arguments, exactly as its peer takes one, so
#        the render is clampable with no live fleet within reach.
#
# usage: echo "🦫 no tree to fell — $(__crew_fell_scope_phrase "$ROWS" "$n")"
__crew_fell_scope_phrase() {
  local rows="${1:-0}" ongrove="${2:-0}"
  # ⚠️ PLAIN at zero, on purpose — an all-local sweep genuinely read every
  #    tree, so "41 of 41 read" there is noise, and noise is what trains a
  #    reader to skip the count. the honest phrase is the short one.
  (( ongrove > 0 )) || { printf '%s polled, none merged' "$rows"; return 0; }
  printf '%s of %s read, none merged' "$(( rows - ongrove ))" "$rows"
}

# .what = the roles whose duct lives on THIS box, whatever grove the tree is on
#
# 🔴 .why a role can override its crew's host at all
#
#   most seats follow the work axis: the crew's ducts open on the box the ledger
#   names, because that is where the code is and where the clone runs. the
#   REVIEWER seats invert it — their work IS THE HUMAN'S READ, and the human is
#   not on the grove. so their ducts open here, cwd'd into the mirror, and a
#   saturated grove cannot stall them
#   (define.usecase.review-a-grove-tree-locally).
#
#   `term=crew` splits work from view precisely because the two are
#   independent. these are the seats that spend that independence.
#
# ⚠️ BOTH halves of the split are local, and neither is special beside the
#    other. `take` reads the mirror and `give` answers from it, so both need the
#    mirror cwd and both need `git.tree.sync` in their shell — which they get
#    for free, because __crew_role_cwd and __crew_provision_seat each gate on
#    __crew_role_is_local rather than on a role name.
#
# 🔴 .the bare `reviewer` stays HERE while it leaves the roster, and the two
#    lists answer different questions
#
#      CREWWORK_ROLES_DEFAULT  what a NEW crew gets      — a POLICY
#      CREWWORK_ROLES_LOCAL    where a role's duct LIVES — a FACT
#
#   a legacy `reviewer` duct is on this box whether or not we would boot one
#   today, so to drop it from this list does not retire it — it makes every crew
#   verb address it at the GROVE. measured 2026-09-13: `crew.stop --roles
#   reviewer` reported `duct://grove-…/…/reviewer … already absent; row cleared`
#   while the real local duct sat untouched — a truthful sentence about the
#   wrong box, which is the exact family __crew_role_host was written to close.
#
#   ⇒ so a role leaves this list only when no duct of that name can still exist
#     anywhere — never merely because the roster moved on.
CREWWORK_ROLES_LOCAL="${CREWWORK_ROLES_LOCAL:-reviewer.take,reviewer.give,reviewer}"

# .what = the host a given ROLE's duct lives on, given its crew's host
# .why  = a local-only role must come back as '' no matter which grove its tree
#         sits on. without this the host is a property of the TREE alone, and a
#         reviewer's uri is built pointed at the grove.
__crew_role_host() {
  local host="$1" role="$2"
  local r
  local saved="$IFS"; IFS=','
  for r in $CREWWORK_ROLES_LOCAL; do
    if [[ "$r" == "$role" ]]; then IFS="$saved"; printf ''; return 0; fi
  done
  IFS="$saved"
  printf '%s' "$host"
}

# .what = exit 0 if this role's duct lives on THIS box, whatever grove its tree
#         is on — the boolean twin of __crew_role_host
__crew_role_is_local() {
  local role="$1" r
  local saved="$IFS"; IFS=','
  for r in $CREWWORK_ROLES_LOCAL; do
    if [[ "$r" == "$role" ]]; then IFS="$saved"; return 0; fi
  done
  IFS="$saved"
  return 1
}

# .what = does any on-defect stone in a crew belong to a role that MOVED this poll?
#
# .why  = a stone is the route's last SETTLED transition, so a clone mid-turn
#         still renders the gate it last stopped at. an `exhausted` / `blocked ✋`
#         stone is the DRIVER's, and it goes stale the instant the clone drives
#         PAST it. git.crew.poll already parts moved from parked for the 🙋 tally
#         (STONE_HUMAN_MOVED); this exposes the SAME discriminator to the per-crew
#         status, so a moving on-defect crew renders `inflight` rather than a
#         blocked label its own motion has already outrun (task #58).
#
# 🔴 .why ONLY on-defect, never on-human: a clone may legitimately drive work
#         BELOW a real human gate (`approved?` / `👋`), so a mover there is "do
#         not surface yet", never "no gate exists" — to promote it would HIDE the
#         gate, the one direction this must never fail in.
#
# .the signal costs no new read: CREW_MOTION holds ONLY the ducts that did NOT
#         move this poll, so a role ABSENT from the still-map took a turn. an
#         empty still-map means every role moved. keyed exactly as the 🙋 tally
#         keys it (git.crew.poll.sh:2072), so the two never disagree.
#
# args: $1 = stones blob (newline-delimited `role=stone`, as CREW_STONES stores)
#       $2 = still-map   (newline-delimited `role=age`,   as CREW_MOTION stores)
# echoes "1" if a moved on-defect stone exists; empty otherwise.
__crew_ondefect_moved() {
  local stones="$1" still="$2" rs role stone
  while IFS= read -r rs; do
    [[ -n "$rs" ]] || continue
    stone="${rs#*=}"
    role="${rs%%=*}"
    case "$stone" in
      *exhausted*|*'blocked ✋'*)
        # absent from the still-map => this role moved => the on-defect label is stale
        printf '%s\n' "$still" | grep -qa "^${role}=" || { printf '1\n'; return 0; }
        ;;
    esac
  done < <(printf '%s\n' "$stones")
  return 0
}

# .what = re-assign a stone label's halt glyph from its OWNER, never its phase word
#
# 🔴 .why  = `👋` is the HUMAN-owned marker, and the route prints it for two
#         unrelated halts:
#
#           1.vision, judge, approved? 👋            -> the HUMAN's
#           review.peer, l3@i006, exhausted 👋       -> the DRIVER's
#
#         `approved?` is human-only by rule.forbid.self-grant-human-gates. a spent
#         review budget is the DRIVER's lane. so the glyph spans both owners and
#         cannot carry the split — which is the same reason the stone TALLY keys on
#         the phase token rather than the glyph (git.crew.poll.sh:2600). the tally
#         got that treatment; the RENDER did not, and kept the human marker.
#
# 🔴 .the measured cost, 2026-09-15, feat-prescribed-brain-per-stone
#         the poll rendered `l3@i006, exhausted 👋` while the pane, the same
#         instant, showed the driver had ALREADY spent its own lever ("Budget
#         extended to 9") and re-arrived — a spinner, a timer that advanced, a
#         token counter that rose.
#
#         ⚠️ the WORD was honest: `exhausted` was true at the last SETTLED
#         transition, and a stone is stale by construction because a live turn is
#         not a transition yet (rule.require.nudge-parked-clones). the GLYPH was
#         the defect. it points a reader at a human, and the only lever that read
#         leaves open is a budget top-up — which the babysit tick forbids outright
#         (rule.forbid.budget-top-ups). so the render asked a human for an act no
#         human owns, and whose real owner had already performed it.
#
#         this is task #21 INVERTED. there, the ✋ tally was labelled "the driver's"
#         and held human-only cures. here a lane wears the HUMAN glyph while its
#         cure is driver-owned and already spent. one root — the glyph was assigned
#         from the phase word, never from the owner.
#
# .why 🌙 and not a strip: 🌙 is NOT a coinage. it is the form the upstream route
#         already prints for a spent lane, so this aligns the render with a glyph
#         the corpus carries rather than a marker we mint. a bare strip would leave
#         `exhausted` with no owner mark at all, which reads as an oversight.
#
# 🔴 .why the swap is BOUND to the adjacent `exhausted`, never applied to any 👋
#         the one direction this must never fail in is to HIDE a real human gate.
#         so the substitution matches the two tokens together and touches no other
#         👋 — an `approved? 👋` passes through untouched, and a CLIPPED label
#         (whose verdict token a narrow pane truncated away) gains no glyph it
#         never had. a surplus 👋 costs one glance; an absent one parks a ⭐ tree.
#
# .note = the phase token, the lane id, and the word `exhausted` all survive
#         byte-identical, so every consumer that keys on them — the tally, the
#         per-crew status arms, the clipped detector — reads exactly what it read
#         before. this changes the OWNER MARK and no datum.
#
# args: $1 = one stone label, as CREW_STONES stores it after the `role=` prefix
# echoes the label with its halt glyph assigned from the owner.
__crew_stone_owner_glyph() {
  local stone="$1"
  printf '%s\n' "${stone//exhausted 👋/exhausted 🌙}"
}

# .what = rc 0 if a usage-cap's reset clock has already PASSED, rc 1 if it is
#   still in the future OR cannot be parsed (fail CLOSED — an unparseable reset
#   stays a blocker, never a false "healable").
#
# .why a passed reset is HEALABLE, not a blocker
#   `You've hit your limit · resets 9:30am (UTC)` holds a clone until that clock.
#   once the clock passes, the banner is STALE — a dead notice over an
#   idle-but-live box — and the cure is a NUDGE to retry, not a wait
#   (define.invariant.crew.ratelimit.healable-transient). a poll that reads the
#   banner but not its clock cannot tell a live cap from a spent one, so it
#   leaves a nudge-able clone parked (measured across ~24 grove crews).
#
# .how tz-aware
#   the reset carries `(UTC)` when absolute-UTC, else it is the account's local
#   clock == the supervisor box clock. parse the `H:MMam/pm` after `resets `,
#   derive today's epoch in the right zone, and call it PASSED iff
#   now - reset ∈ [0, 64800s] (18h). the upper bound guards the midnight-wrap:
#   a "resets 9:30am" read at 00:10 is TODAY's 9:30 (future), not 15h in the past.
#
# args: $1 = the cap line (e.g. `You've hit your limit · resets 9:30am (UTC)`)
# rc 0 = reset passed (HEALABLE) · rc 1 = future or unparseable (a real wait)
__crew_cap_reset_passed() {
  local capline="$1" hm zone reset_epoch now_epoch delta
  [[ -n "$capline" ]] || return 1
  [[ "$capline" == *resets* ]] || return 1
  # pull the clock after "resets " — keep only the H:MM(am|pm) head
  hm="${capline#*resets }"
  hm="${hm%%[!0-9apmAPM: ]*}"
  hm="$(printf '%s' "$hm" | tr -d '[:space:]')"
  [[ -n "$hm" ]] || return 1
  # zone: an (UTC) suffix => absolute UTC, else the local box zone
  zone="local"
  [[ "$capline" == *"(UTC)"* ]] && zone="utc"
  # derive the reset's epoch in the right zone (epoch is absolute, so now needs
  # no zone); an unparseable clock => fail closed (still a blocker)
  if [[ "$zone" == "utc" ]]; then
    reset_epoch="$(TZ=UTC date -d "$hm" +%s 2>/dev/null || true)"
  else
    reset_epoch="$(date -d "$hm" +%s 2>/dev/null || true)"
  fi
  [[ -n "$reset_epoch" ]] || return 1
  # now is absolute (zone-independent); __CREW_NOW_EPOCH is a test-only seam that
  # pins the clock so a reset-vs-now clamp is deterministic (never a flaky test)
  now_epoch="${__CREW_NOW_EPOCH:-$(date +%s)}"
  delta=$(( now_epoch - reset_epoch ))
  [[ "$delta" -ge 0 && "$delta" -le 64800 ]] && return 0
  return 1
}

# .what = rc 0 iff a PRIOR NUDGE was already answered with a cap banner — the
#   pane's own record that the peer-active inference has been tried and refuted.
#
# 🔴 .why it exists — an ACTIVE PEER is INDIRECT evidence, and it can be wrong
#   `__crew_heal_check` infers a stale banner from an active peer on the same
#   grove: auth is grove-wide, so a peer that emits tokens proves the account has
#   budget. that inference is sound and it is not a proof — and the pane holds
#   the DIRECT test of it, because every nudge this repo sends is recorded there,
#   followed by whatever the clone answered.
#
#   measured 2026-09-16 on feat-peer-review-parallelism, at 07:13 UTC against a
#   cap that read `resets 7:50am (UTC)` — 37m in the FUTURE. a peer WAS at work,
#   the nudge landed, and the clone's very next line was the same banner:
#
#     ❯ a clone on this grove is actively at work, so the account has budget …
#       ⎿  You've hit your limit · resets 7:50am (UTC)
#
#   two independent refutations in one pane: the reset clock, and the retry.
#
# 🔴 .the harm it ends is a LOOP, never one wasted turn
#   the peer-active nudge is owed EVERY tick until the tree moves, so a live cap
#   draws one wasted turn per tick until its reset — and each nudge RE-PRINTS the
#   banner that re-arms the detection. the cure feeds its own trigger.
#
#   ⇒ so an active peer is NECESSARY but not SUFFICIENT. where the tool already
#     spent a nudge and was answered with the cap, the question is settled by
#     what the clone DID, which outranks what a peer implies. this does NOT
#     relitigate the 2026-09-14 case that earned the override — with no prior
#     nudge in the pane this returns 1, so the first nudge still fires.
#
# ⚠️ it keys on the nudge's INVARIANT TAIL, which every `__crew_heal_nudge` emits
#    whatever its lead clause. a caller that edits that sentence must edit this
#    marker in the same round, or the loop silently returns.
#
# args: $1 = the plain (de-ansi'd) pane text
# rc 0 = a nudge was refuted (the cap is LIVE) · rc 1 = no prior nudge, or it worked
__crew_cap_nudge_refuted() {
  local plain="$1" after
  local marker="retry the turn that failed and continue to drive your route autonomously."
  [[ -n "$plain" ]] || return 1
  [[ "$plain" == *"$marker"* ]] || return 1
  # the text after the LAST nudge — `##` is greedy, so a pane with several
  # nudges is judged on its most recent one only
  after="${plain##*"$marker"}"
  [[ "$after" == *"hit your limit"* ]] && return 0
  return 1
}

# .what = the LIVE turn's elapsed seconds and token count, read off the spinner
#   line claude draws while a turn is in flight:
#
#     ✻ Shenaniganing… (50m 44s · ↓ 8.3k tokens · thought for 1s)
#
#   echoes `<elapsed_s>\t<tokens>` — e.g. `3044\t↓ 8.3k`.
#
# 🔴 .why — the TURN is a different subject than the BOX, and the fleet had an
#   instrument for the second and none for the first
#
#   every extant motion instrument — `CLONE QUIET`, `✋ BOX UNMOVED`, the
#   `CREW_MOTION` ages — keys on the BOX between two captures. a clone mid-turn
#   has an EMPTY box that stays empty, so every one of them reads "unchanged"
#   and is right to. ⇒ a 50-minute turn renders with no age at all, while a
#   9-minute untouched box earns a `✋ BOX UNMOVED … still 9m` line.
#
#   measured 2026-09-16, `rhachet-roles-bhrain.beav.feat-dispute-or-concede`:
#   three byhand pane reads over ~16 minutes, and the fleet poll carried no
#   column in which either number could appear.
#
# 🔴 .why the datum was already REACHED and then discarded
#   `__crew_grove_has_active_clone` greps the exact line that holds both numbers
#   and asks it one boolean question — "is a turn live?" — then throws the
#   elapsed and the count away. so this is not a parse that drifted; the column
#   was never cut.
#
# ⚠️ .the token count is echoed VERBATIM — ARROW AND ALL — on purpose
#   its whole use is a byte-identical comparison across two reads: a clock that
#   moves beside a counter that does not is the wedge signature. to parse it
#   into a number would invite arithmetic on a figure whose precision claude
#   chooses (`8.3k`), and arithmetic is not what any consumer wants of it.
#
#   🔴 the ARROW rides along because claude draws TWO directions and they are
#   not comparable quantities:
#
#     ↓ 8.3k tokens    a work turn — what the model has emitted
#     ↑ 13.3k tokens   a COMPACTION turn — what it re-sends
#
#   both are live turns, so both are in scope for an AGE. but a consumer that
#   compared `8.3k` to `13.3k` across the boundary would read a compaction as
#   token movement and clear a genuinely wedged clone. with the arrow in the
#   field, the naive string compare refuses that by construction.
#
# ⚠️ .it judges the LAST spinner in the pane
#   a pane holds scrollback, so an ended turn's spinner can still be on screen.
#   the last match is the newest. an ENDED turn draws `✻ Worked for 1m 52s` —
#   no parens, no token counter — so it cannot match at all.
#
# args: $1 = the plain (de-ansi'd) pane text
#   🔴 the raw pane carries escapes INSIDE the spinner line, between `↓` and the
#   count, so a raw string does NOT match. de-ansi upstream, as every other
#   pane helper's caller already does.
# rc 0 = a live turn was read (stats on stdout) · rc 1 = no live turn
__crew_turn_stats() {
  local plain="$1" head elapsed tokens h=0 m=0 s=0
  [[ -n "$plain" ]] || return 1
  head="$(printf '%s\n' "$plain" \
    | grep -oE '\(([0-9]+h )?([0-9]+m )?[0-9]+s · [↓↑] [0-9.]+k? tokens' \
    | tail -1)"
  [[ -n "$head" ]] || return 1
  elapsed="${head#\(}"; elapsed="${elapsed%% · *}"
  tokens="${head#*· }"; tokens="${tokens%% tokens}"
  [[ "$elapsed" =~ ([0-9]+)h ]] && h="${BASH_REMATCH[1]}"
  [[ "$elapsed" =~ ([0-9]+)m ]] && m="${BASH_REMATCH[1]}"
  [[ "$elapsed" =~ ([0-9]+)s ]] && s="${BASH_REMATCH[1]}"
  printf '%s\t%s\n' "$(( 10#$h * 3600 + 10#$m * 60 + 10#$s ))" "$tokens"
  return 0
}

# .what = does this pane hold a LIVE MODAL — a prompt whose answer is a
#   keystroke? the four shapes, each its own arm:
#
#     1  a permission ask     `Do you want to proceed?` + friends
#     2  a consent ask        `Chat about this` · `this session to help`
#     3  a numbered option    `❯ 1. Yes`  — the CURSOR marks the selection
#     4  a survey row         `1: Bad    2: Fine   3: Good   0: Dismiss`
#
# 🔴 .why arm 3 REQUIRES the ❯ cursor — the defect this cures
#   the marker was optional until 2026-09-16, so ANY line shaped `1. Text`
#   matched. a clone that wrote its own escalation as a numbered list in
#   PROSE was classified a plea, and the heal verb emitted a `--keys 1`
#   against it. that keystroke lands as LITERAL TEXT in an empty box, which
#   the next poll then reports as human-typed (term=duct.box.unread).
#
#   ⇒ a real modal ALWAYS marks its selected option; prose never does. the
#     cursor is the whole discriminator, and it costs one character.
#
# 🔴 .why the survey is its OWN arm, and why the tightening needed it
#   a survey's options are COLON-joined on ONE line, so arm 3 never reached
#   it — it was caught by accident, through whatever prose list happened to
#   sit above it in the same pane. tighten arm 3 alone and the survey stops
#   to be detected at all: a false positive traded for a false negative, on
#   a pane already in the corpus.
#
# args: $1 = the plain (de-ansi'd) pane text
# rc 0 = a live modal is up · rc 1 = none
__crew_pane_has_plea() {
  local plain="$1"
  [[ -n "$plain" ]] || return 1
  local plea='Do you want to (proceed|make this edit|create)'
  plea+='|requires approval|Chat about this|this session to help|\(Recommended\)'
  plea+='|^[[:space:]]*[❯>][[:space:]]*[0-9]+\.[[:space:]]+[A-Za-z]'
  plea+='|^[[:space:]]*[0-9]+:[[:space:]]+[A-Za-z].*[0-9]+:[[:space:]]+[A-Za-z]'
  printf '%s\n' "$plain" | grep -qE "$plea"
}

# .what = echoes "1" iff this canon is structurally a CREW TREE — the one test
#   every subject-set arm must apply before it mints a crew from a name.
#
# 🔴 .why it lives HERE, and is not an inline condition at one call site
#   the poll derives its subject set from THREE arms, and each yields a name:
#
#     arm 1  live tmux sessions   a dot test, inline                 ✔ screened
#     arm 2  the crew ledger      a row exists or it does not        ✔ by construction
#     arm 3  the duct registry    SEEN[...]=1, unconditional         🔴 NOT screened
#
# 🔴 .that table was INCOMPLETE, and the omission is what let the defect recur.
#   it enumerates the poll's arms and stops there, so it reads as a census of
#   every arm that yields a name. two more do, in `crew.ledger backfill`:
#
#     arm 4  backfill / live tmux      FOUND[...]=1, unconditional   🔴 NOT screened
#     arm 5  backfill / duct registry  FOUND[...]=1, unconditional   🔴 NOT screened
#
#   ⚠️ and arm 2's `✔ by construction` is CONDITIONAL on arms 4 and 5, which is
#   the part no reader could see. the ledger is screened only because whoever
#   writes it screened first — and the backfill is what writes it. so an
#   unscreened backfill does not merely add a bad row; it retires the one
#   guarantee the poll leans on, silently, and every later sweep reads the
#   phantom back out through an arm marked safe.
#
#   both were repaired 2026-09-16, clamped at `[case19] [t4]`/`[t5]`. the cost
#   of their absence: a `--backfill` on a clean fleet seeded `📒 + main` and
#   needed a hand `--del main` to undo — a repair instrument that leaves a
#   repair behind. ⇒ enumerate BEFORE you name (rule.require.enumerate-before-
#   you-name): #46 screened the arm it had measured, this header enumerated the
#   file it was written in, and each read as complete (term=partial-audit).
#
#   arm 1 got its test from task #46 (2026-09-13). the argument there is about
#   the NAME, so it holds for every arm that yields one — but it was written as
#   an inline condition in arm 1, so no other arm could share it, and arm 3
#   never got it. #46 read as complete because the arm it repaired was the arm
#   that had been measured (term=partial-audit).
#
# .the rule = every real crew tree in this fleet is
#   `<repo>.beav.<fix|feat>-<slug>`. tmux forbids a literal dot in a session
#   name, so a raw session carries an underscore where the dot belongs and
#   `__crew_canon` restores it. ⇒ a canon with NO dot at all was never a crew:
#   it is a bare branch name, or a stray session that merely holds a slash.
#
# 🔴 .the measured cost of its absence from arm 3, 2026-09-14 → 2026-09-15:
#   three leftover keyrack-probe registry rows —
#     ~/.ductwork/ducts/main/{keyprobe,keytest,keytest2}.json
#   minted a crew named `main` on every sweep. `--healable` then emitted
#   `rhx git.crew.heal --tree main --who mechanic --mode apply` for SEVEN
#   consecutive ticks; every run printed three lines, cured naught, exited 0.
#   on one of those ticks the two real `🚫 limited` rows were nudged and
#   CLEARED (3 healable → 1) while this row did not move — so the set
#   demonstrably drains for every row except this one. a permanent dead row in
#   an actionable set teaches a supervisor to eyeball that set, the exact habit
#   rule.always.poll-the-fell-and-heal-sets exists to prevent.
#
# ⚠️ .the source arm was MIS-DIAGNOSED for a day, and the wrong cure would have
#   changed no verdict. the record blamed the live grove tmux session
#   `main/mechanic` — which is real, and holds ~6.8% cpu on
#   grove-sandpine-v20260901 — but arm 1 already screens that out, so it cannot be
#   the source. two distinct artifacts wear one name; only the LOCAL registry
#   litter reached the subject set.
#
# ⚠️ it takes a CANON, never a raw session half. a raw tmux name holds no dot at
#   all, so an unconverted name reads as a phantom here and every grove crew
#   would drop out of the subject set. canonicalize first (`__crew_canon`).
#
# args: $1 = a canonical (dotted) tree name
# echoes "1" iff it is structurally a crew tree, else empty
__crew_is_crew_tree() {
  local canon="$1"
  [[ -n "$canon" && "$canon" == *.* ]] && { printf '1\n'; return 0; }
  return 0
}

# .what = true iff a path is a TOOL'S OWN STATE — written by a tool as its
#   cache, authored by no party as work, and regenerated by a fresh run
#
# 🔴 .why the admission test is REGENERATION, never authorship alone
#   `.meter/` is the near miss and it is deliberately OUT. it is tool-written
#   too — `git.commit.uses` and `radio.uses` write it — and it does NOT come
#   back: it holds a HUMAN'S GRANTED QUOTA, so to stash it destroys a grant
#   that only a human can re-issue. tool-written is half the test; the half
#   that matters is whether a re-run restores it.
#
# ⚠️ the list is SHORT on purpose, and it is the measured set rather than a
#   guessed one. a padded list is a guess that carries a classifier's
#   authority, and the cost of a wrong entry is a stash over work nobody can
#   recover.
__crew_dirt_is_tool_state() {
  case "$1" in
    .radio|.radio/*) return 0 ;;   # the radio task cache — radio.task.pull writes it
    *) return 1 ;;
  esac
}

# .what = one porcelain read, rendered as the suffix a tree row carries
#   in:  the porcelain lines, `;`-joined — the shape BOTH poll arms produce
#   out: "" when clean, else " ✋ dirty: <what>"
#
# 🔴 .why it NAMES the dirt — the suffix used to be the bare word `dirty`
#   a merged row read `fell it ✋ dirty` and stopped there, so the one question
#   a supervisor must answer next — is this WORK, or is it a tool's own cache?
#   — cost a `crew.send 'git status --short'` plus a `crew.read`, per tree,
#   per tick. and the poll had ALREADY run that status on both arms: the local
#   arm ran `--porcelain | head -1` purely to test it non-empty, and the grove
#   arm shipped that same first line across an ssh and discarded it at the
#   `read -r`. the content was in hand each time, and thrown away each time.
#
#   .measured 2026-09-17 — svc-reservations.beav.feat-spot-forecast-widget read
#   `👌 merged — pr #357 landed — fell it ✋ dirty` for two ticks. the whole of
#   the dirt was ` M .radio`. the human asked "what kind of dirt?", and two
#   round trips answered what the row should have.
#
# 🔴 .the classification is over the WHOLE set, never the first entry
#   one work file makes the set work. a test that read `paths[0]`, or that
#   matched `.radio` anywhere, would grade `.radio` + `src/x.ts` as tool state
#   and invite a stash over real work — a cure strictly worse than the gap.
#
# ⚠️ it CLASSIFIES and never DECIDES. the fell's own gate still refuses, and
#   the `--stash --why` that clears it is a judgment only a human may author
#   (rule.forbid.fabricated-opines). this renders the kind; the reason stays
#   theirs to write.
#
# .note the `✋ dirty` marker is preserved verbatim at the head of the suffix —
#   four call sites in the poll match on `*"✋ dirty"*` (the merged-dirty
#   tally, the orphan fence, the fellable filter, the heal gate), so a rename
#   of the marker would silently unfence all four.
__crew_dirt_read() {
  local raw="${1:-}"
  [[ -n "$raw" ]] || return 0

  local -a entries=()
  IFS=';' read -ra entries <<<"$raw"

  local -a paths=()
  local entry p
  for entry in "${entries[@]}"; do
    [[ -n "$entry" ]] || continue
    # porcelain is `XY <path>` — two status columns then a space. a rename
    # reads `R  old -> new`, and the NEW name is what a fell would carry off.
    p="${entry:3}"
    p="${p##* -> }"
    p="${p#\"}"; p="${p%\"}"
    [[ -n "$p" ]] && paths+=("$p")
  done

  (( ${#paths[@]} > 0 )) || return 0

  local work=0
  for p in "${paths[@]}"; do
    __crew_dirt_is_tool_state "$p" || work=$(( work + 1 ))
  done

  local more=$(( ${#paths[@]} - 1 ))
  local tail=""
  (( more > 0 )) && tail=", +$more"

  if (( work == 0 )); then
    printf ' ✋ dirty: tool state only — %s%s' "${paths[0]}" "$tail"
    return 0
  fi
  printf ' ✋ dirty: %s file(s) — %s%s' "${#paths[@]}" "${paths[0]}" "$tail"
}

# .what = echoes "1" iff a crew's state is curable by `git.crew.heal` — the
#   predicate behind `git.crew.poll --healable`. a pure decision over three
#   already-classified inputs, so it is clamped here directly (the case14
#   pattern) rather than through the poll's end-to-end render.
#
# .why HEALABLE spans TWO cure axes, because `git.crew.heal` cures on both
#   heal has two cures, so the poll's actionable set must name both — a
#   `--healable` that lists only one axis leaves the supervisor to byhand-cure
#   the other, the exact gap that reads a husk star, diagnoses it, and reaches
#   for a forbidden send (rule.forbid.byhand-heal, surgoal.polish-the-
#   supervisor-and-prioritizer-tools). the two axes:
#
#   1. a `limited` crew whose cure is a NUDGE — covers four rate-limit states,
#      only two of which take a nudge:
#     - transient 429 — a bare banner, no clock ($has_ratelimit)     -> NUDGE
#     - stale cap — a reset clock that already PASSED ($cap_stale)    -> NUDGE
#     - LIVE cap — a reset clock in the FUTURE                        -> WAIT / auth.swap
#     - tool DATA (not a wedge)                                       -> no cure
#     the live cap is the false-heal hazard: a NUDGE into a genuinely capped
#     clone buys naught and reads as a cure.
#
# 🔴 ⚠️ this header ONCE read "so this returns '' for a live cap", and that has
#    been FALSE since 2026-09-14 — the body below returns "1" for every
#    `limited` crew, live cap included, because a live cap IS healable, by an
#    auth.swap rather than a nudge (live-cap-healable-via-swap). the sentence
#    outlived the widening, and `git.crew.poll --help` plus the babysit contract
#    both repeat it, so THREE surfaces stated an exclusion the code does not make.
#
#    measured 2026-09-16: a supervisor read `--healable`, trusted the documented
#    exclusion, and ran the emitted heal against a cap 37m in the FUTURE.
#
#    ⇒ so read this predicate as "is there ANY cure?", never as "is a nudge
#      safe?" — the CURE AXIS is heal's to pick, and only heal reads the clock
#      (define.invariant.crew.ratelimit.healable-transient names the four states).
#
#   2. a `husk` whose cure is a REVIVE — a mechanic at a dead box (signal-killed
#      💥143, or a bare shell where claude belongs). `git.crew.heal` reboots the
#      pane and resumes the conversation. heal is the ARBITER for the two husk
#      edge cases it surfaces rather than revives (a ^C-ended husk a human
#      touched, an unreadable close), so a `--healable` that lists every husk
#      over-recommends by at most those two — and a heal run on them is still
#      correct: it reads them and surfaces, never a false revive
#      (define.invariant.crew.husk.discriminator-parity). the poll's `husk`
#      status is the mechanic husk (git.crew.poll.sh: mechanic:shell/husk).
#
# args: $1 = crew_status · $2 = has_ratelimit (non-empty if 429 banner)
#       $3 = cap_stale (non-empty if a cap reset PASSED)
#       $4 = queuedrow  (the parked text, if a queued row is orphaned)
#       $5 = no_duct    (non-empty iff the crew holds NO live duct — no tmux
#                        session at all, so no pane for any heal axis to read.
#                        its cure is `git.crew.boot` or a fell, and the crew
#                        row already names one)
#
# 🔴 .why $5 is `no_duct` and NOT `duct_down`, renamed 2026-09-16
#   it shipped as `duct_down` and its call site read `crew_state == "down"`.
#   the NAME said a state; the PROPERTY it stands for is "no session". those
#   are not the same set — `crew_state` has FOUR values and TWO carry the
#   property:
#
#     down      no duct, tree on disk    ✔ no session
#     phantom   no duct, no tree HERE    ✔ no session  ← missed for a day
#     asleep    the grove did not answer ✘ UNKNOWN, and must stay unknown
#     at work   live ducts               ✘
#
#   ⇒ a parameter named for one member of a set screens exactly that member,
#   and the peer with the identical property sails through. the rename is the
#   repair: `no_duct` names the property, so the next reader asks "which states
#   have it?" rather than "is this that state?".
#
#   measured 2026-09-16, three trees, four ticks: `domain-objects.beav.feat-
#   contract-coerce`, `rhachet-brains-anthropic.beav.feat-frontier-claude-
#   models`, `test-fns.beav.feat-tempdir-autoprune` each rendered
#   `👻 phantom — stale registry rows, tree is gone`, fell to `frozen` at the
#   ladder's `!= "at work"` arm, and drew a wedge line that named `--who
#   mechanic` on a tree with no worktree on any box. every run answered
#   `😴 no pane read` — a report about the READ, never an arbitration. clamped
#   at `[case18] [t11]`.
#
# ⚠️ .why `asleep` is NOT screened, and must not be
#   an unreached grove answers with an empty list exactly as a crewless box
#   does, so `asleep` is a claim about the READ (term=asleep). to screen it
#   would assert "this crew has no duct" from a failed look — the false report
#   that whole term exists to refuse. it stays healable, and heal's own `no
#   pane read` is the honest answer there.
# echoes "1" iff healable, else empty
__crew_is_healable() {
  local status="$1" has_ratelimit="$2" cap_stale="$3" queuedrow="${4:-}" no_duct="${5:-}" modelost="${6:-}" huskbox="${7:-}"
  # 🔴 axis 4 — a clone that LOST `--permission-mode acceptEdits`. it is curable
  #   by a MODE restore, and it is the one member of this set whose crew_status
  #   is `at work`: the clone is alive, productive, and stopped at a modal on
  #   every file write it makes. so every other arm below screens it out, and
  #   the tick meets it as a fresh 🚧prompt tick after tick.
  #
  #   measured 2026-09-18 on `rhachet-roles-bhrain.beav.feat-acceptance-under-
  #   5min`: SIX supervisor keys in one window, one per `Update`. the fixture
  #   for this shape had been captured, the hazard was documented in THIS FILE
  #   at two sites, and the invariant was named — and no instrument read the
  #   mode, so `--healable` never held it
  #   (rule.require.a-cure-path-for-every-named-husk-shape, unmet until now).
  #
  # ⚠️ it is screened FIRST, ahead of the status arms, because its status is the
  #   one that proves healthy. an arm order that read the status first would
  #   drop it on the floor, which is exactly what happened for the life of this
  #   predicate.
  [[ -n "$modelost" ]] && { printf '1\n'; return 0; }
  # axis 2 — a husk is curable by a revive; heal arbitrates the surface-only edge cases
  [[ "$status" == "husk" ]] && { printf '1\n'; return 0; }
  # 🔴 axis 2b — a husk BOX beneath a crew whose status reads `at work`
  #
  #   `crew_status` is an AGGREGATE over the seats. a crew with one dead mechanic
  #   and four live `shell` seats resolves to `at work`, so the arm right above
  #   — which reads that aggregate — never sees the husk. the BOX axis holds it
  #   per seat, and that is the axis heal itself reads.
  #
  #   ⚠️ this is the modelost hazard one seat over, and it defeats the same arm
  #   for the same reason: the status proves healthy while a seat is not. there
  #   the live clone was the deceiver; here four idle shells outvote one corpse.
  #
  #   .measured 2026-09-18 on `rhachet-roles-bhrain.beav.feat-prescribed-brain-
  #   per-stone`, and the two instruments disagreed in one tick:
  #     rhx git.crew.poll --healable --all   -> `no tree to heal right now`
  #     rhx git.crew.heal --tree <it> --who mechanic
  #       -> 💀 husk (exit 143) — killed by signal, SAFE to heal
  #          plan: would crew.reboot, then resume claude
  #   the poll's own footer named it that same run (`husk × 1`, by tree AND by
  #   seat), so the datum was measured and the verdict that needs it never
  #   received it (rule.require.poll-recommends-every-cure-heal-has).
  #
  # ⚠️ the over-recommend is bounded exactly as the husk arm above is: heal reads
  #   what killed the pane and REFUSES a `^C` (a human typed that interrupt). a
  #   run that declines is a correct run, never a false revive.
  [[ -n "$huskbox" ]] && { printf '1\n'; return 0; }
  # axis 1 — a limited crew is ALWAYS curable; only the CURE AXIS differs:
  #   transient 429 / STALE cap -> a NUDGE (retry the failed turn)
  #   LIVE (future-reset) cap   -> an auth.swap to an uncapped account (global +
  #                                hot, unblocks NOW; term=auth.swap)
  #   the swap axis was unwired, so a live cap fell out of --healable and read as
  #   a passive human wait. it is not: every limited sub-state has a cure
  #   (define.invariant.crew.ratelimit.live-cap-healable-via-swap). measured
  #   2026-09-14 on feat-rec-waitlist-capture — capped, resets Sep 20,
  #   halted mid-turn, excluded from --healable across 6 ticks when a swap would
  #   have cleared it in one action. has_ratelimit/cap_stale still steer heal's
  #   axis (nudge vs swap) but no longer gate the fact of healability.
  [[ "$status" == "limited" ]] && { printf '1\n'; return 0; }
  # axis 3 — a FROZEN crew whose stillness is an ORPHANED QUEUE is curable by a
  #   RELAY: its turn ended with a message still parked in the queued row, and a
  #   queue drains only at a turn boundary. heal re-submits that same text
  #   verbatim (__crew_heal_drain).
  #
  # 🔴 .why it belongs in --healable and not merely in the render
  #   this cure is one the SUPERVISOR owns outright — no credential, no quota,
  #   no human. so to surface it while the derived set omits it is to make a
  #   supervisor transcribe a tree name by hand off --stones, which is the exact
  #   move rule.require.bulk-over-byhand and
  #   rule.always.poll-the-fell-and-heal-sets forbid.
  #   measured 2026-09-16: a ⭐ tree sat with the human's own gate answer
  #   undrained across TWO ticks, --healable reported `no tree to heal`, and the
  #   supervisor cured it by hand (rule.forbid.byhand-heal).
  #
  # 🔴 .the queued row picks the AXIS; it no longer gates HEALABILITY
  #   this clause once read `frozen && -n "$queuedrow"`, and justified the
  #   conjunct so: "frozen is proven three ways — an absent clone, an idle
  #   clock, and this pane fact — and only the third names a cure."
  #
  #   ⚠️ that last clause was true when written and is now false. heal grew a
  #      WEDGE axis (`--what wedge`, __crew_heal_wedge_one) whose whole subject
  #      is a frozen crew with NO queued row: alive, mid-work, and a frame that
  #      held byte-identical across two reads. so the state this predicate
  #      excluded for want of a cure is the exact state that axis cures — and
  #      the poll hid a cure it held
  #      (rule.require.poll-recommends-every-cure-heal-has: "a cure added to a
  #      cure-tool with no matching update to its paired poll = blocker").
  #
  #   ⇒ measured 2026-09-16: the wedge axis is opt-in ONLY (crewwork.sh, "never
  #     under `all`") AND absent from --healable. those two together make it
  #     UNREACHABLE through the babysit tick, which derives its actionable sets
  #     through the tool by mandate. no supervisor who follows the contract can
  #     ever probe for a wedge.
  #
  #   ⇒ this is the same repair the `limited` clause took on 2026-09-14, one
  #     axis later: has_ratelimit/cap_stale stopped short of the FACT of
  #     healability and became the axis picker. the queued row now does likewise.
  #
  # ⚠️ .the over-recommend is BOUNDED, and each run is still correct
  #   a frozen crew with no queue may be a wedge, a cloneless orphan, or merely
  #   idle. heal ARBITRATES at run time — the wedge probe returns `at rest` for
  #   an idle clone and `husk or plain shell` for an orphan, and cures neither.
  #   that is the husk precedent above, verbatim: the poll RECOMMENDS the cure,
  #   heal APPLIES or refuses it. a probe that says "not a wedge" is a correct
  #   run, never a false heal — and it NEVER auto-reboots.
  #
  # 🔴 .the ONE bound that clause does NOT cover — a duct that is DOWN
  #   the three cases it names (a wedge, a cloneless orphan, an idle clone) are
  #   each a crew heal READS and then arbitrates. a crew whose duct is down is a
  #   fourth case, and it differs in kind: there is no pane to read at all.
  #   `crew.read` on one answers
  #     ✋ duct.read: session 'duct:///<tree>/mechanic' is absent on this machine
  #        └─ what: tmux holds no session by that name
  #   so EVERY heal axis is inert on it — a wedge probe needs two frames, a
  #   revive needs a box, a relay needs a queued row. heal's honest verdict is
  #   `😴 no pane read — the duct is down or the capture came back empty`, which
  #   is a report about the READ, never a cure.
  #
  # 🔴 .and the poll ALREADY names its real cure, on its own row
  #   `crew_state="down"` renders `💀 no live duct — rhx git.crew.boot`. so the
  #   same tree carried two recommendations in one render: a boot on its crew
  #   row, and a wedge probe in the derived --healable set. only the first is a
  #   cure. that is `rule.require.poll-recommends-every-cure-heal-has` INVERTED
  #   — the poll recommended a cure heal does not hold.
  #
  #   ⇒ measured 2026-09-16, four consecutive babysit ticks: --healable named
  #     14 trees, the contract mandates every emitted line be run verbatim, and
  #     12 of the 14 returned `no pane read`. 48 tool calls across the four
  #     ticks, zero cures, zero probes, and the set never shrank — because what
  #     it names is not a state heal can move.
  #
  # ⚠️ .this does NOT re-narrow the 2026-09-16 repair above
  #   that repair put frozen-with-no-queued-row INTO the set, because the wedge
  #   axis cures exactly that state. it stays. what leaves is the disjoint case
  #   that repair never examined: no duct, hence no pane, hence no axis.
  #   `husk` and `limited` are untouched by construction — a cap banner and a
  #   dead box are both PANE facts, unobservable on an absent session — but the
  #   conjunct is written on the frozen arm alone so the blast radius is one arm.
  [[ "$status" == "frozen" && -z "$no_duct" ]] && { printf '1\n'; return 0; }
  return 0
}

# .what = which heal AXIS cures this healable crew — echoes `relay`, `wedge`,
#         `revive`, or `nudge`. the render turns it into a runnable command.
#
# .why  = `--healable` names a SET; each member needs the command that cures
#         IT. one flat `git.crew.heal --tree X` line is wrong for a wedge
#         candidate, because the wedge probe is opt-in and `--what all` never
#         runs it. so a supervisor handed the default line would run a heal
#         that reports "a live claude box is up, absent any move to make" and
#         learn naught — the poll would have named the tree and still hidden
#         the cure.
#
# ⚠️ .order matters where a crew answers to two arms. `frozen` + a queued row
#    is a RELAY: the parked text is a witness of a specific, cheap cure, and a
#    relay costs one keystroke where a wedge probe costs two reads and a sleep.
#
# args: $1 = crew_status · $2 = queuedrow (non-empty if text is parked)
#       $3 = modelost  (non-empty if the pane proves acceptEdits is off)
__crew_heal_axis() {
  local status="$1" queuedrow="${2:-}" modelost="${3:-}" huskbox="${4:-}"
  # 🔴 FIRST, for the reason __crew_is_healable screens it first: a mode-lost
  #   clone reads `at work`, so any status arm above this one would claim it and
  #   name a cure that cannot move it.
  [[ -n "$modelost" ]] && { printf 'mode\n'; return 0; }
  [[ "$status" == "husk" ]] && { printf 'revive\n'; return 0; }
  # 🔴 the husk BOX takes `revive` too, and it must outrank every arm below.
  #   those arms read the AGGREGATE status, which for this crew proves healthy
  #   (`at work`) or merely still (`frozen`) — so each would name a cure that
  #   cannot move a dead pane: a nudge at a clone that is not there, or a wedge
  #   probe that answers `husk or plain shell` and cures naught.
  #   ⇒ same order argument the modelost arm carries, and the same defect if the
  #     order were reversed (rule.require.poll-recommends-every-cure-heal-has).
  [[ -n "$huskbox" ]] && { printf 'revive\n'; return 0; }
  [[ "$status" == "limited" ]] && { printf 'nudge\n'; return 0; }
  [[ "$status" == "frozen" && -n "$queuedrow" ]] && { printf 'relay\n'; return 0; }
  [[ "$status" == "frozen" ]] && { printf 'wedge\n'; return 0; }
  return 0
}

# .what = the local mirror dir for a tree — <root>/<org>/_mirrors/<tree>
#
# .why  = it takes the TREE SLUG alone, never a tree_dir. a cloud tree's dir is
#         a path on the grove, and the mirror is always here, so a derivation
#         off the worktree path would be a cut against the wrong root. both
#         callers (crew.boot's duct loop, crew.show's term loop) hold the slug
#         and only one of them holds a dir.
#
# .the order: an extant mirror wins; else the org comes from the local clone of
#            the tree's own repo, which is the same clone `git.tree.sync` cuts
#            its worktree from. exit 1 when neither answers — a tree whose repo
#            was never cloned here has no mirror to name.
__crew_mirror_dir() {
  local tree="$1"
  local dotted="${tree//_/.}"
  local repo="${dotted%%.*}"
  local d
  for d in "$CREWWORK_GIT_ROOT"/*/_mirrors/"$dotted"; do
    [[ -d "$d" ]] && { printf '%s' "$d"; return 0; }
  done
  for d in "$CREWWORK_GIT_ROOT"/*/"$repo"; do
    [[ -d "$d/.git" ]] && { printf '%s/_mirrors/%s' "${d%/*}" "$dotted"; return 0; }
  done
  return 1
}

# .what = the cwd a given ROLE's duct opens in
#
# 🔴 .a BOOT registers a seat. it does not fetch the seat's content
#
#   the dir is made, never populated — `git.tree.sync` is what puts a tree's
#   files in it, and that verb stays separate on purpose.
#
#   ⚠️ measured 2026-09-11: the reviewer was EXCLUDED from `crew.boot` and given
#      a verb of its own (`crew.boot.reviewer`), on the claim that to boot it
#      meant to sync it. that claim bound an expensive optional act to a cheap
#      universal one, and then invented a verb to route around the binding it
#      had just created. the human struck it: "why would crew.boot
#      exclude it? it can BOot it without the sync" / "sync is separate to boot"
#      (rule.forbid.bind-a-costly-act-to-a-cheap-one).
#
#   ⇒ so a boot opens an EMPTY mirror dir, and that is correct. a seat with no
#     content yet is a seat; a seat that cannot be booted without a network
#     round trip is a coupling.
# .what = define `sync` in a freshly-opened LOCAL seat's shell
#
# 🔴 .why  = the seat exists to pull the crew's work down, and the pull verb was
#         the ONE verb out of its reach.
#
#         a reviewer seat cwd's into a checkout of the CREW's repo, so the `rhx`
#         on PATH there is that repo's rhachet — which has no `repo=.this` role
#         linked. `rhx git.tree.sync` answers `no unique skill executable`, and
#         the human is left with an absolute path into a foreign repo:
#
#           bash /home/<user>/git/<org>/sandpine-notebook/.agent/…/git.tree.sync.sh
#
#         that works, and it is not a command a human runs at their leisure.
#
# ⚠️ .the provision goes in the DUCT, never in the MIRROR. a mirror is reset to
#    the crew's snapshot on every refresh, and `tree.sync` refuses when the
#    mirror was edited since its last sync — so whatever is written INTO the
#    mirror to provision it becomes the very state that blocks the next pull.
#    a shell function lives in the duct's process and dies with it, so it can
#    neither leak nor dirty the surface under review.
#
# .the verb takes no args: tree.sync derives --tree from the mirror dir, --from
#  from the crew ledger, and --into local. it passes whatever it is given
#  straight through, so `git.tree.sync --help` reaches the skill's own help.
#
# 🔴 .the name IS the skill's name — `git.tree.sync`, verbatim
#
#    the seat does not learn a seat-only word. it types the same name it types
#    anywhere else in the fleet; what changes is only that the `rhx` prefix is
#    absent, because the function IS the resolution `rhx` would have performed.
#
#    ⇒ so there is ONE name for this capability across every surface, which is
#      `rule.require.ubiqlang` applied to a shell function: a seat-only synonym
#      would be a second word for one concept, and the human would have to know
#      which surface they are on to pick it.
#
# 🔴 .and it is emphatically NOT `sync`
#
#    `sync` is coreutils — `/usr/bin/sync` exists on every linux box. a function
#    by that name is fine WHILE it is defined, and catastrophic where the
#    provision did not land: the human types `sync`, coreutils flushes the
#    filesystem buffers, exits 0, prints NAUGHT, and the seat reports a
#    successful sync of a tree it never touched.
#
#    ⇒ measured 2026-09-13 on a seat booted before this provision existed:
#      `type sync` → `sync is /usr/bin/sync`. an absent verb that ERRORS is
#      recoverable; a homonym that SUCCEEDS silently is a `term=false-report`,
#      and the human has no tell at all (rule.require.safe-by-default).
#
#    ⚠️ note the two failures are INDEPENDENT, and the ubiqlang one alone would
#       have settled it: `sync` is both a synonym for a named skill AND a live
#       homonym. a short alias picked for terseness pays both.
#
# ⚠️ .a dotted function name is legal — verified, never assumed
#    zsh and bash both take `git.tree.sync()` as a function name, and function
#    lookup precedes PATH. confirmed 2026-09-13 in a live `-zsh` seat.
# 🔴 .the 2026-09-13 rewrite: an INSTALL, never a SEND
#
#    this used to `duct.send` a shell-function definition into the seat's live
#    pane. that is a KEYSTROKE, not a provision, and it failed four ways:
#
#      racy       it fired the instant duct.open returned; a shell not yet at a
#                 prompt swallowed the text
#      refusable  a busy pane rejects a send
#      silent     `|| true` — a boot that never provisioned still printed `up`
#      🔴 not durable  a shell FUNCTION lives in one process's memory. any shell
#                 restart in that pane — a ctrl-c out of the attach retry loop,
#                 an `exec zsh`, a reboot — took it with no trace and no report
#
#    ⇒ the fourth is the one that bit. a human hit `command not found` on two
#      different trees whose seats crew.boot had reported up, because the attach
#      loop's ctrl-c hatch starts a FRESH zsh every time it is used.
#
# 🟢 .the cure is a real executable on PATH, and it is strictly simpler
#
#    a seat is LOCAL by definition (__crew_role_is_local), so "the seat's box"
#    and "this box" are the same machine — which means a single user-global
#    install covers every seat that will ever exist here, forever, with no
#    per-seat act at all. it survives a shell restart because it was never in a
#    shell; it cannot race because no pane is involved; it cannot be refused
#    because no keyboard is asked.
#
# ⚠️ the name is the SKILL's name, verbatim — `git.tree.sync`. one word for one
#    concept on every surface (rule.require.ubiqlang). a seat-only synonym would
#    make a human recall which surface they stand on before they can type.
#
# ⚠️ it does NOT touch the mirror. the old comment's fear was right — a mirror is
#    reset on every sync, so a file written there becomes the state that blocks
#    the next pull — and ~/.local/bin is nowhere near it.
#
# returns: 0 installed or already current · 1 could not write
__crew_install_seat_verb() {
  local skill bindir shim want
  skill="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/git.tree.sync.sh"
  [[ -f "$skill" ]] || return 1

  bindir="${CREWWORK_SEAT_BIN:-$HOME/.local/bin}"
  shim="$bindir/git.tree.sync"

  # the shim is a pure function of the skill path, so a content compare IS the
  # findsert — no timestamp, no version marker, no state to drift
  want="$(printf '%s\n' \
    '#!/usr/bin/env bash' \
    '# .what = `git.tree.sync`, on PATH for every shell on this box' \
    '#' \
    '# .why  = a reviewer seat cwds into a checkout of the CREW repo, so the' \
    '#         `rhx` on PATH there is that repo rhachet — which has no' \
    '#         `repo=.this` role linked, and answers `no unique skill executable`.' \
    '#         this shim is what closes that, and it is INSTALLED rather than' \
    '#         typed into a pane so no shell restart can lose it.' \
    '#' \
    '# generated by crewwork.sh (__crew_install_seat_verb). edits are' \
    '# overwritten on the next crew.boot or `crew.heal --what seat`.' \
    "exec bash '$skill' \"\$@\"")"

  if [[ -f "$shim" ]] && [[ "$(cat "$shim" 2>/dev/null)" == "$want" ]] && [[ -x "$shim" ]]; then
    return 0
  fi

  mkdir -p "$bindir" || return 1
  printf '%s\n' "$want" > "$shim" || return 1
  chmod +x "$shim" || return 1
  return 0
}

# .what = make sure this box's seats can reach `git.tree.sync`
# .why  = see __crew_install_seat_verb. kept as a named step so crew.boot's
#         per-role loop reads as what it does, and so the SEAT axis has one
#         entry point whether it is reached from a boot or from a heal.
#
# ⚠️ it is per-BOX, not per-seat, and one call per local role is on purpose: the
#    op is a content compare, so every call after the first is a stat and a read.
#    an idempotent install is cheaper to repeat than to track.
__crew_provision_seat() {
  local uri="$1" role="$2"
  __crew_role_is_local "$role" || return 0

  if ! __crew_install_seat_verb; then
    # 🔴 loud, and still non-fatal. the boot succeeded; the SEAT did not, and a
    #    boot that reports `up` over an unreachable verb is the exact false
    #    report this rewrite exists to end (rule.forbid.failhide).
    echo "   │  ├─ ⚠️  seat '$role': could not install git.tree.sync into ${CREWWORK_SEAT_BIN:-$HOME/.local/bin}" >&2
    echo "   │  ├─    the seat is up; the sync verb is not on its PATH" >&2
    return 1
  fi
  return 0
}

__crew_role_cwd() {
  local tree_dir="$1" tree="$2" role="$3" grove_hint="${4:-}"
  if ! __crew_role_is_local "$role"; then printf '%s' "$tree_dir"; return 0; fi

  # 🔴 a LOCAL tree needs NO mirror — it is already on this box.
  #
  #    the mirror exists to move a GROVE tree's state here, so for a local tree
  #    it is a copy of a work that needs no copy — and worse, a copy that can
  #    NEVER be made: `tree.sync` refuses when --from and --into name the same
  #    box, so no call can ever fill it.
  #
  #    ⇒ the seat then looks correct and reviews an EMPTY DIR. crew.boot reports
  #      `crew up: reviewer`, crew.show opens it a tab, and the human lands on a
  #      bare prompt where `git status` answers `not a git repository`. no error
  #      names the cause — the report is true about the act and false about the
  #      capability it implies (term=false-report).
  #
  #    measured 2026-09-12 (4 trees) and hit by a human 2026-09-13 on
  #    sdk-aws-lambda.beav.feat-input-only-validation-and-hydration.
  #
  # ⚠️ the ledger is the authority on which grove a tree sits on. absent a row,
  #    fall through to the mirror — an unbooted tree has no verdict to give, and
  #    a guess that sends the seat to the worktree would be a guess about a path.
  #
  # 🔴 .why a caller may HINT the grove, and why the hint outranks the ledger
  #
  #    a SPROUT reaches this seam BEFORE the ledger row exists — the row asserts
  #    "a crew was booted here" and is written only once the ducts are up, so the
  #    very loop that opens them cannot read it. absent a hint the lookup returns
  #    empty and every sprout falls to the mirror branch, which is right for a
  #    cloud tree and WRONG for a local one: a local sprout's seat would be sent
  #    to a mirror that tree.sync can never fill (the case this function's header
  #    already names).
  #
  #    ⇒ so a caller that KNOWS the grove says so, and the ledger stays the
  #      authority for every caller that does not. the hint is optional, so the
  #      eight extant call sites are untouched.
  local grove_of="$grove_hint"
  if [[ -z "$grove_of" ]] && declare -F __crew_ledger_grove_of >/dev/null 2>&1; then
    grove_of="$(__crew_ledger_grove_of "$tree")"
  fi
  if [[ -n "$grove_of" && "$grove_of" != "cloud://"* && -n "$tree_dir" ]]; then
    printf '%s' "$tree_dir"; return 0
  fi

  local mirror
  # no local clone of this tree's repo => no mirror path to name. the root is
  # the honest fallback: it exists, it is where a clone would go, and it is not
  # a grove path that does not exist on this box.
  mirror="$(__crew_mirror_dir "$tree")" || { printf '%s' "$CREWWORK_GIT_ROOT"; return 0; }
  mkdir -p "$mirror" 2>/dev/null || true
  printf '%s' "$mirror"
}

# .what = build the duct uri for one role of one tree
#
# 🔴 .the ROLE gets a say in the host, and this is the ONE place it does
#
#   nine call sites build a uri through here — read, send, stop, refresh,
#   reboot, boot, resume, poll. to teach each of them about a local-only seat
#   would be nine readers of one rule, and a rule with nine readers is a rule
#   that drifts. so the override lives at the single seam they all cross.
#
#   ⚠️ measured 2026-09-10: the reviewer seat booted a LOCAL duct correctly and
#      `crew.read --who reviewer` then looked on the GROVE and reported the
#      session ABSENT — a confident verdict about the wrong box
#      (term=false-report). the boot half knew about the inversion; the read
#      half did not, because the knowledge sat in the boot verb rather than here.
__crew_duct_uri() {
  local host="$1" tree="$2" role="$3"
  host="$(__crew_role_host "$host" "$role")"
  printf 'duct://%s/%s/%s' "$host" "$tree" "$role"
}

# .what = turn a duct uri back into the crew-layer address a supervisor types
#         `duct://<host>/<tree>/<role>`  ->  `--tree <tree> --who <role>`
#
# .why  = the inverse of __crew_duct_uri, and it exists for ONE reason: a cure
#         we PRINT is a cure we TEACH.
#
# 🔴 .measured 2026-09-05. `git.crew.poll` — the instrument a supervisor reads
#    more often than any other, once per babysit tick — printed its two
#    advisory cures as `rhx duct.read --on 'duct://…'`. that is verbatim the
#    call rule.always.entool-the-layer-you-drop-below forbids a supervisor to
#    type, graded blocker with no first-one-free.
#
#    ⇒ so the rule's own substitution table said "never type this", and the
#      report that surfaces the work said "read it: <this>". the reader who
#      obeys the instrument violates the rule, and the reader who obeys the
#      rule must translate by hand on every tick — which is the tell of an
#      unentooled seam (rule.always.entool-the-skills-you-touch: a step you
#      still perform by hand after the call is a defect in the TOOL).
#
# ⚠️ .the grove is DROPPED on purpose, and that is the whole point rather than
#    a loss. a crew verb derives its box from the ledger
#    (__crew_ledger_grove_of), so a hand-carried host is not merely redundant —
#    it is the re-derivation the 2026-09-03 sweep was written to end. the uri
#    names a machine; the address names the work.
__crew_uri_address() {
  local uri="${1#duct://}"
  local role="${uri##*/}"
  local rest="${uri%/*}"
  local tree="${rest#*/}"
  printf -- '--tree %s --who %s' "$tree" "$role"
}

# .what = split a comma list into the caller's named array
__crew_roles_into() {
  local -n out="$1"
  local csv="$2"
  local saved="$IFS"
  out=()
  IFS=','
  local r
  for r in $csv; do
    [[ -n "$r" ]] && out+=("$r")
  done
  IFS="$saved"
}

# .what = does this tree have any live duct?
# .why  = crew.show opens a VIEW onto work that must already exist. a tab
#         attached to an absent session dies within ~0.3s and leaves a
#         registry row behind, so we check first and name the fix.
# .what = does this tree have at least one live duct?
#
# .why the CANONICAL compare, and not a raw string match
#   tmux forbids '.' in a session name and silently writes '_', so the
#   same tree carries two name forms: `a.b.c` from the caller, `a_b_c`
#   from tmux. a raw `==` match never fires across that gap.
#
#   the cost was live: `crew.boot --tree a.b.c` brought two ducts up and
#   `crew.show --tree a.b.c` then reported "no ducts", on a crew booted
#   one second earlier. that report comes in its ordinary shape, exits
#   non-zero for a real-looking reason, and is untrue
#   (term=false-report). worse, it names a fix that cannot help: it
#   tells you to boot a crew that is already up.
#
#   so compare canonically. both name forms collapse to one, and the
#   verb answers about the CREW rather than about a name form.
#
# ⚠️ .the HOST is an argument, and the default is LOCALHOST
#   this pinned `localhost` outright, so `crew.show` on a cloud crew asked THIS
#   box whether a grove's ducts exist — and got a truthful "no" about a machine
#   the question was not about. that is the same family the fleet has now caught
#   six times over; the cure is never a smarter check, it is to let the host be
#   DATA the caller already holds.
__crew_has_ducts() {
  local tree canon session host
  tree="$1"
  host="${2:-}"
  [[ -n "$host" ]] || host=localhost
  canon="$(__crew_canon_name "$tree")"
  while IFS= read -r session; do
    [[ "$session" == */* ]] || continue
    [[ "$(__crew_canon_name "${session%/*}")" == "$canon" ]] && return 0
  done < <(__duct_list_host_sessions "$host")
  return 1
}

######################################################################
# the crew LEDGER — the durable record that a crew was EVER booted
#
# .why = no other source can answer "was a crew ever booted on this
#        tree?", and three were tried before this existed:
#
#          live tmux        -> answers "at work NOW". a stopped crew
#                              vanishes, so it under-reports by design
#          duct registry    -> ERASED on stop. __duct_unregister_duct
#                              does `rm -f` AND rmdirs the parent, so
#                              the evidence is destroyed by the very
#                              act whose history we want to read
#          worktrees on disk-> answers "a TREE exists", never "a crew
#                              worked it". measured 142 trees against
#                              ~14 that ever had ducts, so it reports
#                              ~128 crews that were never born. that
#                              is the wrong LAYER: the list of every
#                              tree is `git tree status --repo @all`
#
#        so existence and liveness have different lifetimes AND
#        different sources, and only a ledger spans both. it is
#        written on boot and NEVER removed on stop — that asymmetry
#        is the whole point, and it is deliberate.
#
# .the record = ~/.crewwork/crews/<tree>.json, keyed by the CANONICAL
#        (dotted) tree name, so a tree registered under both the dotted
#        and the tmux underscore form collapses to ONE row.
#
# .idempotent = an upsert. a re-boot refreshes bootedLast and preserves
#        bootedFirst, so the ledger converges rather than duplicates
#        (rule.require.idempotent-operations).
######################################################################

CREWWORK_DIR="${CREWWORK_DIR:-$HOME/.crewwork}"

# .what = collapse a tmux-form (underscore) tree name to its canonical
#         dotted form, so both name forms key ONE ledger row
# .why  = tmux forbids '.' in a session name and silently writes '_',
#         so one tree registers under two names. keyed raw, the ledger
#         would carry two rows for one crew and the poll would report
#         it twice with verdicts that can disagree (term=false-report)
__crew_canon_name() { printf '%s' "${1//_/.}"; }

# .what = the TMUX form of a tree name — the spelling the substrate needs
# .why  = the mirror of __crew_canon_name, and both are needed. tmux
#         forbids '.' in a session name, so anything handed DOWN to the
#         substrate (term.open, tmux itself) takes underscores, while
#         anything compared or keyed takes the canonical dots. a caller
#         may hand either form to a crew verb, so every verb converts at
#         its own boundary rather than demand one form of the human.
__crew_tmux_name() { printf '%s' "${1//./_}"; }

# .what = does a LIVE duct exist for this ONE tree+role on this host
#
# .why  = __crew_has_ducts answers the question per TREE, and the tabless
#         defect below is per ROLE — a crew with a live mechanic and a dead
#         reviewer answers `yes` to the tree question and tells you naught
#         about the seat you asked after.
#
# 🔴 .the ROLE is canonicalized too, and for exactly the tree's reason
#
#   tmux rewrites EVERY '.' in a session name to '_' — the whole name, not the
#   tree half (ductwork.sh, at the DUCT_NAME/DUCT_SESSION split). the tree was
#   defended against that from the start because every tree is `repo.beav.slug`;
#   the role never was, because every role was one bare word.
#
#   ⚠️ so a DOTTED role — `reviewer.take` — compares raw against tmux's
#      `reviewer_take` and misses. the miss is silent and inverts the verdict:
#      `crew.refresh`, `crew.reboot`, and `crew.heal --what seat` each read
#      `return 2` as "that duct is down" and say so about a seat that is plainly
#      alive (term=false-report).
#
#   measured 2026-09-13: `duct:///zz.probe/reviewer.take` opened clean and
#   `crew.list` printed its role back as `reviewer_take`.
#
#   ⇒ the cure is the symmetry, never a smarter compare: both halves of the
#     session name come from the same rewrite, so both get the same undo.
__crew_duct_has_role() {
  local tree="$1" role="$2" host="${3:-}"
  [[ -n "$host" ]] || host=localhost
  local canon canon_role session
  canon="$(__crew_canon_name "$tree")"
  canon_role="$(__crew_canon_name "$role")"
  while IFS= read -r session; do
    [[ "$session" == */* ]] || continue
    [[ "$(__crew_canon_name "${session##*/}")" == "$canon_role" ]] || continue
    [[ "$(__crew_canon_name "${session%/*}")" == "$canon" ]] && return 0
  done < <(__duct_list_host_sessions "$host")
  return 1
}

######################################################################
# the parts
######################################################################

# .what = load every part of this lib — ALWAYS, and all of them
# .why  = crewwork outgrew the window a reviewer reads in one pass (181.5k
#         tokens = 91% of it), so no lens could grade it whole. the parts cut
#         it along the subjects its own function prefixes already named.
#
#         the list is EXPLICIT, never a glob: the set of parts is the claim.
#         a glob would load a stray file as silently as it would skip a
#         renamed one. `shellLibParts.integration.test.ts` holds this list
#         equal to the files on disk, so a part added or dropped fails loud.
#
#         each part holds only function definitions, so the load order among
#         them is free — a call resolves at run time, never at source time.
#         they load LAST so every core definition and constant is in place.
#
# 🔴 a caller sources crewwork.sh, never a part. a part sourced alone is a
#    half-defined lib that fails on its first call into the core.
CREWWORK_PARTS=(ledger view pane heal boot fell modal)
__crew_load_parts() {
  local here part
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  for part in "${CREWWORK_PARTS[@]}"; do
    if [[ ! -f "$here/crewwork.$part.sh" ]]; then
      echo "💥 MalfunctionError: crewwork part absent: $here/crewwork.$part.sh" >&2
      return 1
    fi
    source "$here/crewwork.$part.sh"
  done
}
__crew_load_parts || return 1
