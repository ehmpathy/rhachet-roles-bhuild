#!/usr/bin/env bash
######################################################################
# crewwork.pane — ONE clone's pane: crew.read, crew.send, crew.reboot
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = the three verbs that address a single clone by tree + role:
#          read its pane, send it text, replace the program it holds.
######################################################################

######################################################################
# crew.read / crew.send — reach ONE clone, addressed by TREE and ROLE
#
# .why  = a supervisor thinks in crews and trees; a duct is substrate
#         (rule.require.speak-at-the-supervisor-layer). that rule
#         governed SPEECH and had no verb behind it, so every drill-in
#         and every keystroke dropped a layer and hand-built a uri:
#
#           rhx duct.read --on 'duct://grove-sandpine-v20260901/rhachet-roles-bhrain_beav_feat-x/mechanic'
#
#         that line makes the caller carry THREE facts this layer
#         already holds — the host, the tmux name form, and the uri
#         shape. each is a place to be wrong about WHICH BOX the answer
#         describes, and a wrong one fails as a truthful report about a
#         machine the question was never about.
#
#    🔴 measured 2026-09-03: a supervisor hand-built that uri all
#       session. it worked until the host was omitted once — and the
#       answer was a confident `no ducts` over a crew plainly at work.
#       the cure is never more care with the uri. it is to remove the
#       uri from the call, so the host is DATA this layer derives
#       rather than a fact the caller must recall.
#
# .note the grove is DERIVED, exactly as crew.show/crew.hide derive it
#       (__crew_ledger_grove_of). so the common call carries no --grove
#       at all, which is the whole point of the verb.
######################################################################

# .what = read one clone's pane, by tree + role
#
# usage:
#   crew.read --tree <slug>                  # the mechanic, 50 lines
#   crew.read --tree <slug> --who foreman
#   crew.read --tree <slug> --who all        # every role, in order
#   crew.read --tree <slug> --lines 12 --raw
#   crew.read --tree <slug> --raw --until 'weekly limit'   # re-sample a slot that TURNS
#
# .note --who defaults to `mechanic` — the worker is the drill-in
#       subject in nearly every case (rule.prefer.defaults-match-common-case)
#
# 🔴 .why --until exists — a pane read is a GAUGE over a slot that TURNS
#
#   the statusline's right edge is ONE slot that several hints take turns
#   in. measured 2026-09-19 on one pane inside ~40s, the same slot rendered
#   all three of:
#
#     You've used 91% of your weekly limit · resets Sep 24, 6pm (UTC)
#     3% until auto-compact
#     (empty)
#
#   ⇒ so a single read is a POINT SAMPLE, and a supervisor who wants the
#     budget line races it and loses. measured twice in one tick: the line
#     was read, then gone seconds later when the --raw capture ran, so the
#     fixture did not hold its own subject and had to be discarded
#     (rule.always.clamp-the-verbatim-pane-your-classifier-judged).
#
#   a bounded re-sample is the cure. to finish that by hand is the defect
#   (rule.always.entool-the-skills-you-touch).
#
# 🔴 .and the match runs on the STRIPPED pane, ALWAYS — even under --raw
#
#   the escapes are PER WORD. captured verbatim from the twin that shares
#   this very slot:
#
#     \033[37m3%\033[39m \033[37muntil\033[39m \033[37mauto-compact\033[39m
#
#   ⇒ a phrase like `weekly limit` NEVER matches a --raw pane: its two
#     words are parted by an escape run. so a naive --until would report a
#     confident miss over a subject fully on screen — a false report with a
#     green face. the match is therefore taken on the stripped text while
#     the OUTPUT stays whatever --raw asked for, because the caller wants
#     the escapes in the fixture and cannot match through them.
crew.read() {
  local tree="" grove="" who="mechanic" lines=50 raw="" until_pat="" until_tries=12

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --who) who="$2"; shift 2 ;;
      --lines) lines="$2"; shift 2 ;;
      --raw) raw=1; shift ;;
      --until) until_pat="$2"; shift 2 ;;
      --until-tries) until_tries="$2"; shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.read: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.read: --tree required" >&2
    return 2
  fi

  # --until over `all` carries no single sense: N panes, one verdict, and no
  # answer to "which one must match". refuse it rather than pick for them
  if [[ -n "$until_pat" && "$who" == "all" ]]; then
    echo "✋ crew.read: --until needs ONE role — pass --who <role>. over 'all' the verdict is ambiguous: which pane must match?" >&2
    return 2
  fi

  # the derivation crew.show takes — see __crew_ledger_grove_of
  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    if [[ -z "$grove" ]]; then
      # task #44: a silent local fallback is a truthful answer about the
      # WRONG box when the ledger holds no row for a genuinely grove-hosted
      # crew — measured on rhachet-roles-bhrain.beav.feat-behavior-route-
      # upgrades, where this fell through to "session absent on this
      # machine" with no hint the crew lived on a grove all along, and a
      # `--grove cloud://…` override had to be found by hand.
      #
      # 🔴 .the hint that cure shipped named TWO causes, and BOTH were wrong
      #    on 2026-09-19. a supervisor drilled into
      #    `rhachet-roles-bhrain.beav.feat-dispute-or-concede-review-budget`
      #    and got, stacked:
      #      🌐 no ledger row … pass --grove cloud://<name>, or … --backfill
      #      ✋ duct.read: session … is absent on this machine
      #         fix:  tmux list-sessions
      #    the tree was GONE — pr #511 merged 2026-09-17, released v0.36.0,
      #    the crew felled. a clean closeout, reported as a LOCALITY fault.
      #    `--grove` sends the reader across every box after a tree that does
      #    not exist; `--backfill` churns the ledger for a row that SHOULD
      #    be absent; `tmux list-sessions` grades the wrong machine.
      #
      # ⚠️ .the shape is `rule.require.enumerate-before-you-name`: the fix
      #    list was built against the ONE instance in hand (task #44, a real
      #    grove crew with an absent row) and never tested against a second.
      #    a list that covers one instance reads complete, because the
      #    instance it covers is the one in front of you.
      #
      # 🔴 .and the discriminator was ALREADY IN HAND — this branch fires
      #    BECAUSE the ledger read returned empty, so the failed read is
      #    evidence for the cause the hint omitted. the same defect this
      #    file's peers were cured of twice this week: the tool holds the
      #    term that settles it and points the reader somewhere else
      #    (term=false-report — a failed READ reported as a fact about the
      #    subject).
      #
      # ✅ .so the cure names THREE causes and ranks NONE of them — it
      #    prescribes a READ (`rhx git.crew.ledger`, bare, cross-grove) and
      #    states what each outcome means. a ranked guess here would be the
      #    forecast-before-the-hunt defect, committed inside its own repair.
      #
      # ⚠️ .the sentence is byte-identical at all three sites (crew.read,
      #    crew.heal, crew.send) — see the heal site's own note on why
      #    (rule.require.ubiqlang). a cure at one site alone splits one
      #    concept into two phrasings.
      grove="local"
      echo "🌐 no ledger row for '$tree' — falls back to local. ⚠️ THREE causes fit and this line parts none of them: the tree is GONE (felled after merge, or a mistyped name) · it lives on a grove and its row is absent · it is local and unlisted. ONE read settles which, and it is the read that just failed: rhx git.crew.ledger names every tree, cross-grove. absent there too = GONE, and no --grove and no --backfill will find it. listed on a grove = pass --grove cloud://<name>. live but unlisted = rhx git.crew.ledger --backfill" >&2
    fi
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  local role_list
  if [[ "$who" == "all" ]]; then
    __crew_roles_into role_list "$CREWWORK_ROLES_DEFAULT"
  else
    __crew_roles_into role_list "$who"
  fi

  local role rc failed=0 uri
  for role in "${role_list[@]}"; do
    rc=0
    uri="$(__crew_duct_uri "$host" "$tree" "$role")"

    # the plain read — ONE sample, which is every call that carries no --until
    if [[ -z "$until_pat" ]]; then
      if [[ -n "$raw" ]]; then
        duct.read --on "$uri" --lines "$lines" --raw || rc=$?
      else
        duct.read --on "$uri" --lines "$lines" || rc=$?
      fi
      [[ $rc -eq 0 ]] || failed=1
      continue
    fi

    # --until: re-sample, bounded, until the slot comes back around
    local try=0 pane="" hit=""
    while (( try < until_tries )); do
      try=$(( try + 1 ))
      if [[ -n "$raw" ]]; then
        pane="$(duct.read --on "$uri" --lines "$lines" --raw 2>/dev/null)" || true
      else
        pane="$(duct.read --on "$uri" --lines "$lines" 2>/dev/null)" || true
      fi
      # 🔴 STRIPPED for the match, raw for the output — see the header
      if printf '%s' "$pane" | __crew_modal_strip_ansi | grep -qE "$until_pat"; then
        hit=1
        break
      fi
      sleep 2
    done

    printf '%s\n' "$pane"

    if [[ -n "$hit" ]]; then
      echo "🎯 crew.read --until '$until_pat': matched on read $try of $until_tries — the pane above HOLDS it" >&2
    else
      # ⚠️ a miss is a CONSTRAINT, never a verdict of absence. the slot turns,
      #    so "not in $try samples" and "not present" are different claims and
      #    this verb may only make the first (term=false-report)
      echo "🕳️ crew.read --until '$until_pat': no match in $try read(s) of $tree/$role. the pane above is the LAST sample — that is NOT a claim that the subject is absent, because the statusline slot TURNS. widen it: --until-tries $(( until_tries * 2 ))" >&2
      failed=2
    fi
  done

  return $failed
}

# .what = replace the program one clone's pane holds, and keep the duct,
#         by tree + role
#
# usage:
#   crew.reboot --tree <slug> --who foreman
#   crew.reboot --tree <slug> --who mechanic
#
# .why  = the middle rung at the supervisor's layer. an operator with a
#         wedged program had only `crew.refresh`, a repaint that cannot
#         signal a process, and `crew.stop`, which ends the conversation.
#         `term=duct.reboot._.choice.reason.md` recorded this verb as
#         owed and named the shape: `git.crew.reboot --tree --who`.
#
# 🔴 .why --who is REQUIRED, and `all` is REFUSED
#    the two roles are never wedged at the same moment, so a broadcast
#    reboot kills a healthy clone to cure a stuck one — and a claude
#    killed mid-turn loses the turn. that is the same hazard that makes
#    `crew.send --who all` exit 2, one notch more expensive: send lands a
#    keystroke on the wrong modal, reboot ends the program outright.
#
#    ⇒ and there is no safe DEFAULT either. `crew.send` may default to
#      mechanic because a misaimed message is recoverable; a misaimed
#      reboot is not. `rule.require.safe-by-default` — a destructive act
#      takes a deliberate step, so the role is named or no reboot runs.
#
# .what survives: the tmux session, the duct's name, and the pane's CWD.
#         only the wedged program dies, and a fresh shell takes its place.
#         ⚠️ the CONVERSATION dies with it — a rebooted claude does not
#         resume itself. that is what parts this from `crew.refresh`, and
#         why it is not the first thing to reach for.
crew.reboot() {
  local tree="" grove="" who=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --who) who="$2"; shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.reboot: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.reboot: --tree required" >&2
    echo "   └─ e.g. crew.reboot --tree test-fns.beav.feat-tempdir-autoprune --who foreman" >&2
    return 2
  fi

  if [[ -z "$who" ]]; then
    echo "✋ crew.reboot: --who required — a reboot ends a program, so the role is never guessed" >&2
    echo "   └─ read both first: rhx git.crew.read --tree $tree --who mechanic" >&2
    echo "                       rhx git.crew.read --tree $tree --who foreman" >&2
    return 2
  fi

  if [[ "$who" == "all" ]]; then
    echo "✋ crew.reboot: --who all is refused — a reboot ends a program" >&2
    echo "   └─ the two roles are never wedged at once, so a broadcast kills a" >&2
    echo "      healthy clone to cure a stuck one. name the wedged role." >&2
    return 2
  fi

  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    if [[ -z "$grove" ]]; then
      grove="local"
      echo "🌙 crew.reboot: no ledger row for '$tree' — fell back to grove=local" >&2
    fi
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  local uri
  uri="$(__crew_duct_uri "$host" "$tree" "$who")"
  duct.reboot --on "$uri"
}

# .what = send text or keystrokes to one clone, by tree + role
#
# usage:
#   crew.send --tree <slug> --what 'carry on'
#   crew.send --tree <slug> --who foreman --what 'git tree del'
#   crew.send --tree <slug> --keys 1              # answer a modal
#   crew.send --tree <slug> --what '<long>' --submit
#   printf '%s' '<long, multi-line>' | crew.send --tree <slug> --what @stdin
#
# ⚠️ --who takes ONE role here, never `all`. a keystroke broadcast to a
#    whole crew is a way to answer two different modals with one digit,
#    and the two clones are never at the same prompt.
crew.send() {
  local tree="" grove="" who="mechanic" what="" keys="" anyway="" submit=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --who) who="$2"; shift 2 ;;
      --what)
        # .why @stdin is read HERE, not left for the caller to pipe raw
        #   the paved convention elsewhere in this repo (git.commit.set -m
        #   @stdin) reads the literal token and swaps in stdin's content —
        #   crew.send never did, so `--what @stdin` sent the eight-byte
        #   string "@stdin" to a live pane, verbatim, and reported `sent`.
        #   the send was truthful; the PAYLOAD was not what the caller
        #   meant (term=false-report — a correct report about the wrong
        #   content). a multi-line steer piped this way landed as a
        #   literal token in a mechanic's box, silently.
        if [[ "$2" == "@stdin" ]]; then
          what="$(cat)"
        else
          what="$2"
        fi
        shift 2
        ;;
      --keys) keys="$2"; shift 2 ;;
      --anyway) anyway=1; shift ;;
      # 🔴 --submit is NOT a synonym of --anyway, and the two were fused in
      #    this verb's own --help for the whole of its life:
      #      --anyway = enter a pane that a program holds (the busy-guard)
      #      --submit = press Enter after the text (a paste eats its own)
      #    they travel together, which is exactly why the fusion survived —
      #    every real call passed both, so --anyway looked like the cause of
      #    a submit that in truth never occurred.
      #    ⇒ --submit IMPLIES --anyway: a live claude holds the pane, so a
      #      send that means to submit must be let in first.
      --submit) submit=1; anyway=1; shift ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.send: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  if [[ -z "$tree" ]]; then
    echo "✋ crew.send: --tree required" >&2
    return 2
  fi
  if [[ -z "$what" && -z "$keys" ]]; then
    echo "✋ crew.send: one of --what or --keys required" >&2
    return 2
  fi
  if [[ -n "$what" && -n "$keys" ]]; then
    echo "✋ crew.send: --what and --keys are exclusive" >&2
    return 2
  fi
  if [[ "$who" == "all" ]]; then
    # .why = see the caution on this verb's header. a broadcast keystroke
    #        answers whatever modal each clone happens to hold, which is
    #        never the same one (rule.require.safe-by-default)
    echo "✋ crew.send: --who takes ONE role; a broadcast send is refused" >&2
    echo "   └─ fix: send to each role by name, after you read it" >&2
    return 2
  fi

  # 🪝 the CURE-TOOL nudge — a --what send is a supervisor BYHAND steer, and a
  #    byhand cure is unauditable and recurs (rule.forbid.byhand-heal). so every
  #    direct command send prompts the caller to reach for a tool, or upsert one.
  #    it NUDGES, never blocks: the user chose a reminder over a --why toll, so
  #    the send still proceeds (rule.prefer over a hard gate).
  #    internal cures never reach here: they call duct.send (substrate), which is
  #    why heal's own nudge and boot's resume do not trip this.
  if [[ -n "$what" ]]; then
    echo "🪝 byhand steer — a command sent straight to a crew." >&2
    echo "   is there an extant tool for this cure? use it. if not, upsert one —" >&2
    echo "   a byhand send is unauditable and recurs (rule.forbid.byhand-heal)." >&2
  fi

  # 🪝 the MODAL-VERB nudge — the same claim, one flag over.
  #
  # 🔴 this arm once read "--keys (a modal answer) is exempt — it is the
  #    sanctioned modal path". that was TRUE when written and FALSE from
  #    2026-09-17, the day git.crew.modal was paved to pay
  #    rule.always.entool-the-permission-modal-cycle. from that date `--keys` is
  #    the BYHAND half of a four-step cycle (raw-read, count the options, send,
  #    verify) that one call now folds — and the rule grades the third hand-run
  #    in a session a blocker.
  #
  # .measured 2026-09-19: the cycle ran by hand FOUR times in ONE tick, because
  #    not one brief in repo=.this/role=any names the verb (grepsafe
  #    'crew.modal' -> 0) while 26 lines across 15 of them teach `--keys`,
  #    howto.run-a-babysit-tick and the babysit cron prompt among them. a verb
  #    nobody is routed to binds nobody, so the pointer rides HERE — at the
  #    moment of use, where it needs no boot to arrive.
  #
  # ⚠️ it NUDGES and never blocks, deliberately. git.crew.modal itself refuses
  #    to pick the key ("a judgment call stays a driver decision every time"),
  #    so a gate here would strand a driver who has read the pane and holds a
  #    judgment the tool declines to make.
  # 🔴 and it must NOT fire on git.crew.modal's OWN send. measured 2026-09-19:
  #    the paved verb told its caller to reach for the paved verb, because the
  #    third step of the cycle it folds IS a `--keys` send. a nudge that fires
  #    on the cure it recommends teaches an operator to distrust that cure
  #    (rule.forbid.remedies-that-mimic-the-defect). so crew.modal sets the flag
  #    around its one send and clears it before any return.
  if [[ -n "$keys" && -z "${__CREW_MODAL_ANSWER_INFLIGHT:-}" ]]; then
    echo "🪝 byhand modal answer — a key counted and sent by hand." >&2
    echo "   the cycle is paved: rhx git.crew.modal --tree $tree --who $who --answer approve|decline" >&2
    echo "   it reads, COUNTS the options, sends, and verifies — one call, and it" >&2
    echo "   refuses option 2 on a three-option modal, which a hand-count misses." >&2
  fi

  if [[ -z "$grove" ]]; then
    grove="$(__crew_ledger_grove_of "$tree")"
    if [[ -z "$grove" ]]; then
      # task #44: the same silent local fallback crew.read carried — see
      # its comment for the measured case
      grove="local"
      echo "🌐 no ledger row for '$tree' — falls back to local. ⚠️ THREE causes fit and this line parts none of them: the tree is GONE (felled after merge, or a mistyped name) · it lives on a grove and its row is absent · it is local and unlisted. ONE read settles which, and it is the read that just failed: rhx git.crew.ledger names every tree, cross-grove. absent there too = GONE, and no --grove and no --backfill will find it. listed on a grove = pass --grove cloud://<name>. live but unlisted = rhx git.crew.ledger --backfill" >&2
    fi
  fi

  local host
  host=$(__crew_grove_host "$grove") || return 2

  local uri
  uri="$(__crew_duct_uri "$host" "$tree" "$who")"

  if [[ -n "$keys" ]]; then
    duct.send --on "$uri" --keys "$keys"
    return $?
  fi
  if [[ -n "$anyway" ]]; then
    duct.send --on "$uri" --what "$what" --anyway || return $?
    # .why the Enter is a SECOND call, and why it is safe here
    #   claude takes a multi-line --what as a PASTE and swallows the Enter
    #   that would have submitted it, so the text parks in the box while
    #   the send reports `sent` — a false report by reader inference
    #   (rule.require.verify-after-send: compare, never confirm).
    #
    #   ⚠️ a blind Enter into a box is normally forbidden — it can submit a
    #   ghost, or a message a human left half-typed. it is safe ONLY here,
    #   and for one narrow reason: we put those exact bytes in the buffer
    #   one line ago. this is the single case where the buffer's contents
    #   are known rather than read (term=duct.box.covered records what the
    #   --raw ghost check cannot tell you when they are not).
    #
    # 🔴 .the SETTLE, and why a bare Enter here is a RACE
    #   a paste and an Enter sent back to back arrive back to back. claude's
    #   input is an Ink widget, and a BUSY clone consumes a bracketed paste
    #   more slowly than an idle one — so the Enter can land before the
    #   buffer holds the text, and is swallowed.
    #
    #   ⚠️ the failure is INTERMITTENT, which is worse than total: measured
    #   2026-09-04, the same flag submitted cleanly to an idle clone and
    #   silently failed on one mid-turn at 3m. a flag that works on the
    #   quiet case and fails on the busy one will be trusted exactly where
    #   it should not be — a steer matters most to a clone that is at work.
    #
    #   ⇒ so the settle is not a nicety. it is the difference between a
    #     flag that submits and a flag that submits when convenient.
    if [[ -n "$submit" ]]; then
      sleep 1
      duct.send --on "$uri" --keys Enter || return $?
      # .why VERIFY rather than trust: this is the one place the tool can
      #   run rule.require.verify-after-send ON ITS OWN BEHALF. the caller
      #   should not have to read back a flag whose whole job is one
      #   keystroke — that read-back IS the by-hand step this flag retires.
      local after
      after="$(duct.read --on "$uri" --lines 6 2>/dev/null || true)"
      if [[ "$after" == *'Pasted text'* ]]; then
        sleep 2
        duct.send --on "$uri" --keys Enter || return $?
      fi
    fi
    return $?
  fi
  duct.send --on "$uri" --what "$what"
}
