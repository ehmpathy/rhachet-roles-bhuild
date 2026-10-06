#!/usr/bin/env bash
######################################################################
# .what = read EVERY live duct of a role, in parallel, in one call
#
# .why  = the babysit sweep reads the whole fleet every tick. done one
#         duct at a time that is N sequential round trips, and each one
#         costs a tool call. this reads them ALL at once and prints one
#         report.
#
#         it derives the fleet LIVE from duct.list every run, so it
#         never babysits a dead tree nor misses a fresh one. see
#         rule.require.babysit-cron-per-dispatch-fleet, which forbids a
#         hardcoded fleet for exactly that reason.
#
#         it also reports, per duct, whether the pane CHANGED since the
#         prior poll — a deterministic content-hash compare, never a
#         guess. that is the stall signal the sweep needs: a duct whose
#         pane is byte-identical across two polls has not moved.
#
# usage:
#   rhx duct.poll                          # the FLEET: every $tree/$role duct
#   rhx duct.poll --role mechanic          # only the mechanic side
#   rhx duct.poll --role foreman           # only the foreman side
#   rhx duct.poll --role any               # + the human's own shell ducts
#   rhx duct.poll --lines 80               # deeper tail per duct
#   rhx duct.poll --only rhachet           # only ducts whose address holds it
#   rhx duct.poll --changed                # print ONLY ducts that moved
#   rhx duct.poll --help
#
# args:
#   --role     scope to sweep: fleet (default) | mechanic | foreman | any
#              fleet = every duct shaped $tree/$role — i.e. every duct a
#              supervisor is responsible for, and none of the human's own
#   --lines    lines of pane to capture per duct (default: 40)
#   --only     text filter on the duct address (optional)
#   --brief    print ONLY the verdicts, no pane bodies (the babysit shape)
#   --changed  print only ducts whose pane changed since the prior poll
#   --timeout  seconds to wait per duct before it is called ⏳ (default: 15)
#   --local    skip REMOTE ducts entirely (local fleet only)
#   --help,-h  show usage and exit
#
# .why a per-duct TIMEOUT is mandatory, not a nicety
#   a REMOTE duct is read over ssh, and a grove box hibernates after an
#   idle window — so a read of a sleeping grove blocks until tcp gives
#   up, which is minutes. with a plain `wait`, that ONE duct freezes the
#   whole sweep and the other three never print. this was observed on
#   the first live run: `duct://grove-1/main/mechanic` hung the report.
#
#   so every read is bounded. a duct that overruns is reported ⏳ and
#   the sweep prints the rest — a slow box must never hide a live fleet.
#
# .why READ-ONLY, always
#   this skill never sends a key, never approves a prompt, never stops a
#   duct. a sweep that could act would be a sweep you cannot run without
#   a second thought. act with duct.send AFTER you have read and judged
#   — see rule.require.babysit-permission-approval.
#
# guarantee:
#   - fleet derived live from duct.list on EVERY run (never hardcoded)
#   - all ducts read in PARALLEL; output printed in stable sorted order
#   - a duct that fails to read is reported as 💥 and never aborts the
#     sweep — one broken duct must not hide the other three
#   - read-only: no send, no stop, no mutation of any duct
#   - exit 0 = polled, exit 1 = malfunction, exit 2 = constraint
######################################################################

set -euo pipefail

# source ductwork functions (duct.list / duct.read) from the REPO's own lib.
#
# .why the repo, not ~/.bash_aliases: the global dotfiles are owned by
#      dev-env-setup's install_env, so what we write there is one reinstall from
#      erased and one shared name away from a collision. the lib beside this
#      skill is ours alone — it versions with the skills that call it, and it
#      ejects into rhachet-roles-bhuild as one unit.
DUCTWORK_LIB="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"
source "$DUCTWORK_LIB"

######################################################################
# args
######################################################################
role="fleet"
brief=""
lines=40
only=""
changed_only=""
timeout_s=15
local_only=""

show_help() {
  echo "🦫 duct.poll — read every live duct of a role, in parallel"
  echo ""
  echo "  usage:"
  echo "    rhx duct.poll [--role fleet|mechanic|foreman|any] [--lines N] [--only <text>]"
  echo "                  [--changed] [--timeout N] [--local]"
  echo ""
  echo "  args:"
  echo "    --role     scope to sweep            (default: fleet)"
  echo "               fleet = every \$tree/\$role duct; excludes your own shells"
  echo "    --lines    pane lines per duct       (default: 40)"
  echo "    --only     text filter on address"
  echo "    --brief    verdicts only, no pane bodies (the babysit shape)"
  echo "    --changed  print only ducts that moved since the prior poll"
  echo "    --timeout  seconds per duct before ⏳  (default: 15)"
  echo "    --local    skip remote ducts (local fleet only)"
  echo ""
  echo "  example:"
  echo "    rhx duct.poll --role mechanic --lines 60"
  echo "    rhx duct.poll --local            # skip a hibernated grove"
  echo ""
  echo "  note: READ-ONLY. it never sends keys. act with duct.send after you judge."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --role) role="$2"; shift 2 ;;
    --lines) lines="$2"; shift 2 ;;
    --only) only="$2"; shift 2 ;;
    --changed) changed_only="1"; shift ;;
    --brief) brief="1"; shift ;;
    --timeout) timeout_s="$2"; shift 2 ;;
    --local) local_only="1"; shift ;;
    --help|-h) show_help; exit 0 ;;
    --skill|--repo) shift 2 ;;  # rhachet internal flags
    *) echo "✋ duct.poll: unknown arg '$1'" >&2
       echo "   └─ fix: see rhx duct.poll --help" >&2
       exit 2 ;;
  esac
done

case "$role" in
  mechanic|foreman|fleet|any) ;;
  *)
    echo "✋ duct.poll: --role must be mechanic | foreman | fleet | any (got '$role')" >&2
    echo "   └─ fix: rhx duct.poll --role fleet" >&2
    exit 2
    ;;
esac

if ! [[ "$lines" =~ ^[0-9]+$ ]]; then
  echo "✋ duct.poll: --lines must be a number (got '$lines')" >&2
  echo "   └─ fix: rhx duct.poll --lines 40" >&2
  exit 2
fi

if ! [[ "$timeout_s" =~ ^[0-9]+$ ]]; then
  echo "✋ duct.poll: --timeout must be a number of seconds (got '$timeout_s')" >&2
  echo "   └─ fix: rhx duct.poll --timeout 15" >&2
  exit 2
fi

######################################################################
# 1. derive the fleet LIVE
#
# .why parse duct.list's PUBLIC output rather than the registry files:
#      the registry layout is ductwork's private business; the printed
#      `duct://…` address is its published contract. a parse of the
#      private shape would break the day the registry moves.
######################################################################
fleet_raw="$(duct.list 2>/dev/null || true)"
if [[ -z "$fleet_raw" ]]; then
  echo "✋ duct.poll: duct.list yielded no output" >&2
  echo "   └─ fix: check ductwork is sourced — rhx duct.list" >&2
  exit 1
fi

# pull every duct:// address, filter by role + --only, sort for stable order
# a LOCAL address carries an empty authority — `duct:///…`, three slashes.
# --local keeps only those, which is how a hibernated grove is skipped.
addresses="$(
  echo "$fleet_raw" \
    | grep -o 'duct://[^[:space:]]*' \
    | {
        # .why `fleet` is a scope, not a role — and why it is the default
        #      a dispatch duct is ALWAYS duct://<host>/<tree>/<role>: two
        #      path segments. a human's own terminal is duct:///<name>: one.
        #      so the shape alone separates "a duct i supervise" from "a
        #      shell the human is typing in", with no enumerated role list
        #      to go stale when a new role appears.
        #
        #      --role mechanic was too NARROW (it never read a foreman, so
        #      a stalled foreman went unseen for a whole session), and
        #      --role any is too WIDE (it swept the human's personal shells
        #      and dumped their scrollback into the report). `fleet` is the
        #      set that actually wants babysitting.
        case "$role" in
          any)   cat ;;
          fleet) grep -E 'duct://[^/]*/[^/]+/[^/]+$' ;;
          *)     grep "/${role}\$" ;;
        esac
      } \
    | { if [[ -n "$local_only" ]]; then grep '^duct:///'; else cat; fi; } \
    | { if [[ -n "$only" ]]; then grep -- "$only"; else cat; fi; } \
    | sort -u \
    || true
)"

if [[ -z "$addresses" ]]; then
  echo "🦫 duct.poll — fleet is empty"
  echo "   ├─ role: $role"
  [[ -n "$only" ]] && echo "   ├─ only: $only"
  echo "   └─ no duct matched — none to poll"
  exit 0
fi

count="$(echo "$addresses" | wc -l | tr -d ' ')"

######################################################################
# 2. read them ALL in parallel
#
# .why a temp file per duct, then print in order: parallel writes to one
#      stream interleave and shred each other's lines. each reader owns
#      its own file, and the print loop walks them in sorted order — so
#      the report is deterministic even though the reads race.
######################################################################
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

# the prior-poll hash cache — global, so a poll from any cwd compares
# against the same baseline
#
# .note = the segment was `repo=.this/role=any` at origin, where this skill
#         lived in one repo's own registry. it now ships in a package, so it
#         keys on the registry + role it actually belongs to — the same shape
#         `radio.uses` already uses (`repo=bhuild/role=dispatcher/.meter`).
#         ⚠️ a grove with a pre-lift cache keeps it at the old path; the first
#         poll after an upgrade re-baselines, which costs one noisy report and
#         no correctness.
cache_dir="${HOME}/.rhachet/storage/repo=bhuild/role=supervisor/skill=duct.poll"
mkdir -p "$cache_dir"

idx=0
while IFS= read -r uri; do
  [[ -n "$uri" ]] || continue
  idx=$((idx + 1))
  slot="$(printf '%04d' "$idx")"
  echo "$uri" > "$tmpdir/$slot.uri"

  (
    # a duct address is duct://<host>/<session>; local hosts are empty,
    # so a local address carries THREE slashes. tmux stores dots as
    # underscores, so convert the SESSION only — a remote host may hold
    # dots of its own (a fqdn) and must survive untouched.
    rest="${uri#duct://}"
    uri_host="${rest%%/*}"
    uri_session="${rest#*/}"
    read_uri="duct://${uri_host}/${uri_session//./_}"

    # bound EVERY read. `timeout` exits 124 when it fires, which we keep
    # distinct from a plain failure — a slow duct and a broken duct are
    # different facts and must not be reported as one.
    set +e
    if command -v timeout >/dev/null 2>&1; then
      pane="$(timeout "$timeout_s" bash -c \
        "source '$DUCTWORK_LIB'; duct.read --on '$read_uri' --lines '$lines'" 2>&1)"
      rc=$?
    else
      pane="$(duct.read --on "$read_uri" --lines "$lines" 2>&1)"
      rc=$?
    fi
    set -e

    echo "$pane" > "$tmpdir/$slot.pane"
    echo "$rc" > "$tmpdir/$slot.code"

    # ── what sits after the ❯? ───────────────────────────────────────
    # .why this cannot be read off $pane: capture-pane strips ANSI, and
    #      the ONLY difference between a human's unsent message (white)
    #      and an autocomplete ghost (gray) is the color. from the plain
    #      pane the two are identical text, so any verdict from it is a
    #      guess — and a guess that submits a ghost fabricates a human
    #      instruction. see rule.require.distinguish-prefilled-from-suggested.
    #
    # .how  a second, raw capture keeps the escapes.
    #
    # .the FULL case list — every state a ❯ can be in
    #   enumerated up front ON PURPOSE. three separate defects shipped
    #   here in one day, each because a case was met for the first time
    #   in the wild rather than modelled in advance:
    #     1. NBSP fallthrough — matched "❯ " with a plain space, never
    #        fired, fell through to `prefilled`, and labelled a PROVEN
    #        ghost a real human message
    #     2. NBSP trim — U+00A0 is not POSIX [[:space:]], so an empty
    #        box survived the trim and read as a 1-char message
    #     3. menu cursor — a permission prompt's "❯ 1. Yes" is the LAST
    #        ❯ in the pane, so tail -n 1 grabbed the MENU cursor and
    #        read "1. Yes" as text a human typed
    #     4. menu cursor, INVERTED — the fix for 3 assumed the menu owns the
    #        last ❯. it does not: claude still renders the input box BELOW
    #        the menu, so tail -n 1 read the EMPTY BOX and reported `empty`
    #        while a mechanic sat stalled on a live approval prompt. two
    #        mechanics were parked this way and the sweep never said so
    #   each was caught by a human, not by the detector. so:
    #
    #   | state       | tell                                  | act |
    #   |-------------|---------------------------------------|-----|
    #   | none        | no ❯ anywhere                         | plain shell duct |
    #   | covered     | ❯ present, but NONE inside box chrome  | claude live, box overdrawn — READ, never key |
    #   | prompt      | modal chrome ANYWHERE in the pane     | STALLED — decide |
    #   | empty       | empty after ❯, or SGR 7 cursor block  | idle |
    #   | suggested   | SGR 2 (dim) = autocomplete ghost      | NEVER Enter |
    #   | prefilled   | normal intensity = really typed       | relay if steady |
    #   | unknown     | remote, or no attribute read          | treat as ghost |
    #
    # .why UNKNOWN is the DEFAULT, and prefilled must be positively proven
    #      a fallthrough that lands on "real message" is the ONE direction
    #      this must never fail in — that is the direction that fabricates
    #      a human instruction. so no path yields `prefilled` except a
    #      positively-read normal-intensity attribute.
    # .why the raw capture goes through the LIB, on either host
    #      it read `tmux capture-pane` directly, guarded by an
    #      `if [[ "$uri_host" == "" ]]` that wrapped this entire classifier —
    #      so on a grove duct not one line of it ran, `box` kept its
    #      `unknown` default, and `stone` grepped an unset `$flat`.
    #      measured 2026-09-03: 11 of 11 grove ducts `❔unknown`, no local
    #      duct ever. `unknown` routes to "treat as a ghost", so a grove
    #      clone halted on a live modal could not report `🚧 PROMPT` and
    #      rendered no route position — the cloud fleet was invisible to
    #      the one instrument the babysit tick reads.
    #      `duct.read --raw` is now host-aware, so the classifier is too.
    # .why the guard is now the READ's exit code, never the host
    #      `unread` is the right verdict for a pane we could not read — an
    #      unreachable grove, an absent session. it was the wrong verdict
    #      for a pane we read fine and declined to look at.
    # .why the DEFAULT is `unread` rather than `unknown`
    #      a default is the verdict rendered when no branch ran, and no
    #      branch ran means no pane was judged. `unknown` claims the ladder
    #      ran and matched no arm, which is a claim about a pane we hold —
    #      so as a default it would assert a read that never happened. the
    #      safe default is the one that promises the least.
    #
    # 🔴 .and a FAILED read still carries a verdict — `absent` is not `unread`
    #      the read's own words part its two causes, and the split is made in
    #      ductwork (`__duct_read_outcome`) so it is clampable with no fleet.
    #      `unread` means the state is genuinely unknown, and its cure is to
    #      read again. `absent` means the session is NOT THERE — a positive
    #      fact — and its cure is a fell or a boot. to render an absent seat
    #      `unread` prescribes a command that can never succeed.
    #
    #      measured 2026-09-17 on rhachet-roles-bhrain.beav.feat-prescribed-
    #      brain-per-stone: the poll said `reviewer:❔unread`, the re-read it
    #      prescribed exited 1, and the seat turned out to be a dead local
    #      registry row for the legacy bare `reviewer`. the absent-session
    #      sentence was already in `$pane` and was thrown away right here.
    box="unread"
    case "$(__duct_read_outcome "$rc" "$pane")" in
      absent) box="absent" ;;
    esac
    box_text=""
    if [[ $rc -eq 0 ]]; then
      set +e
      raw="$(timeout "$timeout_s" bash -c \
        "source '$DUCTWORK_LIB'; duct.read --on '$read_uri' --lines '$lines' --raw" 2>/dev/null)"
      # 🔴 .the ❯ carries THREE senses, and only ONE of them is an input box
      #      claude renders `❯` for its live input cursor, for a menu cursor,
      #      AND for every PAST HUMAN TURN in the transcript. so `grep ❯ |
      #      tail -1` does not find the box — it finds whichever sense sits
      #      lowest, and a scrolled-back human message wins whenever the box
      #      is overdrawn.
      #
      # .the measured case — 2026-09-04, foreman of fix-node-pty-install
      #      an editor was opened in the pane and drew over claude's box. the
      #      lowest ❯ was then a human question from 513m earlier, which claude
      #      had ALREADY ANSWERED two lines below it. the sweep reported
      #      `✍️prefilled, still 513m` — a live unsent message.
      #
      # 🔴 .why the --raw ghost check CANNOT catch this
      #      rule.require.distinguish-prefilled-from-suggested guards white vs
      #      gray, and that text is genuinely WHITE — it is a real human
      #      message. it is simply not in the box. the ghost check parts LIVE
      #      from GHOST; it is blind to LIVE from HISTORICAL. so the one guard
      #      the babysit protocol leans on passes, and an Enter then submits
      #      into whatever program owns the keyboard.
      #
      # .the cure is the one the PROMPT check already learned, one arm over:
      #      key on the CHROME, never on the cursor. claude draws the input box
      #      between two ─── rules, so the box's ❯ is the one whose NEXT line
      #      carries a rule. no transcript turn has one.
      line="$(printf '%s\n' "$raw" | awk '
        { if (prev_caret && index($0, "───") > 0) found = prev_raw
          prev_caret = (index($0, "❯") > 0); prev_raw = $0 }
        END { print found }
      ')"
      # a ❯ that is NOT the box — kept so the arms below can part "no claude
      # here at all" from "claude is here and a program is drawn over it"
      caret_bare="$(printf '%s\n' "$raw" | grep -a '❯' | tail -n 1)"
      # the WHOLE pane, escapes stripped + NBSP folded. the PROMPT check reads
      # this, not one line — see .why below.
      flat="$(printf '%s\n' "$raw" \
        | sed 's/\x1b\[[0-9;]*m//g' \
        | sed 's/\xc2\xa0/ /g')"
      set -e

      # .why the PROMPT check reads the PANE, and runs before all else
      #      a modal is a property of the pane, not of any single line. two
      #      earlier attempts keyed on the ❯ cursor and both misread it: the
      #      menu is not the last ❯ (claude keeps an input box below it), and
      #      a wrapped option loses the "N. " shape entirely ("2Yes, and…").
      #      so key on the modal's own CHROME, which no other pane state
      #      renders and no wrap can mangle. a stalled mechanic is the single
      #      most actionable verdict a sweep can yield — it must never depend
      #      on where a cursor happened to land.
      # .why the ASK tells are checked FIRST, and why that order is the fix
      #      `prompt` covers TWO states whose moves are OPPOSITE:
      #        perm — a permission modal. yours to judge, --keys 1 or the No
      #        ask  — a design question the clone put to the HUMAN. a key here
      #               records a decision in their name; it is NEVER yours
      #      the ask tells are claude's own design-prompt CHROME — a permission
      #      modal renders none of them, ever. so they are checked first and
      #      they WIN, which is the only order that cannot misroute.
      #
      # .why `Esc to cancel` is NOT a perm tell, and why it once was
      #      it is SHARED chrome: every claude modal ends in it, of either
      #      kind. so it proves a modal is UP and proves naught about which
      #      one — the comment above said exactly that while the code below
      #      listed it as a perm discriminator anyway.
      #
      #      it is also the worst possible one to misuse, because it is the
      #      modal's LAST line: whatever truncation, wrap, or half-drawn
      #      render drops the ask tells, `Esc to cancel` survives. so the
      #      failure was not rare — it was the DEFAULT outcome of any partial
      #      read. observed 2026-08-31: a live 5-option design council read
      #      `🚧prompt` for one whole tick, and only step 0 of
      #      howto.review-permission-requests caught it.
      #
      # .why it now FAILS CLOSED — a modal of unknown kind is an ASK
      #      the costs are not symmetric. a perm read as an ask costs ONE
      #      message: the supervisor surfaces it and is told to judge it. an
      #      ask read as a perm costs an unrecoverable decision recorded in
      #      the human's name. so the `elif` chain must never end at `perm`.
      #      where a modal is up and neither tell set claims it, we take the
      #      safe move — send no keys, read it, surface it — and we SAY that
      #      the kind was undetermined rather than assert one.
      # .why an EMPTY capture is UNREAD, and never a plain shell
      #      the `-z "$line"` arm below reads "no ❯ in the pane" as "a plain
      #      shell duct". that inference holds only where the pane was truly
      #      read. where the raw capture comes back empty — an ssh that
      #      overran --timeout, a grove that hibernated mid-sweep — `line` is
      #      empty for the OPPOSITE reason, and the ladder still lands on
      #      `none`: a positive claim that the duct holds a bare shell, made
      #      about a pane nobody saw.
      #
      #      that is term=false-report exactly. d1 — did the tool fail? no:
      #      exit 0, a verdict rendered. d2 — is the content untrue? yes. it
      #      is the SAME defect the host-gate repair above cured, one branch
      #      over: there the read was declined, here it was attempted and lost.
      #
      #      the discriminator costs naught. a capture-pane of a live session
      #      is never empty — it always carries at least a prompt line. so an
      #      empty capture means the pane went UNREAD.
      #
      # ⚠️ .why it is `unread` and NOT `unknown` — measured 2026-09-03
      #      this arm first rendered `unknown`, which was already the verdict
      #      of the ladder's own tail (an ❯ carrying no sgr code). one word,
      #      two opposite senses:
      #
      #        | branch        | what we saw          | what a reader may do |
      #        |---------------|----------------------|----------------------|
      #        | HERE          | not one byte         | re-read it           |
      #        | ladder's tail | the pane, in full    | judge the text       |
      #
      #      that is rule.forbid.domain-term-ambiguity, and it is not
      #      cosmetic — BOTH render sites gloss the branch they do not cover.
      #      the row said "pane unread" over a pane read in full, and the
      #      fleet tally said "box not empty" over a capture that was empty.
      #      each verdict was refuted by its own neighbour's prose.
      #
      #      the cost is a diagnosis that cannot start. a supervisor holding
      #      `❔unknown` cannot tell whether to re-read the duct or to read
      #      the text it already carries — so it must reach past the sweep to
      #      find out, which is the byhand path the sweep exists to retire.
      #      measured on the foreman of fix-grepsafe-slashed-glob: four calls
      #      to reach a question one verdict should have answered.
      if [[ -z "$raw" ]]; then
        box="unread"
      # 🔴 a HUSK — claude EXITED and left its `Resume this session with:` banner,
      #   yet the pane still holds the STALE ❯ box claude drew before it died. that
      #   stale caret would otherwise classify below as a live box (covered/
      #   prefilled), so a dead mechanic reads as ALIVE — svc-reservations sat 8h as
      #   `😴 unread` after a 💥143, invisible to the tick. the discriminator lives
      #   in ductwork so it is clampable in isolation (rule.require.clamp-edge-cases).
      elif __duct_pane_is_husk "$flat"; then
        box="husk"
      # .why checked FIRST, ahead of ask/perm/unsure (task #24, measured
      #      2026-09-07 on rhachet.beav.fix-node-pty-install): claude's own
      #      periodic product-satisfaction survey shares the numbered-choice
      #      shape of a real permission modal, and a survey alone (no other
      #      modal in the same pane) fell through the whole ladder to the
      #      unclassified default arm — rendered `🚧 PROMPT`, joined as
      #      `blocked:on-supervisor`. a `--keys 1` there would file a product
      #      score under the human's name (rule.require.babysit-permission-
      #      approval forbids the reply either way). the label text is a
      #      fixed literal, so it is checked before any coincidental overlap
      #      further down the ladder can claim it.
      elif printf '%s\n' "$flat" | grep -qaE 'How is Claude doing this session|0: Dismiss'; then
        box="prompt"; box_kind="survey"
        box_text="$(printf '%s\n' "$flat" \
          | grep -aE '^[[:space:]]*[❯>]?[[:space:]]*[0-9]+:?[[:space:]]*[A-Za-z]' \
          | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
          | tr '\n' '|')"
      elif printf '%s\n' "$flat" | grep -qaE 'Chat about this|\(Recommended\)|Tab/Arrow keys'; then
        box="prompt"; box_kind="ask"
        box_text="$(printf '%s\n' "$flat" \
          | grep -aE '^[[:space:]]*[❯>]?[[:space:]]*[0-9]+\.?[[:space:]]*[A-Za-z]' \
          | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
          | tr '\n' '|')"
      elif printf '%s\n' "$flat" | grep -qaE 'Do you want to proceed|Do you want to make this edit|Do you want to create|requires approval'; then
        box="prompt"; box_kind="perm"
        # carry the whole option set, not just the cursor — a supervisor
        # cannot judge a choice whose alternatives it cannot see. the shape is
        # loose on purpose: a narrow pane wraps "2. Yes, and…" to "2Yes, and…"
        box_text="$(printf '%s\n' "$flat" \
          | grep -aE '^[[:space:]]*[❯>]?[[:space:]]*[0-9]+\.?[[:space:]]*[A-Za-z]' \
          | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
          | tr '\n' '|')"
      elif printf '%s\n' "$flat" | grep -qa 'Esc to cancel'; then
        # a modal IS up — that is all `Esc to cancel` proves — and neither
        # tell set claimed it. fail closed toward `ask`, whose move (send no
        # keys, read it, surface it) is safe under either kind. the render
        # says the kind was undetermined, so no reader banks it as a verdict
        box="prompt"; box_kind="unsure"
        box_text="$(printf '%s\n' "$flat" \
          | grep -aE '^[[:space:]]*[❯>]?[[:space:]]*[0-9]+\.?[[:space:]]*[A-Za-z]' \
          | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
          | tr '\n' '|')"
      # ⚠️ two different worlds, and the old code called both `none`
      #   no ❯ at all           -> there is no claude here. a plain shell duct
      #   ❯ present, none chromed -> claude IS here, and its box is overdrawn
      # the second is NOT a shell duct, and to render it as one tells a
      # supervisor to boot a clone that is already alive.
      # 🔴 the chrome test is the THIRD conjunct, and it is what parts "no claude
      #   here" from "claude is here and drew no caret in this window".
      #
      #   `❯` is ONE piece of claude's chrome. this arm read its absence as the
      #   absence of claude ITSELF, and for a mechanic the crew fold turns that
      #   into `💀 husk` — a state whose cure REBOOTS, which would burn a live
      #   conversation (rule.forbid.byhand-fix-that-burns-the-live-proof).
      #
      #   measured 2026-09-16 on
      #   `rhachet-roles-ehmpathy.beav.feat-auto-review-permission-responses`:
      #   30 captured lines, zero `❯`, last line `⏵⏵ accept edits on (shift+tab
      #   to cycle)`. the poll rendered `mechanic:shell → 🚦 1 husk → --healable`
      #   while `crew.heal` read the same pane and answered "a live claude box is
      #   up — not a husk". the parity invariant forbids exactly that split
      #   (define.invariant.crew.husk.discriminator-parity), and heal was right.
      #
      # ⚠️ it cannot RESCUE a husk: `__duct_pane_is_husk` runs above this arm, so
      #   a resume banner has already claimed the pane before the chrome is read.
      elif [[ -z "$line" && -z "$caret_bare" ]] && ! __duct_pane_has_claude_chrome "$flat"; then
        box="none"   # no claude input box (a plain shell duct)
      # claude IS here — its chrome is drawn — and no caret reached this window.
      # that is the `covered` sense (the ladder worked; the box is not visible),
      # never `none` (boot a clone that is already alive).
      elif [[ -z "$line" && -z "$caret_bare" ]]; then
        box="covered"
        box_text=""
      elif [[ -z "$line" ]]; then
        # 🔴 fail CLOSED — and in its OWN state, never folded into `unknown`
        #   this file already rules that two verdicts with OPPOSITE cures may
        #   not share a row (see .why `unread` and `unknown` are two rows).
        #     unknown -> the ladder matched no arm. the LADDER is the defect
        #     covered -> the ladder worked. claude is alive and a program is
        #                drawn over its box. NO code defect — read the pane
        #   to render this as `unknown` would send a reader to fix a ladder
        #   that is already correct. to render it as `none` would tell them to
        #   boot a clone that is already alive. both are real byhand detours.
        box="covered"
        box_text="$(printf '%s' "${caret_bare#*❯}" \
          | sed 's/\x1b\[[0-9;]*m//g' \
          | sed 's/\xc2\xa0/ /g' \
          | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
      else
        # all that follows the ❯ — whitespace-agnostic, so a plain space and
        # a no-break space are handled alike
        seg="${line#*❯}"

        # the FIRST sgr code after the ❯ names the state:
        #   2  = dim     -> autocomplete ghost
        #   7  = reverse -> bare cursor block, empty buffer
        #   else         -> normal intensity -> really typed
        sgr="$(printf '%s' "$seg" \
          | sed -n 's/^[^\x1b]*\x1b\[\([0-9;]*\)m.*/\1/p' | head -n 1)"
        # NBSP (U+00A0 = c2 a0) is NOT a POSIX [[:space:]], so it survives a
        # plain trim and an empty box then reads as text. fold it to a space
        # BEFORE the trim, or every idle duct reports a one-char "message".
        plain="$(printf '%s' "$seg" \
          | sed 's/\x1b\[[0-9;]*m//g' \
          | sed 's/\xc2\xa0/ /g' \
          | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"

        # a SECOND prompt tell, kept as a backstop to the pane-chrome check
        # above: the ❯ points at a numbered option. it fires when the modal's
        # chrome has scrolled out of the captured tail but its menu has not.
        # an input box never opens with "N. ", so the shape stays unambiguous.
        # it is a backstop ONLY — it misses a prompt whenever the input box
        # sits below the menu, which is the common case (defect 4).
        if [[ "$plain" =~ ^[0-9]+\.[[:space:]] ]]; then
          box="prompt"
          box_text="$(printf '%s\n' "$flat" \
            | grep -aE '^[[:space:]]*[❯>]?[[:space:]]*[0-9]+\.?[[:space:]]*[A-Za-z]' \
            | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
            | tr '\n' '|')"
        elif [[ -z "$plain" ]]; then box="empty"
        # claude's own placeholder, NOT an autocomplete ghost. it renders dim,
        # so it would otherwise report as `suggested` — safe (never submitted)
        # but a waste of a real signal: it means input WAITS in the queue while
        # the mechanic is busy. that state is distinct, benign, and clears
        # itself. call it what it is.
        elif [[ "$plain" == *'to edit queued messages'* ]]; then box="queued"
        elif [[ "$sgr" == "2" ]]; then box="suggested"; box_text="$plain"
        elif [[ "$sgr" == "7" ]]; then box="empty"
        elif [[ -n "$sgr" ]]; then box="prefilled"; box_text="$plain"
        else box="unknown"; box_text="$plain"
        fi
      fi
    fi
    # .what = the route's own status line, which claude renders at the pane foot
    # .why  = `empty` is the ONLY verdict that routes by OWNER rather than by
    #         itself: a stone that awaits approval is the human's, a blocked
    #         peer review is the driver's, a survey is the supervisor's. the box
    #         says `empty` to all three, so a tick had to drill into each one to
    #         tell them apart — a byhand loop over exactly the subject set this
    #         sweep exists to cover (rule.require.bulk-over-byhand).
    # .note  = it is a PROXY. it reports the ROUTE's record, never who sits at
    #         the keyboard and never what runs right now. observed stale by two
    #         iterations against the artifacts its own clone was mid-write.
    #         so it narrows the drill-in; it never replaces it.
    # 🔴 .why `box == "none"` must never feed this grep (task #31, measured
    #      2026-09-08, rhachet.beav.fix-keyrack-all-skips-manifest): `none`
    #      already says claude is ABSENT from this pane — a ^C'd clone leaves
    #      its last 🗿 line sitting in tmux scrollback, and `tail -n 1` over
    #      the whole flat capture cannot tell that relic apart from a live
    #      one. rendered as "this role's stone" it is a false report: a true
    #      "a 🗿 line exists somewhere in this pane" dressed as "this is the
    #      CURRENT route state" — the SPENT-RENDER class (progress.2026-09-08
    #      round 10; the coined word is `relic`).
    if [[ "$box" == "none" || "$box" == "husk" ]]; then
      stone="relic — no live clone in this pane; a stale 🗿 line sits in scrollback, not current route state"
    else
      stone="$(printf '%s\n' "${flat:-}" | grep -a '🗿' | tail -n 1 \
        | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' || true)"
    fi

    # 🔴 .what = the VENDOR USAGE CAP, and its reset time, lifted verbatim
    # .why  = a capped clone is the most expensive state the fleet can hold, and
    #        it is the ONLY one that renders identically to health. the pane
    #        keeps its last stone, its box is empty, and no verdict anywhere
    #        says "this clone cannot take a turn." so a sweep reports it idle
    #        and a supervisor routes it by a status line that froze hours ago.
    #
    #        measured 2026-09-03: FIVE clones sat capped across three ticks on
    #        one account-wide reset. every one was found by a human who asked
    #        "what do you see on that duct?" — one drill-in at a time, which is
    #        the byhand loop this sweep exists to retire
    #        (rule.require.bulk-over-byhand). one of the five had gone green on
    #        types, lint, 2123 unit and two acceptance suites, completed seven
    #        scoped lane re-runs at exit 0, and then sat frozen for three hours
    #        within one converge of done.
    #
    # ⚠️ .note = the cap line lives in SCROLLBACK, so its presence alone proves
    #        naught about now — a clone resumed an hour ago still carries it.
    #        this field therefore reports a SIGHTING, never a verdict. the
    #        judgment is made downstream in git.crew.poll, which joins three
    #        facts no single one of which is sufficient:
    #          the cap was seen · the reset has PASSED · the duct is UNCHANGED
    #        that last one is the extant motion signal, and it is what parts a
    #        clone that is stopped from one that is at work. to compose it
    #        beats a new spinner-tense heuristic, which would be one more
    #        fragile read of a neighbour's render (the r1/r2 lesson at the box
    #        arm above).
    cap="$(__duct_pane_cap_line "${flat:-}" || true)"

    # 🔴 .what = a RATE-LIMIT WEDGE — claude is ALIVE (its ❯ box is drawn) but it
    #        stopped on `API Error: Rate limit reached` and idled. distinct from
    #        the vendor CAP above: the cap is the account budget (auth.swap), this
    #        is a transient throughput cap (retry the turn). the pane renders
    #        identically to health — a live box, a stale stone — so a sweep reads
    #        it `at work` and nobody surfaces it (the wish this task tracks).
    # .why  = TAIL-scoped, same as heal's own discriminator (crewwork.sh
    #        __crew_heal_one): the same error higher in scrollback belongs to a
    #        turn claude already retried PAST, and to flag that is a
    #        term=false-report. and the box guard requires a LIVE claude box — a
    #        husk (box=husk) or a plain shell (none/unread) is a different defect
    #        with a different cure, so a wedge is ONLY a live-box-idle clone.
    # ⚠️ .note = SEEN, never WEDGED. like cap/plea, this asserts the pane CARRIES
    #        the banner in its tail; whether the clone is stopped RIGHT NOW is a
    #        join downstream in git.crew.poll (the extant motion signal parts a
    #        stopped clone from one mid auto-retry).
    ratelimit=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]] \
       && __duct_pane_has_ratelimit "${flat:-}"; then
      ratelimit=1
    fi

    # .what = the clone PRINTED the grant command a human must run
    #
    # .why  = a stone is the route's last SETTLED transition, and the transition
    #        that clears an approval gate is a HUMAN command. so a clone that has
    #        converged and now awaits `--as approved` can render a stone from
    #        well before it converged — and that stone will never advance on its
    #        own, because what advances it is the very command nobody has run.
    #
    #        ⚠️ the extant moved-discriminator in git.crew.poll does NOT catch
    #        this. that one asks "did this duct move THIS poll?", which parts a
    #        clone mid-turn from a parked one. this clone is genuinely parked —
    #        correctly still — and its stone is stale anyway. the two staleness
    #        kinds are independent, so they need independent tells.
    #
    #        measured 2026-09-03, svc-coaches fix-queue-addressed-by-access: the
    #        stone read `1.vision, review.peer, l1@i004, blocked ✋`, still 14m,
    #        which routes to the DRIVER. the pane held the clone's own summary —
    #        "i008: both lanes 0 blockers · 0 nitpicks … Eight rounds, two
    #        independent brains, 0 blockers throughout" — and, beneath it, the
    #        literal `route.stone.set … --as approved` it needed run. it had
    #        already spent the budget lever itself. a supervisor routed by the
    #        stone asked it why it could not get l1 to agree, which cost it a
    #        turn on a block it had closed four iterations earlier.
    #
    # ⚠️ .note = a SIGHTING, never a verdict — the same bound the cap above
    #        carries, for the same reason: this reads SCROLLBACK, so a clone
    #        whose gate was granted an hour ago still shows the line. and the
    #        driver briefs quote this command as prose ("you cannot grant
    #        --as approved"), so a pane that merely displays a brief matches
    #        too. the judgment joins downstream: the ask was seen · the duct is
    #        UNCHANGED · the stone does not already render 👋.
    #
    # ⚠️ .why the name is `plea` and NOT `ask`: `ask` is already a box_kind in
    #        this same file — a modal whose shape is a question rather than a
    #        permission. one word, one sense (rule.forbid.domain-term-ambiguity).
    #        `plea` names what the CLONE does — it names a human-only gate and
    #        prints the command to open it — which also parts it from
    #        `escalate`, the act a SUPERVISOR performs on the clone's behalf.
    #        it covers `--as approved`, `--as overruled`, and the future quota
    #        and release asks, and excludes both neighbours.
    # 🔴 .why this one JOINS THE LINES FIRST and the cap above does not
    #        `flat` is the pane with escapes stripped and its NEWLINES INTACT, so
    #        every grep over it matches one rendered ROW at a time. a cap line fits
    #        one row, so `[^|]*` serves it. a plea is a full rhx command that holds
    #        a --stone and often a --route, and a pane is as narrow as the terminal
    #        that drew it — measured at 27 columns on a scratch duct, where it wraps:
    #          rhx route.stone.set --stone
    #           1.vision --as approved
    #        `.` never matches a newline, so a row-wise pattern CANNOT cross that
    #        wrap, and the first two cuts of this detector matched not one live plea
    #        on panes that provably held one. `tr '\n' ' '` folds the pane to a
    #        single line before the match; the squeeze below then restores the
    #        command to its one-space form for the render.
    #
    # ⚠️ .the limit that remains: a wrap that lands MID-TOKEN still defeats it —
    #        `route.stone.se` + `t` folds to `route.stone.se t` and no anchor
    #        matches. observed wraps break at a space and carry that space onto the
    #        next row, so this is a real but narrow gap. recorded rather than
    #        papered over with a fuzzier anchor, which would trade a rare miss for
    #        a frequent false match.
    #
    # .why the gap is `[^";]{0,200}` and not a bare `.{0,200}`
    #        the bound stops a `route.stone.set` quoted in one brief from pairing
    #        with an `--as approved` quoted in another far below it — over a FOLDED
    #        pane an unbounded gap spans the whole terminal. a real command runs
    #        ~60–110 chars.
    #        the excluded `"` and `;` do the job a lazy quantifier would, and ERE
    #        has no lazy quantifier. neither char appears in a real rhx invocation,
    #        and both appear in the shell prose around it — so the class ends a
    #        greedy run at the first piece of surrounding text. measured: without
    #        it, one match ran from a shell echo of the command all the way to the
    #        command's own output and rendered both as one string.
    #        ⚠️ `grep -P` with `.{0,200}?` was the other candidate and was refused:
    #        a grep built with no PCRE support fails, `|| true` swallows it, and the
    #        detector goes silent with no tell. this stays portable on purpose.
    # .why the resolved-check rides this SAME extraction, never a second pane read
    #      a plea is a proxy off the printed grant command alone — it cannot tell
    #      "printed, still unresolved" from "printed, and the human already ran it
    #      directly in-shell." the skill's own success banner sits right below the
    #      command it confirms:
    #        🗿 route.stone.set
    #           ├─ stone = 1.vision
    #           └─ ✓ approved
    #      that flattens to ~150 chars, inside the same bound the command match
    #      above already trusts. so the pattern optionally swallows the banner
    #      too, and a matched LAST occurrence that carries the banner is
    #      resolved — never re-surfaced as a plea (rule.always.pave-on-second-repeat).
    #      measured 2026-09-12: 7 of 7 flagged PLEAs in one babysit tick were exactly
    #      this — already run, already confirmed, still flagged. each one cost a full
    #      crew.read round trip to rule out by hand.
    #
    # ⚠️ .the anchor is `└─[[:space:]]*✓`, never a bare `✓`
    #      a bare checkmark is common prose (a task list, a wisher note) and a
    #      300-char gap over a long-running pane's flattened scrollback CAN cross
    #      into one — first cut false-negatived a genuinely unresolved plea on
    #      `fix-grepsafe-slashed-glob` this way, caught by re-running the live
    #      fleet as its own regression oracle immediately after the edit. the
    #      box-drawing prefix is this skill's own render signature and does not
    #      occur by coincidence in ordinary pane prose.
    plea="$(printf '%s\n' "${flat:-}" \
      | tr '\n' ' ' \
      | grep -aoE "route\.stone\.set[^\";]{0,200}--as[[:space:]]*(approved|overruled)([^\";]{0,300}└─[[:space:]]*✓[[:space:]]*(approved|overruled))?" \
      | tail -n 1 \
      | sed 's/[[:space:]][[:space:]]*/ /g; s/^[[:space:]]*//; s/[[:space:]]*$//' || true)"
    # a resolved match carries its own success glyph in the tail it swallowed —
    # drop it here so a stale grant never renders as a live PLEA downstream
    [[ "$plea" == *"✓"* ]] && plea=""
    # a SMEARED match was never one typed statement — the fold above stitched
    # two columns of a split pane into one string. drop it, or the poll hands a
    # human a grant command nobody asked for (see the predicate's measured case)
    __duct_plea_is_smeared "$plea" && plea=""

    # .what = the clone halted on a FULCRUM COUNCIL — it awaits a wisher VERDICT
    # .why  = the plea above anchors on a runnable COMMAND
    #        (`route.stone.set … --as approved|overruled`), and that anchor IS
    #        the row's value: the render prints the command so a supervisor can
    #        date it against the stone it names. a fulcrum council prints NO
    #        command. the clone lays out a table of open calls and stops, so
    #        every arm of the plea chain is blind to it by construction.
    #
    # 🔴 .measured 2026-09-21 on `rhachet-roles-bhrain.beav.feat-acceptance-under-5min`:
    #        the pane held "The stone waits on four wisher calls, F10 first",
    #        a four-row fulcrum table, and "When you rule, I reprobe F10's own
    #        gate". the crew row rendered `✋ blocked:on-defect` — the DRIVER's
    #        to work — for 256m. a human gate, invisible, because the ladder had
    #        no fact to join on. verbatim pane:
    #          .test/.assets/pane.council.fulcrum-awaits-a-wisher-verdict.log
    #
    # ⚠️ .this is a FACT row, never a verdict — the same split cap/plea/queued
    #        take. it asserts the pane HOLDS the clause and says naught about
    #        whether the wisher has since answered. the JOIN is git.crew.poll's.
    #
    # ⚠️ .anchors are tight, n=1. the wisher/fulcrum noun must sit within 40
    #        chars of a wait verb, or the driver's own "when you rule" clause
    #        must appear. a bare "wisher" or "blocked" would match half the
    #        fleet's scrollback.
    # 🔴 .the two anchors are RANKED, never merged into one `tail -n 1`
    #        the WAIT clause names WHAT is open — "waits on four wisher calls" —
    #        and the RULE clause merely names the protocol. a clone prints the
    #        wait clause first and the rule clause last, so a single alternation
    #        with `tail -n 1` returns the LEAST informative of the two, every
    #        time. caught by the clamp: [case64][t1] went red on exactly that
    #        (received "When you rule", where the row owed the human the count).
    #     ⇒ so the wait clause is tried first, and the rule clause is the
    #       FALLBACK that keeps a council visible when the wait clause wrapped.
    councilask="$(printf '%s\n' "${flat:-}" \
      | tr '\n' ' ' \
      | grep -aoE "(waits|awaits) on [^|]{0,40}(wisher|fulcrum)[a-z]*( calls?| verdicts?| decisions?)?" \
      | tail -n 1 \
      | sed 's/[[:space:]][[:space:]]*/ /g; s/^[[:space:]]*//; s/[[:space:]]*$//' || true)"
    [[ -n "$councilask" ]] || councilask="$(printf '%s\n' "${flat:-}" \
      | tr '\n' ' ' \
      | grep -aoE "[Ww]hen you rule" \
      | tail -n 1 || true)"

    # .what = the clone declared the TREE itself ready to fell
    # .why  = the ssm-document mechanic printed "tree is ready. foreman can
    #        fell 🌲" and it sat unread for hours — the line lives in the
    #        mechanic's own pane and no signal carries it to the foreman or
    #        a supervisor's tally (task #16). row-wise, like the cap above,
    #        never fold-across-newlines like the plea: the phrase is short
    #        and unlikely to wrap.
    # ⚠️ .n=1 evidence. one measured instance, one exact wording. anchored
    #        tight — the 🌲 glyph AND the word "fell" on the SAME row —
    #        rather than a broad "ready" heuristic, because "ready" and
    #        "fell" (past tense of "fall") are both common english and would
    #        false-positive constantly alone. per rule.always.pave-on-second-
    #        repeat: a second differently-worded instance should widen this,
    #        not a guess made now with one data point.
    fellready="$(printf '%s\n' "${flat:-}" \
      | grep -a '🌲' | grep -ai 'fell' \
      | tail -n 1 \
      | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' || true)"

    # .what = the clone GAVE UP and asked for a human, in its own words.
    # .why  = the one pane state where the clone has explicitly requested a
    #        human and no instrument carried it — it renders like health, so
    #        the sweep read `😶 at work` over a stopped clone. three trees in
    #        one tick, 2026-09-15. the detector is `__duct_pane_escalation_line`
    #        in ductwork (one detector, one home — clampable in isolation).
    # 🔴 .the box guard mirrors the ratelimit arm above, and for the same
    #        reason: a husk's escalation is SCROLLBACK from before it died, and
    #        its cure is `crew.heal`, never a human. to surface a corpse's plea
    #        would put a human in front of a tree a tool can fix.
    escalation=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]]; then
      escalation="$(__duct_pane_escalation_line "${flat:-}" || true)"
    fi

    # .what = how much context the clone has LEFT, per its own status line.
    # .why  = a clone near auto-compact is about to lose the middle of its
    #        conversation, and a supervisor who reads `😶 at work` gets no
    #        warning (task #86). this is a WATCH signal, never a gate — the
    #        compact fires itself and no supervisor may send /clear or
    #        /compact (rule.forbid.steer-a-clone-beyond-a-permission-key).
    # 🔴 .it is NOT the `/clear to save NNNK tokens` line. that one reports the
    #        session's cumulative SPEND (763K measured, past any window) and
    #        rides on plainly healthy panes — to relay it would fabricate a gate
    #        on every long-lived clone. the discriminator lives in
    #        `__duct_pane_compact_percent`, clamped against both shapes.
    # ⚠️ .box-guarded like the escalation above: a husk's status line is
    #        scrollback from before it died, so its percentage is a frozen
    #        number about a clone that no longer runs.
    compactpct=""
    if [[ "$box" != "husk" && "$box" != "none" ]]; then
      compactpct="$(__duct_pane_compact_percent "${flat:-}" || true)"
    fi

    # 🔴 .what = an `arrive` SPAWN that FAILED, under a stone that still says 🔍
    # .why  = the stone is the ROUTE's record, never proof of what runs. when
    #        the background command meant to spawn a peer review exits non-zero
    #        and the stone still reads `🔍`, the sweep reports a clone
    #        BUSY-IN-REVIEW while no review runs — the phantom (#75).
    # ⚠️ .box-guarded like the two above: a `husk`/`none` pane already renders
    #        `relic` for its stone, so the join this feeds cannot fire there
    #        and a frozen failure line would only add noise.
    # .note  the JOIN with the 🔍 stone is the RENDER's, not this block's —
    #        the detector owns the text discriminator, the caller owns the join.
    arrivefail=""
    if [[ "$box" != "husk" && "$box" != "none" ]]; then
      arrivefail="$(__duct_pane_arrive_failed "${flat:-}" || true)"
    fi

    # 🔴 .what = the clone's last TURN has ENDED, per the spinner's own tense.
    # .why  = every OTHER field here reports a reason a clone might be stopped —
    #        a cap, a wedge, an escalation, a plea. not one of them reports
    #        whether it is stopped AT ALL. so `😶 inflight` was an unchecked
    #        assertion: the sweep's only motion tell is the duct-changed diff,
    #        which needs a SECOND poll and speaks after 90–150 minutes.
    #        `__duct_pane_turn_ended` reads it from ONE pane, at once.
    #
    #        measured 2026-09-16 on rhachet-roles-bhrain.beav.feat-dispute-or-
    #        concede-review-budget: the turn had been over 6m 15s, the human's
    #        answer sat in the box undrained, and the row read `😶 inflight`.
    #
    # ⚠️ .an ended turn is NOT a halt by itself — every clone between
    #        instructions has one, and the common case is a healthy idle clone
    #        the stone-owner route already covers. this reports the FACT; the
    #        JOIN that makes it actionable is git.crew.poll's, exactly as the
    #        cap/plea/wedge notes above prescribe.
    # ⚠️ .box-guarded like its three neighbours: a husk's last spinner is
    #        scrollback from before it died, so its tense describes a turn that
    #        ended because the process did.
    turnended=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]]; then
      turnended="$(__duct_pane_turn_ended "${flat:-}" || true)"
    fi

    # 🔴 .a turn that stopped on a DECLINED modal — and it is a SEPARATE fact
    #        from its neighbour above, never a case of it. claude prints its
    #        `✻ Cogitated for 12s` epilogue when a turn completes; after a
    #        decline it prints the tool result and STOPS. so `turnended` is
    #        structurally blind to the one halt that most reliably parks a
    #        clone, and a fold would inherit that blindness rather than cure it.
    #
    # ⚠️ .box-guarded like every peer: a husk's pane is scrollback, so a
    #        decline in it belongs to a session that is already gone.
    # 🔴 .the STILL term the cap row below has always asked for and never got.
    #        that row's own text names a three-fact join — `join to reset-vs-now
    #        + still to judge` — and the crew layer only ever made two of them.
    #        this supplies the third.
    #
    # ⚠️ .it is NOT `turnended` inverted. an absent ended-turn has three
    #        causes (live · husk · never drew one), so the absence asserts
    #        naught. this asserts the frame.
    #
    # ⚠️ .box-guarded like every peer: a husk's pane is scrollback, so a live
    #        frame in it belongs to a turn that died with the process.
    turnlive=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]]; then
      turnlive="$(__duct_pane_turn_live "${flat:-}" || true)"
    fi

    declined=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]]; then
      declined="$(__duct_pane_declined "${flat:-}" || true)"
    fi

    # ⚠️ .box-guarded for the same reason as its neighbour: a husk's pane is
    #        scrollback, so a highlight in it describes a queue that died with
    #        the process.
    #
    # 🔴 .it takes $raw, NOT $flat — and that is this call site's whole point.
    #        `flat` is the pane with every SGR STRIPPED (see its definition
    #        above). every peer detector wants that, because each keys on TEXT.
    #        this one keys on the BACKGROUND SGR itself, so a stripped pane has
    #        already removed the one signal it reads, and it can never fire.
    #
    #        measured 2026-09-16, and it was the SECOND round of the identical
    #        mistake: the detector went green against a raw FIXTURE while prod
    #        handed it a stripped pane, so the suite proved the detector and the
    #        fleet render did not move
    #        (rule.always.capture-clamp-then-verify-in-prod — step 3 is the only
    #        step that can catch this, and it caught it twice).
    queuedrow=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]]; then
      queuedrow="$(__duct_pane_queued_row "${raw:-}" || true)"
    fi

    echo "$box" > "$tmpdir/$slot.box"
    echo "$box_text" > "$tmpdir/$slot.boxtext"
    echo "${stone:-}" > "$tmpdir/$slot.stone"
    echo "${cap:-}" > "$tmpdir/$slot.cap"
    echo "${turnlive:-}" > "$tmpdir/$slot.turnlive"
    echo "${ratelimit:-}" > "$tmpdir/$slot.ratelimit"
    echo "${plea:-}" > "$tmpdir/$slot.plea"
    echo "${councilask:-}" > "$tmpdir/$slot.councilask"
    echo "${fellready:-}" > "$tmpdir/$slot.fellready"
    echo "${escalation:-}" > "$tmpdir/$slot.escalation"
    echo "${compactpct:-}" > "$tmpdir/$slot.compactpct"
    echo "${arrivefail:-}" > "$tmpdir/$slot.arrivefail"
    echo "${turnended:-}" > "$tmpdir/$slot.turnended"
    echo "${declined:-}" > "$tmpdir/$slot.declined"
    echo "${queuedrow:-}" > "$tmpdir/$slot.queuedrow"

    # 🔴 .the CAUSE behind a perm modal that KEEPS COMING BACK — a clone that
    #        lost `--permission-mode acceptEdits` draws one for EVERY file
    #        write. the box ladder names the modal and says naught about why it
    #        comes back, so a supervisor keys the same tree tick after tick and
    #        reads six keys as six pieces of ordinary work
    #        (measured 2026-09-18, six keys in one window; the human's verdict
    #        was "it is genuinely frozen").
    #
    #        it rides BESIDE the box for the reason the box_kind note below
    #        gives: `prompt` is read by three downstream callers, and this is a
    #        refinement of that verdict rather than a replacement.
    modelost=""
    if [[ "$box" != "husk" && "$box" != "none" && "$box" != "unread" ]]; then
      modelost="$(__duct_pane_mode_lost "${flat:-}" || true)"
    fi
    echo "${modelost:-}" > "$tmpdir/$slot.modelost"
    # .why a SEPARATE file rather than a new box state: `prompt` is read by
    #      git.crew.poll --boxes, by the babysit cron, and by three briefs. the
    #      kind is a refinement of that verdict, never a replacement — so it
    #      rides beside it and no downstream reader breaks. absent = perm,
    #      which is the pre-split behavior.
    #      the cap above rides beside it for the same reason, and for a second:
    #      a cap is orthogonal to the box. a capped clone may hold an empty box
    #      OR a modal, and both are true at once.
    echo "${box_kind:-}" > "$tmpdir/$slot.boxkind"
  ) &

  # 🔴 #49: BOUND the fan-out. each grove duct read opens a FRESH ssh (no
  #    ControlMaster socket reuse at ductwork.sh:496/1120/1125), and an
  #    UNBOUNDED fan-out over ~30 grove ducts fires ~30 near-simultaneous
  #    connections at one host. sshd MaxStartups (default ~10 unauth) then
  #    refuses the overflow, ssh exits 255, the probe returns 255, duct.read
  #    returns empty, and every refused grove crew falls to `box=unread` — a
  #    whole capped grove invisible to the sweep, while a NARROW poll (--only,
  #    6 ducts) read the SAME ducts fine (measured 2026-09-14, v20260901: full
  #    poll rendered telepath `unread`, --only telepath rendered `🔋 cap SEEN`).
  #    each subshell runs its probe+capture SEQUENTIALLY, so peak simultaneous
  #    ssh ≈ the in-flight subshell count — cap it well under MaxStartups and
  #    every read lands. POLL_MAX_PARALLEL tunes it per grove.
  while (( $(jobs -rp | wc -l) >= ${POLL_MAX_PARALLEL:-6} )); do
    wait -n 2>/dev/null || sleep 0.2
  done
done <<< "$addresses"

wait

######################################################################
# 3. print in stable order, with the changed-since-prior verdict
######################################################################
echo "🦫 chew on it"
echo ""
echo "🪵 duct.poll --role $role --lines $lines${only:+ --only $only}"
echo "   ├─ fleet: $count duct(s), derived live from duct.list"
echo "   └─ read: parallel, read-only"
echo ""

n_changed=0
n_still=0
n_broke=0
n_slow=0
shown=0

for uri_file in "$tmpdir"/*.uri; do
  [[ -f "$uri_file" ]] || continue
  slot="$(basename "$uri_file" .uri)"
  uri="$(cat "$uri_file")"
  pane="$(cat "$tmpdir/$slot.pane" 2>/dev/null || echo '')"
  code="$(cat "$tmpdir/$slot.code" 2>/dev/null || echo 1)"

  # a stable cache key per duct address
  key="$(echo "$uri" | tr -c '[:alnum:]' '_')"
  hash_file="$cache_dir/$key.hash"
  hash_now="$(echo "$pane" | cksum | awk '{print $1}')"

  verdict=""
  if [[ "$code" == "124" ]]; then
    # timeout's own exit code — the duct did not answer in time. common
    # for a hibernated remote grove; NOT a break, so it is named apart.
    verdict="⏳ timeout (${timeout_s}s) — unreachable or asleep"
    pane="(no answer within ${timeout_s}s — if this is a remote grove, it may be hibernated)"
    n_slow=$((n_slow + 1))
  elif [[ "$code" != "0" ]]; then
    verdict="💥 malfunction"
    n_broke=$((n_broke + 1))
  elif [[ -f "$hash_file" ]] && [[ "$(cat "$hash_file")" == "$hash_now" ]]; then
    # a byte-identical pane means the duct has not moved. report the age
    # of the baseline so a stall has a duration, not just a flag
    mins="$(( ( $(date +%s) - $(stat -c %Y "$hash_file" 2>/dev/null || echo 0) ) / 60 ))"
    verdict="🧊 unchanged (${mins}m)"
    n_still=$((n_still + 1))
  else
    verdict="🌊 changed"
    n_changed=$((n_changed + 1))
  fi

  # refresh the baseline ONLY when the content actually moved, so the
  # "unchanged" age reports how long it has been stuck, not how long
  # since the last poll
  if [[ "$verdict" == "🌊 changed" ]]; then
    echo "$hash_now" > "$hash_file"
  fi

  # --changed prints only movers; a malfunction always prints, since a
  # silenced break is what a sweep must never produce
  if [[ -n "$changed_only" ]] && [[ "$verdict" == 🧊* ]]; then
    continue
  fi

  shown=$((shown + 1))
  echo "──────────────────────────────────────────────────────────────"
  echo "🔭 $uri"
  echo "   ├─ $verdict"

  # the input-box verdict — states plainly whether there is a real message
  # to relay, so no reader has to judge it from colorless text
  # an ABSENT verdict file means the worker wrote none, so no pane was
  # judged — the same claim `unread` makes. it must not fall back to
  # `unknown`, which asserts a ladder run that never happened.
  box="$(cat "$tmpdir/$slot.box" 2>/dev/null || echo unread)"
  box_text="$(cat "$tmpdir/$slot.boxtext" 2>/dev/null || echo '')"
  box_kind="$(cat "$tmpdir/$slot.boxkind" 2>/dev/null || echo '')"
  stone="$(cat "$tmpdir/$slot.stone" 2>/dev/null || echo '')"
  cap="$(cat "$tmpdir/$slot.cap" 2>/dev/null || echo '')"
  ratelimit="$(cat "$tmpdir/$slot.ratelimit" 2>/dev/null || echo '')"
  plea="$(cat "$tmpdir/$slot.plea" 2>/dev/null || echo '')"
  councilask="$(cat "$tmpdir/$slot.councilask" 2>/dev/null || echo '')"
  fellready="$(cat "$tmpdir/$slot.fellready" 2>/dev/null || echo '')"
  escalation="$(cat "$tmpdir/$slot.escalation" 2>/dev/null || echo '')"
  compactpct="$(cat "$tmpdir/$slot.compactpct" 2>/dev/null || echo '')"
  arrivefail="$(cat "$tmpdir/$slot.arrivefail" 2>/dev/null || echo '')"
  turnended="$(cat "$tmpdir/$slot.turnended" 2>/dev/null || echo '')"
  turnlive="$(cat "$tmpdir/$slot.turnlive" 2>/dev/null || echo '')"
  declined="$(cat "$tmpdir/$slot.declined" 2>/dev/null || echo '')"
  queuedrow="$(cat "$tmpdir/$slot.queuedrow" 2>/dev/null || echo '')"
  modelost="$(cat "$tmpdir/$slot.modelost" 2>/dev/null || echo '')"
  case "$box" in
    prompt)
      # .why this is the state that matters MOST to a babysit sweep
      #      a duct parked on a permission prompt is a mechanic that is
      #      GENUINELY STALLED — it cannot proceed until someone decides.
      #      every other box state is either idle or advisory; this one is
      #      a request. it was also the state the detector did not model,
      #      so it read as a message and hid the stall behind a fake relay.
      # .why the kinds are a CASE and `perm` is not the default arm
      #      an `else` here would hand every unclassified modal the PROMPT
      #      label, and PROMPT is the label that says "press a key". so the
      #      unknown case gets its own arm and the chain never falls to perm
      case "$box_kind" in
        survey)
          # claude's own product-satisfaction check-in. it is neither a design
          # question nor a permission gate — nobody in the loop owes it a
          # reply, and a reply files a score under the wrong name.
          echo "   └─ 🙋 SURVEY — claude's own product check-in. not yours"
          printf '%s\n' "$box_text" | tr '|' '\n' | sed '/^$/d' | sed 's/^/      ├─ /'
          echo "      └─ send NO keys. leave it — it clears itself, or a human dismisses it"
          ;;
        ask)
          # .why this row says DO NOT rather than how-to. the cost is asymmetric:
          #      a permission modal misread as an ask costs one message and a
          #      delayed tick. an ask misread as a permission modal costs a
          #      decision recorded in the HUMAN's name, and that does not undo.
          echo "   └─ 🙋 ASK — a DESIGN question, put to the HUMAN. not yours"
          printf '%s\n' "$box_text" | tr '|' '\n' | sed '/^$/d' | sed 's/^/      ├─ /'
          echo "      └─ send NO keys. verify its merits, then surface it with what you found"
          ;;
        unsure)
          # a modal is up and neither tell set claimed it. the MOVE is the ask
          # move, because it is safe under either kind — but the label must not
          # assert a kind we did not determine (term=false-report)
          echo "   └─ 🙋 ASK? — a modal is up, KIND UNDETERMINED. treat as not yours"
          printf '%s\n' "$box_text" | tr '|' '\n' | sed '/^$/d' | sed 's/^/      ├─ /'
          echo "      └─ send NO keys. read it with duct.read, THEN judge or surface"
          ;;
        *)
          echo "   └─ 🚧 PROMPT — mechanic STALLED, awaits a decision"
          printf '%s\n' "$box_text" | tr '|' '\n' | sed '/^$/d' | sed 's/^/      ├─ /'
          echo "      └─ read the full command (--lines 40) BEFORE any --keys"
          # 🔴 the CAUSE row. a key clears THIS modal and the next write draws
          #    another, so the cure is the MODE rather than the keystroke
          [[ -n "$modelost" ]] && \
            echo "      └─ 🎛️  MODE LOST — this clone dropped --permission-mode acceptEdits, so EVERY file write draws a modal. a key clears one write, never the cause. cure: rhx git.crew.heal --tree <tree> --who <role> --what mode"
          ;;
      esac
      ;;
    prefilled)
      # .why this does NOT say "relay it": a human may be mid-compose. an
      #      Enter on a half-typed line truncates their thought and sends
      #      the fragment. only submit text that is COMPLETE and that has
      #      held steady across two polls (i.e. this duct reads 🧊 unchanged).
      echo "   └─ ✍️  PREFILLED — a human typed this, unsent"
      echo "      ├─ \"$box_text\""
      echo "      └─ relay ONLY if complete + steady across 2 polls"
      ;;
    suggested)
      echo "   └─ 👻 SUGGESTED — autocomplete ghost, NOT a message"
      echo "      ├─ \"$box_text\""
      echo "      └─ do NOT submit; it would fabricate a human instruction"
      ;;
    queued)
      # the benign opposite of PROMPT: input already waits, the mechanic is
      # busy, and it will consume the queue on its own. no key belongs here —
      # an Enter would only submit an empty line into a busy session.
      echo "   └─ 📬 QUEUED — input waits; mechanic busy, will consume it"
      ;;
    empty)  echo "   └─ ⌨️  box empty" ;;
    none)    echo "   └─ ⌨️  no input box (not a claude session)" ;;
    # a dead claude: its resume banner is drawn, its last ❯ box is stale, and a
    # shell prompt (often `💥<code>`) sits beneath. NOT a live box — heal reboots
    # + resumes a 💥<signal> husk, and surfaces a ^C-closed one for a human.
    husk)    echo "   └─ 💀 HUSK (claude exited — resume banner shown, no live ❯ after it) — heal it: rhx git.crew.heal --tree <tree>" ;;
    # .why it no longer says "remote": it once meant that, and ceased to be
    #      true the moment the classifier learned to run on either host. now
    #      it means the READ came back empty — an unreachable grove, an absent
    #      session — so there was no pane to judge. a reader told "remote"
    #      would go look for a host problem that is not there.
    # .why `unread` and `unknown` are two rows and never one
    #      they take OPPOSITE cures, so one row cannot serve both. `unread`
    #      says the capture was empty: re-read the duct, and if it repeats,
    #      the read path is the defect. `unknown` says we hold the pane and
    #      the ladder matched no arm: read the text on the row — it is right
    #      there — and the defect is the LADDER, which owes a new arm.
    #      naming the cure inline is what keeps the next reader out of the
    #      byhand loop this split was paved to end.
    # .why `covered` is a THIRD row, and the most dangerous of the three
    #      it is the only one whose text LOOKS submittable. the ❯ text on the
    #      row is a real, white, human-typed message — so the --raw ghost
    #      check passes — and it is NOT in the box. an Enter here goes to
    #      whichever program owns the keyboard, and the payload a reader
    #      believes they are submitting was answered hours ago.
    covered) echo "   └─ 🪟 box COVERED (claude is live; a program is drawn over its input box${box_text:+ — the lowest ❯ reads \"$box_text\", which is TRANSCRIPT, not a buffer}) — read it, never key it" ;;
    unread)  echo "   └─ ❔ box UNREAD (capture came back empty — no verdict; re-read the duct)" ;;
    # 🔴 .a POSITIVE fact, and its cure is the opposite of unread's
    #      the read reached the host and the host said the session is not
    #      there. so the seat is RESIDUE — a registry row with no box behind
    #      it — and to prescribe "re-read the duct" here names a command that
    #      can never succeed. the cure is to sweep the row or to boot the seat.
    absent)  echo "   └─ 🪦 seat ABSENT (the host answered: no session by that name — this is RESIDUE, never a slow read; fell the row with rhx git.crew.fell, or boot the seat with rhx git.crew.boot)" ;;
    *)       echo "   └─ ❔ box UNKNOWN (read, but matched no arm${box_text:+ — \"$box_text\"} — treat as ghost, do not submit)" ;;
  esac

  # 🔴 .why the stone rides on its OWN row, below the box — and NOT inside the
  #      `empty)` arm, where it lived for the life of this render.
  #
  #      the old placement carried an honest rationale, and it was a rationale
  #      about a READER: "every other verdict already names its own move, so
  #      `empty` is the one row that earns a second line." that is a claim
  #      about RENDER ECONOMY. it was never a claim that the stone is unknown
  #      elsewhere — a live claude pane draws its statusline whatever its box
  #      holds, and `$stone` is read off that statusline above, unconditionally.
  #
  # 🔴 .the defect: `git.crew.poll` consumes this RENDER as a FACT. its
  #      `__crew_record_stone` parses `stone="${line#*🗿 }"` out of this stdout,
  #      so a stone we choose not to PRINT is a stone the fleet sweep does not
  #      KNOW. a presentation decision silently became a correctness constraint
  #      one layer up.
  #
  #      measured 2026-09-16 on
  #      `sdk-aws-lambda.beav.feat-absorb-handler-invoke-test-util`:
  #        ❯ 👻[ghost: mark it blocked]        ← an autocomplete ghost, authored
  #        ─────────────────────────────         by no party at all
  #          🗿 5.1.execution.from_vision, review.peer, l3@i031, blocked ✋
  #      the ghost makes the box non-`empty`, so no stone printed, so
  #      `$__stones_s` came back empty, so the ladder's `*"blocked ✋"*` arm was
  #      UNREACHABLE and the row fell to `🧊 frozen` — a healable state — which
  #      drew a null wedge probe every tick for 326 minutes. the crew was
  #      blocked on a defect the whole time and the sweep could not say so.
  #
  # ⇒ this is `rule.require.enumerate-before-you-name` again: an arm named for
  #      ONE MEMBER (`empty`) of the set it meant (every live claude pane), so
  #      every peer member — ghost, prefilled, queued, covered, prompt — sailed
  #      through with the fact dropped.
  #
  # ⚠️ the economy is KEPT, and this is why the row is guarded rather than
  #      unconditional: a plain shell, a remote, an unread capture names no
  #      stone, so `$stone` is empty and no row renders. the sweep does not grow
  #      for a shell — which is the whole of what the old rationale bought.
  if [[ -n "$stone" ]]; then
    echo "   └─ $stone"
  fi

  # .why the cap rides on its OWN row, below the box, never inside the case
  #      above: it is orthogonal to the box state. a capped clone may hold an
  #      empty box or a modal, and both facts are true at once — so a case arm
  #      would force a reader to choose between two things it needs to know.
  # .why the word is SEEN and never CAPPED. the line lives in scrollback, so
  #      this row asserts only that the pane carries it. whether the clone is
  #      capped RIGHT NOW is a join of three facts, and this row holds one of
  #      them. a row that said `CAPPED` would be a false-report the moment a
  #      resumed clone scrolled its own cap line back into view.
  if [[ -n "$cap" ]]; then
    echo "   └─ 🔋 cap SEEN — \"$cap\" (scrollback; join to reset-vs-now + still to judge)"
  fi

  # 🔴 .what = the clone's turn is LIVE — it is mid-work, this instant.
  #
  # .why it rides DIRECTLY under the cap row: the cap row's own text names a
  #      three-fact join (`reset-vs-now + still`) and the STILL half had no
  #      emitter, so every consumer made a two-fact join and called it whole.
  #      a row that states a contract its own render cannot satisfy is a row
  #      that teaches the wrong join, and two consumers learned it.
  #
  #      measured 2026-09-18: two mid-turn clones, each with a cap banner far
  #      up in scrollback, both rendered `🚫 limited … nudge to retry` by
  #      git.crew.poll while git.crew.heal — same tree, same tick — answered
  #      "this clock has NOT passed". two instruments, one pane, opposite
  #      verdicts, and a nudge sent into a clone that had not stopped.
  #
  # ⚠️ .SEEN-shaped like its neighbours, and it asserts only what it read. it
  #      does NOT say the clone is healthy — a wedged clone can hold a stale
  #      live frame. it says a turn frame is drawn, and the JOIN is the
  #      caller's, exactly as the cap and rate-limit rows prescribe.
  if [[ -n "$turnlive" ]]; then
    echo "   └─ ⏱️  TURN LIVE SEEN — \"$turnlive\" — a turn frame is drawn, so the clone is MID-WORK right now (join to cap/ratelimit: a limit verdict over a live turn took its banner from scrollback)"
  fi

  # .why its OWN row, below the box, same as cap: a wedge holds a live box AND
  #      the error, both true at once. SEEN, never WEDGED — the join downstream
  #      decides. cure is a RETRY (transient) or auth.swap, never a reboot.
  if [[ -n "$ratelimit" ]]; then
    echo "   └─ 🚫 RATE-LIMITED SEEN — \"API Error: Rate limit reached\" in tail, live box idle (transient wedge; retry the turn, do NOT reboot)"
  fi

  # 🔴 .what = the clone's last turn has ENDED — it sits BETWEEN turns, right now.
  #
  # .why  = every other motion tell in this toolchain is a DELTA: poll twice,
  #        compare, infer. this is a READ — one pane, one pass, and the tense of
  #        the spinner line says it outright. the `📬 QUEUED` row above claims
  #        "mechanic busy, will consume it", and that clause is an INFERENCE;
  #        once the turn has ended it is simply false.
  #
  #        measured 2026-09-16 on rhachet-roles-bhrain.beav.feat-dispute-or-
  #        concede-review-budget. the mechanic ended its turn with a question to
  #        the human, the human answered it in the box, and the tick rendered
  #        `😶 inflight` off a motion arm that had no idea the turn was over.
  #
  # 🔴 .why SEEN and UNCONDITIONAL, after one round keyed on the box.
  #        the first cut fired only on `box == queued || box == prefilled` — a
  #        model of the pane built from a READ of the capture rather than from
  #        the classifier's own ladder. the live pane classified `empty` (the
  #        queued arm keys on a literal phrase this pane never carried), so the
  #        row never printed and the cure was green and inert. the suite proved
  #        the DETECTOR; only the prod run proved the RENDER
  #        (rule.always.capture-clamp-then-verify-in-prod).
  #
  # ⇒ so it reports the FACT, exactly as the cap and rate-limit rows above do,
  #        and the JOIN that makes it actionable is git.crew.poll's. a fact row
  #        cannot be wrong about a precondition it never asserts.
  if [[ -n "$turnended" ]]; then
    echo "   └─ ⏸️  TURN ENDED SEEN — \"$turnended\" — the clone sits BETWEEN turns, so it is NOT mid-turn (join to the stone + box to judge whether that is idle or halted)"
  fi

  # 🔴 .a DECLINE parked this clone. the same FACT/JOIN split its neighbours
  #        take: this row asserts only that a modal was refused and the turn
  #        stopped on it. whether the clone then sat there is the box's to say,
  #        and git.crew.poll makes that join.
  #
  # ⚠️ .it names NO cure, on purpose. a decline is a deliberate verdict by
  #        whoever was at that keyboard, and a tool may not overturn one
  #        (rule.forbid.steer-a-clone-beyond-a-permission-key). the cure is to
  #        SAY SO — the defect was never the decline, it is that no instrument
  #        told anyone the clone parked behind it.
  if [[ -n "$declined" ]]; then
    echo "   └─ ⛔ DECLINE PARKED SEEN — \"$declined\" — a modal was refused and the turn stopped on it; claude prints no epilogue here, so the turn-ended row above cannot see this"
  fi

  # 🔴 .what = a message is SUBMITTED and parked above the box, unconsumed.
  #
  # .why  = the `queued` BOX arm above keys on claude's footer hint, which claude
  #        prints only while a turn RUNS. so the box ladder goes blind the moment
  #        the turn ends — which is the only moment a queue stops to drain, and
  #        therefore the only moment this fact is worth a row.
  #
  #        measured 2026-09-16, rhachet-roles-bhrain.beav.feat-dispute-or-concede-
  #        review-budget. its mechanic asked the human a ⭐ question; the human
  #        answered `fireworks is back now`; the turn had ended. the message sat
  #        undrained across TWO babysit ticks while every poll read that box
  #        `empty` and rendered no queued row — a human's answer lost in plain
  #        sight, on a tree whose stone was blocked on the gate it opened.
  #
  # ⇒ a FACT beside the box, never a box verdict. to set `box="queued"` would
  #        assert the pane is at a gate and suppress the stone, which is exactly
  #        the harm the survey overlay does today.
  if [[ -n "$queuedrow" ]]; then
    echo "   └─ 📬 QUEUED SEEN — \"$queuedrow\" — submitted and NOT yet consumed. do NOT re-send it (join to TURN ENDED: a live turn drains it, an ended one does not)"
  fi

  # 🔴 a FACT beside the box, and it must NOT live inside the prompt arm alone
  #      the prompt arm is where a supervisor DECIDES, so the cause belongs
  #      there too — and the arm is reached only when the box ladder grades this
  #      pane `prompt`. the crew layer joins on this row to derive `--healable`,
  #      and a derived set that depends on which arm claimed a pane is a set
  #      that goes empty for reasons no reader can see. so the row rides here,
  #      unconditional, and the prompt arm carries its own copy — two cues that
  #      cannot disagree (rule.require.a-cue-is-not-a-claim).
  if [[ -n "$modelost" ]]; then
    echo "   └─ 🎛️ MODE LOST — this clone dropped --permission-mode acceptEdits, so EVERY file write draws a modal. a key clears one write, never the cause — rhx git.crew.heal --tree <tree> --who <role> --what mode"
  fi

  # .why SEEN here too, and for the identical reason as the cap above: the pane
  #      carries the clone's own printed grant command, which stays in
  #      scrollback long after a human runs it. so this row asserts that the
  #      pane HOLDS it and never that the gate is open — a row that said
  #      `AWAITS A GRANT` would be a false-report the moment a granted clone
  #      scrolled its own plea back into view.
  # .why it earns a row at all: the stone CANNOT report this. a stone records
  #      the last settled transition, and the transition that clears an approval
  #      is a human command — so a converged clone renders whatever gate it
  #      stopped at, indefinitely, and a supervisor routes it to the wrong owner.
  if [[ -n "$plea" ]]; then
    echo "   └─ 🙋 plea SEEN — \"$plea\" (scrollback; the clone named a HUMAN-only gate — never self-grant)"
  fi

  # 🔴 .why this row exists BESIDE the plea rather than inside it
  #      a plea anchors on a runnable COMMAND, and that anchor is the row's
  #      whole value — the render prints the command so a supervisor can date
  #      it against the stone it names. a FULCRUM COUNCIL prints no command at
  #      all: the clone tables its open calls and stops. so it is invisible to
  #      every arm of the plea chain, by construction rather than by defect.
  # .why SEEN, the same claim cap/plea/fell-ready make: this asserts the pane
  #      HOLDS the clause. a wisher may have ruled since, and the clause stays
  #      in scrollback either way — the JOIN belongs to git.crew.poll.
  # 🔴 .the COST of the miss, measured 2026-09-21 on
  #      `rhachet-roles-bhuild.beav.feat-acceptance-under-5min`: the crew row
  #      read `✋ blocked:on-defect` — the DRIVER's to work — for 256m while
  #      four wisher calls sat open, F10 a stated SAFETY question. the ladder
  #      had no fact to join on, so the render was honest and pointed at the
  #      wrong owner.
  if [[ -n "$councilask" ]]; then
    echo "   └─ 🗳️ council SEEN — \"$councilask\" (scrollback; a FULCRUM COUNCIL — it awaits a wisher VERDICT, never a grant command)"
  fi

  # .why SEEN, same reason as cap/plea above: a fell-ready line lives in
  #      scrollback, so this row asserts the pane HOLDS it, never that the
  #      tree is fell-ready RIGHT NOW. a resumed clone can carry an old one.
  if [[ -n "$fellready" ]]; then
    echo "   └─ 🌲 fell-ready SEEN — \"$fellready\" (scrollback; relay to the foreman — n=1 pattern, task #16)"
  fi

  # 🔴 .why this row outranks every other SEEN row in what it costs to miss
  #      the clone STOPPED and asked for a human, in its own words. every other
  #      row here reports a condition a reader may infer; this one reports a
  #      REQUEST. and the pane that carries it renders like health — a live ❯,
  #      a stone below — so the sweep read `😶 at work` over it on three trees
  #      in one tick (2026-09-15, at 23, 25 and 51 attempts).
  # 🔴 .why the row names the INSTRUMENT and not the driver
  #      every measured instance sits beneath a crashed `route.drive` stop hook.
  #      so the attempt count measures how long the instrument has been broken,
  #      never how badly the driver is lost — and a reader who routes this to
  #      the driver spends a turn on a clone that is not confused.
  #      ⇒ so the row GUIDES rather than classifies: it names the read, and it
  #      names what the count actually means
  #      (rule.require.poll-recommends-every-cure-heal-has).
  if [[ -n "$escalation" ]]; then
    echo "   └─ 🙋 ESCALATION SEEN — \"$escalation\" — the clone gave up and asked for a HUMAN. the count is its INSTRUMENT's (a crashed route.drive stop hook), never the driver's fault — read the pane, then surface it"
  fi

  # .why a WATCH row and NOT a SEEN row: every other row above reports a line
  #      that lives in SCROLLBACK, so it asserts the pane HOLDS it. this one
  #      reads the clone's own STATUS LINE, which claude redraws every turn —
  #      so the number is CURRENT by construction, and a `SEEN` hedge would
  #      understate what the detector actually knows.
  # 🔴 .why NO lever rides with it, deliberately
  #      the compact fires ITSELF. there is no command a supervisor may send —
  #      `/clear` and `/compact` are both steers beyond a permission key
  #      (rule.forbid.steer-a-clone-beyond-a-permission-key), and either one
  #      would destroy the conversation this row exists to protect.
  #      ⇒ so the row GUIDES by naming what WILL happen and what it costs, and
  #      it names no runnable line, because none is owed
  #      (rule.require.poll-recommends-every-cure-heal-has: the cure a row owes
  #      is the cure that EXISTS).
  # ⚠️ .the 10% threshold is a BEST GUESS on n=2 (1% and 2% measured). a
  #      babysit tick fires every ~15 min, so the window has to be wide enough
  #      that one tick sees it before the compact lands. a third measured
  #      instance should tune this, never a guess made now.
  if [[ -n "$compactpct" ]] && [[ "$compactpct" -le 10 ]]; then
    echo "   └─ 🧠 CONTEXT LOW — ${compactpct}% until auto-compact. the clone will lose the middle of its own conversation, unprompted. NO lever is owed: the compact fires itself, and /clear or /compact from a supervisor would destroy what this row protects. watch for a coherence drop after it lands"
  fi

  # 🔴 .what = the stone claims a peer review is in flight, and the SPAWN of
  #      that review failed in this very pane.
  # 🔴 .why it coins NO word and NO glyph, deliberately
  #      the first draft of this row read `👻 PHANTOM?`. both halves were
  #      already claimed: `term=phantom` is a RECORD WHOSE SUBJECT IS GONE (a
  #      registry row that outlives its tree), and `👻` is its glyph — with an
  #      OPEN dispute against `duct.box.ghost` already on the books. a third
  #      claimant would deepen a collision this repo has yet to settle
  #      (im_an.obsessive_learner.for.domain.glyphs: a grep proves a glyph
  #      unused, never unclaimed — only the catalog settles it, and this one
  #      was read only after a peer clamp caught the collision).
  #      ⇒ so the row DESCRIBES the contradiction and names no new noun. the
  #      family it belongs to is extant: `term=false-report`, reader-inference
  #      — a true datum (the route's record) that invites a false conclusion
  #      (a review is underway). whether it has earned a word of its own is a
  #      question for its own round, caught rather than guessed at here.
  # .why  = a stone is the ROUTE's last settled record, never a report of what
  #      runs (see the note above the stone grep). so a `🔍` survives a failed
  #      arrive intact, and a sweep reads the clone as busy-in-review while no
  #      review runs. it is the most expensive false-healthy in the corpus: the
  #      row it fakes is the one that says "leave this crew alone."
  #      measured 2026-09-15 — FOUR captured panes carry both halves.
  # 🔴 .why the JOIN and not the failure alone
  #      a failed arrive on a stone that reads `blocked ✋` or `yield 🌾` is no
  #      phantom — the stone already agrees with the pane. the harm is the
  #      DISAGREEMENT, so the row fires on the pair (rule.forbid.overzealous-blockers).
  # ⚠️ .why it asks `PHANTOM?` and never asserts
  #      no capture in this corpus shows a SUCCEEDED background command, so its
  #      shape is unknown and the detector cannot prove no later arrive landed.
  #      a row that asserted "the review was never spawned" would be a
  #      false-report the first time a clone failed once and re-arrived cleanly.
  #      ⇒ so it reports the CONTRADICTION, which is true either way, and names
  #      the read that settles it (rule.require.poll-recommends-every-cure-heal-has).
  if [[ -n "$arrivefail" ]] && [[ "$stone" == *'🔍'* ]]; then
    echo "   └─ ⚠️ STONE vs PANE — the stone says a peer review is in flight, and the spawn of it FAILED here: \"$arrivefail\". a 🗿 is the ROUTE's record, never proof a review runs. do NOT read this crew as busy — read the pane and settle it before you leave it alone"
  fi

  # .why --brief exists: a babysit tick fires every ~15 min and only ever
  #      acts on the VERDICT lines — changed/unchanged, and the box state.
  #      the pane body is ~30KB per sweep of context that gets read once
  #      and then thrown away. --brief keeps the judgment and drops the
  #      cost; drill into a single duct with duct.read when a verdict says
  #      there is something to act on.
  if [[ -z "$brief" ]]; then
    echo ""
    echo "$pane"
    echo ""
  fi
done

echo "──────────────────────────────────────────────────────────────"
echo ""

# .why the header is conditional: a "dam fine!" printed a line above an
#      exit-1 failure reads as a lie. the vibe must match the verdict, so
#      an all-fail sweep opens with a bummer and never claims a win.
if [[ "$n_broke" -gt 0 ]] && [[ "$n_broke" -eq "$count" ]]; then
  echo "🦫 tail slap — polled $count, none readable"
else
  echo "🦫 dam fine! polled $count"
fi
echo "   ├─ 🌊 changed: $n_changed"
echo "   ├─ 🧊 unchanged: $n_still"
echo "   ├─ ⏳ timeout: $n_slow"
echo "   ├─ 💥 malfunction: $n_broke"
echo "   └─ shown: $shown${changed_only:+ (--changed)}"
if [[ "$n_slow" -gt 0 ]]; then
  echo ""
  echo "🛟 a ⏳ duct is likely a hibernated remote grove"
  echo "   └─ skip remote entirely with: rhx duct.poll --local"
fi

######################################################################
# exit semantics — a PARTIAL failure is a successful sweep
#
# .why exit 0 while a duct shows 💥: the question a caller asks is "did
#      the sweep run?", not "was every duct healthy?". a fleet that holds
#      one down grove is the NORMAL state, and an exit 1 there paints a
#      good report as a failed command — which would train a babysit cron
#      to retry a sweep that already did its job.
#
#      this does not hide the break (rule.forbid.failhide): the duct is
#      printed with its own 💥 header, its real error, and a fix hint,
#      and it is counted in the summary. it is as loud as it can be.
#
# .why exit 1 when EVERY duct failed: then the sweep itself yielded no
#      usable read at all — a genuine malfunction, not a report.
######################################################################
if [[ "$n_broke" -gt 0 ]] && [[ "$n_broke" -eq "$count" ]]; then
  echo ""
  echo "✋ duct.poll: EVERY duct failed to read — no usable report" >&2
  echo "   └─ fix: check ductwork is live — rhx duct.list" >&2
  exit 1
fi
