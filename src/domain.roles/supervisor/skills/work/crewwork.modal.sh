#!/usr/bin/env bash
######################################################################
# crewwork.modal — crew.modal: read and answer one clone's permission modal
#
# 🔴 .a PART of crewwork.sh — sourced, never executed, and only BY crewwork.sh.
#     a caller sources crewwork.sh, which loads every part. see
#     __crew_load_parts there for why the lib is cut into parts at all.
#
# .holds = crew.modal, and the parsers that cut a raw pane read into the
#          ask, the option region, and its numbered options.
######################################################################

######################################################################
# crew.modal
######################################################################

# .what = strip the ANSI a raw pane read carries, so the option lines
#         can be matched as plain text
#
# .why  = the read MUST be raw. the escapes are what part a real typed
#         line from an autocomplete ghost elsewhere in this file, and a
#         pre-stripped read is a pane that never existed. so the strip
#         happens HERE, on a copy, and the raw text stays available.
__crew_modal_strip_ansi() {
  sed -e 's/\x1b\[[0-9;?]*[a-zA-Z]//g' -e 's/\x1b\][^\x07]*\x07//g' -e 's/\r//g'
}

# .what = the ASK a modal frame guards — the region ABOVE the `Do you want to`
#         prompt, which names WHAT the driver is about to approve
#
# 🔴 .why = the verb rendered the ANSWER and withheld the QUESTION.
#   crew.modal carves its option region at `/Do you want to/`, and the modal's
#   SUBJECT — the command, the file, the url — sits ABOVE that anchor. so the
#   verb printed `🔑 approve → 1` beside no subject at all.
#
#   ⚠️ its own header insists "a judgment call (is this command actually safe?)
#   stays a driver decision every time" — and it withheld the one artifact that
#   judgment is made from. worse than friction: it made approve-without-read the
#   EASY path, which inverts rule.require.safe-by-default inside the very verb
#   the fleet was just routed to.
#
# .how = walk down to the prompt, keep what the frame holds:
#   - a SOLID rule `─` opens a frame, so it RESETS the buffer — what precedes it
#     is transcript, never ask
#   - a DASHED rule `╌` is inner chrome (the diff separator), so it is dropped
#     and the buffer is kept
#   - `index()` matches raw bytes, so the multibyte box chars are locale-safe
#     where a regex class would not be
__crew_modal_ask() {
  awk '
    /Do you want to/                { stop = 1 }
    stop                            { next }
    index($0, "────────")           { n = 0; next }
    index($0, "╌╌╌╌╌╌╌╌")           { next }
                                    { b[++n] = $0 }
    END { for (i = 1; i <= n; i++) print b[i] }
  '
}

# .what = the OPTION region a modal frame holds — between the `Do you want to`
#         prompt and the `Esc to cancel` footer, never the whole pane
__crew_modal_region() {
  awk '
    /Do you want to/  { buf = ""; grab = 1; next }
    /Esc to cancel/   { grab = 0 }
    grab              { buf = buf $0 "\n" }
    END               { printf "%s", buf }
  '
}

# .what = the numbered options a region holds, one `N<TAB>text` line each
#
# 🔴 .why it is a NAMED helper rather than a loop inside crew.modal
#   it was a loop, and the loop shipped a defect that no test could reach: a
#   parser with no seam is a parser with no clamp. the extract IS half the
#   cure (rule.always.entool-the-skills-you-touch).
#
# 🔴 .the space after the dot is OPTIONAL — `[[:space:]]*`, never `+`
#   a narrow pane wraps claude's chrome and an option loses its shape:
#   `2. Yes, and…` -> `2.Yes, and…` -> `2Yes, and…` (crew.refresh's own header
#   names the same ladder). the `+` form matched only the first rung, so a
#   space-eaten row was dropped with NO trace.
#
#   .measured 2026-09-20, live, on
#   sdk-aws-lambda.beav.feat-input-only-validation-and-hydration/mechanic: a
#   THREE-option modal rendered `🚧 2 option(s)`, and the row it dropped was
#   `2.Yes, and allow … access` — the grant-beyond-this-run. a driver who
#   hand-counts off that render reads a TWO-option modal and presses `2` to
#   decline, which is the one key this verb's header forbids.
#   clamped by `.test/.assets/pane.modal.option-two-loses-the-space-after-its-dot.log`.
#
# ⚠️ .a dot-eaten `2Yes` stays unparseable ON PURPOSE
#   a digit at the head of a line, with no dot, is genuinely ambiguous, and a
#   guess there would hand a driver a key it invented. the caller names the
#   short count instead (`__crew_modal_rows`), which is the honest half.
__crew_modal_options() {
  local __l
  while IFS= read -r __l; do
    [[ "$__l" =~ ^[[:space:]]*[^[:alnum:]]?[[:space:]]*([0-9]+)\.[[:space:]]*(.*[^[:space:]])[[:space:]]*$ ]] || continue
    printf '%s\t%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  done
}

# .what = how many rows of a region LOOK like an option — the denominator the
#         parsed count is graded against, so a SHORT parse can be named rather
#         than swallowed (rule.forbid.failhide, term=partial-audit)
__crew_modal_rows() {
  grep -cE '^[[:space:]]*[^[:alnum:]]?[[:space:]]*[0-9]' || true
}

# .what = read one role's permission modal, parse its numbered options,
#         and — only when told — answer it and verify
#
# 🔴 .why = rule.always.entool-the-permission-modal-cycle, PAID.
#   that rule names a four-step cycle — raw-read, parse the numbered list
#   by eye, send the key, re-read to verify — and grades the THIRD hand-run
#   in one session a blocker. it also names the cure exactly: "wrap the four
#   steps into one skill that takes --tree, reads raw, parses the option
#   positions programmatically, sends the key, and verifies".
#
#   .measured 2026-09-17: the cycle ran by hand four times across three
#   babysit ticks, every one on `…feat-prescribed-brain-per-stone/mechanic`,
#   every one for the same paved `rhx sedreplace`. correct in shape, and
#   forbidden in method by the rule that was already booted.
#
# 🔴 .what this deliberately does NOT do — it never picks the answer
#   the same rule bounds itself: "this rule governs the MECHANIC of the
#   answer, never the JUDGMENT of which key to press — a judgment call
#   (is this command actually safe?) stays a driver decision every time."
#
#   ⇒ so a bare call SENDS NAUGHT. it reads, parses, and reports. the key
#     travels only under an explicit --answer, which a supervisor supplies
#     once it has read the command the modal names.
#
# 🔴 .why the key is DERIVED and never a constant
#   the hazard is option 2. on a two-option modal it reads `No` and
#   declines; on a three-option modal it reads `Yes, and don't ask again`,
#   which grants beyond this run and is never the supervisor's to give. a
#   hand-count gets that wrong under time pressure — which is the whole
#   reason the count is now computed:
#
#     approve  = the option whose text is EXACTLY `Yes`
#     decline  = the option whose text starts `No` AND is the LAST option
#
#   a `No` that is not last is REFUSED rather than guessed. that shape is
#   unknown to us, and a misaimed decline on an unknown shape is the one
#   error this verb exists to make impossible.
#
# ⚠️ .why it anchors on the modal FRAME and not on numbered lines
#   a clone's own prose emits numbered lists constantly — a plea, a task
#   list, a set of next steps. the repo already carries the case as a
#   fixture: `.test/.assets/pane.plea.prose-numbered-list-read-as-a-modal.log`
#   holds `1.` and `2.` in prose and is NOT a modal.
#
#   ⇒ so options are read only from the region between the `Do you want to`
#     prompt and the `Esc to cancel` footer. no frame, no modal, no keys.
#
# usage:
#   rhx git.crew.modal --tree <treeslug>                     # read + parse, sends naught
#   rhx git.crew.modal --tree <treeslug> --answer approve
#   rhx git.crew.modal --tree <treeslug> --answer decline
#
# guarantee:
#   - a bare call is READ-ONLY; no keystroke leaves without --answer
#   - the key is computed from the parsed list, never assumed
#   - an unrecognised option shape is refused, never guessed
#   - a consent/transcript prompt cannot be approved through this verb
#   - every answer is verified by a read-back before it returns
#   - exit 0 = done, 1 = malfunction, 2 = constraint
crew.modal() {
  local tree="" grove="" who="mechanic" answer="" lines=60

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tree) tree="$2"; shift 2 ;;
      --grove) grove="$2"; shift 2 ;;
      --who) who="$2"; shift 2 ;;
      --answer) answer="$2"; shift 2 ;;
      --lines) lines="$2"; shift 2 ;;
      --help|-h) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; return 0 ;;
      *) echo "✋ crew.modal: unknown arg '$1'" >&2; return 2 ;;
    esac
  done

  [[ -n "$tree" ]] || { echo "✋ crew.modal: --tree required" >&2; return 2; }
  case "$answer" in
    ""|approve|decline) ;;
    *) echo "✋ crew.modal: --answer takes approve|decline (got '$answer')" >&2; return 2 ;;
  esac
  if [[ "$who" == "all" ]]; then
    # a modal is held by ONE keyboard, and the two roles are never at the
    # same prompt — the same reason crew.send refuses a broadcast.
    echo "✋ crew.modal: --who takes ONE role; a modal is held by one keyboard" >&2
    return 2
  fi

  echo "🦫 chew on it"
  echo ""
  echo "🪵 crew.modal --tree $tree --who $who${answer:+ --answer $answer}"

  local pane flat
  # 🔴 .why the failure arm re-runs the read, and names no cause
  #
  #    it used to read `2>/dev/null` + `✋ could not read the pane`, and that is
  #    TWO defects stacked, measured 2026-09-19 on a mistyped slug
  #    (`rhachet.beav.feat-acceptance-under-5min`; the real tree is
  #    `rhachet-roles-bhrain.beav.…`):
  #
  #    1. it ASSERTS a cause it never measured. "could not read the pane"
  #       blames the pane — and where the slug is wrong there IS no pane to
  #       blame. a failed READ reported as a fact about the subject is a
  #       `term=false-report`, and it sends the reader to the wrong box.
  #    2. `2>/dev/null` DISCARDED the one read that settles it. crew.read
  #       fails loud with its own named reason, and for a rowless tree that
  #       reason is the three-cause ledger hint — the exact discriminator this
  #       arm then declined to give.
  #
  #    so: enumerate the shapes, rank NONE of them, prescribe the read, and
  #    let the read that just failed speak for itself. the re-run is safe —
  #    a read is idempotent and side-effect free — and `>/dev/null` keeps its
  #    stdout out of the render while its stderr reaches the human.
  pane="$(crew.read --tree "$tree" --who "$who" ${grove:+--grove "$grove"} --lines "$lines" --raw 2>/dev/null)" || {
    echo "   └─ ✋ the pane read FAILED, and this line will not name a cause it did not measure. ⚠️ TWO shapes fit and 'could not read the pane' names only one: the TREE does not exist — felled after merge, or a mistyped slug — so there is no pane to fault · or the tree is live and its duct is down. ONE read settles which: rhx git.crew.ledger names every tree, cross-grove. absent there = the slug is wrong or the tree is GONE. the read's own reason follows:" >&2
    crew.read --tree "$tree" --who "$who" ${grove:+--grove "$grove"} --lines "$lines" --raw >/dev/null || true
    return 1
  }
  flat="$(printf '%s\n' "$pane" | __crew_modal_strip_ansi)"

  if ! grep -q 'Esc to cancel' <<< "$flat"; then
    echo "   └─ 🌊 no modal — this pane carries no \`Esc to cancel\` frame"
    echo "      a numbered list in a clone's own prose is NOT a modal; that is why"
    echo "      the frame is what this keys on, never the numbers"
    return 0
  fi

  # 🔴 the ASK — rendered BEFORE the keys, on purpose. a driver handed
  #    `approve → 1` beside no subject has been given an answer to a question
  #    they never read, and this verb's own header reserves that judgment for
  #    them. so the evidence comes first and the keys come second.
  local ask ask_n
  ask="$(printf '%s\n' "$flat" | __crew_modal_ask | grep -v '^[[:space:]]*$')"
  if [[ -n "$ask" ]]; then
    ask_n="$(printf '%s\n' "$ask" | wc -l)"
    echo "   ├─ 🧾 the ask"
    printf '%s\n' "$ask" | head -n 12 | while IFS= read -r __a; do
      echo "   │  │  $__a"
    done
    # ⚠️ a cap that stays silent is a false report: the reader cannot tell a
    #    short ask from a cut one. so a cut ALWAYS names the whole read.
    if (( ask_n > 12 )); then
      echo "   │  └─ ⚠️  cut at 12 of $ask_n lines — this is NOT the whole ask"
      echo "   │        read it whole: rhx git.crew.read --tree $tree --who $who --raw --lines $lines"
    fi
  else
    echo "   ├─ 🧾 the ask — ✋ none parsed above the prompt"
    echo "   │     read it whole: rhx git.crew.read --tree $tree --who $who --raw --lines $lines"
  fi

  # the option region: between the prompt and the footer, never the whole pane
  local region
  region="$(__crew_modal_region <<< "$flat")"

  local -a opt_n=() opt_t=()
  local __n __t
  while IFS=$'\t' read -r __n __t; do
    opt_n+=("$__n")
    opt_t+=("$__t")
  done < <(__crew_modal_options <<< "$region")

  # 🔴 a DROPPED row is NAMED, never swallowed. `__crew_modal_options` cures
  #    the space-eaten shape and refuses to guess at the dot-eaten one, so
  #    the count a reader acts on must say when it is SHORT — otherwise the
  #    render is a confident false report (rule.forbid.failhide).
  local __looks
  __looks="$(__crew_modal_rows <<< "$region")"

  if (( ${#opt_n[@]} == 0 )); then
    echo "   └─ ✋ a modal frame is present and NO option parsed — it refuses to guess" >&2
    echo "      read it by hand once: rhx git.crew.read --tree $tree --who $who --raw --lines $lines" >&2
    return 2
  fi

  echo "   ├─ 🚧 ${#opt_n[@]} option(s)"
  if (( __looks > ${#opt_n[@]} )); then
    echo "   │  ⚠️  $__looks row(s) LOOK like an option and $((__looks - ${#opt_n[@]})) did not parse — this count is SHORT"
    echo "   │     a narrow pane eats an option's shape. restore the geometry, then re-read:"
    echo "   │       rhx git.crew.refresh --tree $tree"
    echo "   │     ⛔ do NOT hand-count off this render — the dropped row is usually the \`Yes, and…\` grant"
  fi
  local __i
  for (( __i = 0; __i < ${#opt_n[@]}; __i++ )); do
    echo "   │  ├─ ${opt_n[$__i]}. ${opt_t[$__i]}"
  done

  # derive the two keys — never assume a position
  local key_yes="" key_no="" last_n="${opt_n[$(( ${#opt_n[@]} - 1 ))]}"
  for (( __i = 0; __i < ${#opt_n[@]}; __i++ )); do
    [[ "${opt_t[$__i]}" == "Yes" ]] && key_yes="${opt_n[$__i]}"
    if [[ "${opt_t[$__i]}" == No || "${opt_t[$__i]}" == No[[:space:]]* || "${opt_t[$__i]}" == No,* ]]; then
      [[ "${opt_n[$__i]}" == "$last_n" ]] && key_no="${opt_n[$__i]}"
    fi
  done

  echo "   ├─ 🔑 approve → ${key_yes:-✋ none: no option reads a bare \`Yes\`}"
  echo "   ├─ 🔑 decline → ${key_no:-✋ none: no \`No\` sits LAST}"

  # a consent / transcript prompt is neither a modal nor a survey — it is
  # rejected explicitly, and never approved through this verb
  local consent=""
  grep -qiE 'transcript|consent|share .*(data|conversation)' <<< "$region" && consent=1
  if [[ -n "$consent" ]]; then
    echo "   ├─ ⚠️  this reads as a CONSENT/TRANSCRIPT prompt — approve is refused here"
    echo "   │     it is neither a modal nor a survey: reject it explicitly, never dismiss with 0"
  fi

  if [[ -z "$answer" ]]; then
    echo "   └─ 🌊 read-only — no key left. re-run with --answer approve|decline"
    return 0
  fi

  local key=""
  if [[ "$answer" == "approve" ]]; then
    [[ -n "$consent" ]] && { echo "   └─ 🛑 refused: a consent/transcript prompt is never approved" >&2; return 2; }
    key="$key_yes"
    [[ -n "$key" ]] || { echo "   └─ 🛑 refused: no option reads a bare \`Yes\`" >&2; return 2; }
  else
    key="$key_no"
    if [[ -z "$key" ]]; then
      echo "   └─ 🛑 refused: no \`No\` sits LAST, so the decline key is UNKNOWN here" >&2
      echo "      option 2 on a three-option modal is \"yes, and don't ask again\" — a grant" >&2
      echo "      beyond this run. read it by hand rather than let this verb guess" >&2
      return 2
    fi
  fi

  echo "   ├─ 🔧 key $key ($answer)"
  # the flag is this verb's own send, marked as its own, so crew.send's byhand
  # nudge stays silent for it. cleared on EVERY path out, including the failure.
  local sendrc=0
  __CREW_MODAL_ANSWER_INFLIGHT=1
  crew.send --tree "$tree" --who "$who" ${grove:+--grove "$grove"} --keys "$key" >/dev/null || sendrc=1
  unset __CREW_MODAL_ANSWER_INFLIGHT
  if [[ "$sendrc" != "0" ]]; then
    echo "   └─ ✋ the send failed" >&2
    return 1
  fi

  # 🔴 verify-after-send POLLS. it does not read once and accuse.
  #
  # .measured 2026-09-19, twice in one tick: the key landed, the modal cleared,
  #    the clone resumed its turn — and this verb rendered "the key may not have
  #    landed" and exited 1, because it read the pane in the same instant it
  #    sent to it and tmux had not repainted yet. a one-shot read used as a
  #    verdict is a term=false-report: true of the read it took, false of the
  #    world it reported on.
  #
  # ⚠️ and the harm is not noise. an operator who believes the key missed SENDS
  #    IT AGAIN, and a second `1` on a cleared modal lands in the empty box as
  #    literal text the clone then reads as a human message. that is why the
  #    give-up below forbids a re-send outright rather than merely hedge on the
  #    first one.
  local naptime="${CREW_MODAL_POLL_SECS:-1}"
  local after attempt
  after="$(crew.read --tree "$tree" --who "$who" ${grove:+--grove "$grove"} --lines "$lines" --raw 2>/dev/null | __crew_modal_strip_ansi)"
  for attempt in 1 2 3 4 5 6; do
    grep -q 'Esc to cancel' <<< "$after" || break
    [[ "$naptime" == "0" ]] || sleep "$naptime"
    after="$(crew.read --tree "$tree" --who "$who" ${grove:+--grove "$grove"} --lines "$lines" --raw 2>/dev/null | __crew_modal_strip_ansi)"
  done

  if grep -q 'Esc to cancel' <<< "$after"; then
    echo "   └─ 🕗 key SENT, outcome UNCONFIRMED — a modal frame is still drawn after the poll"
    echo "      ├─ ⛔ do NOT re-send. the key may well have landed; a second one lands"
    echo "      │     in the empty box beneath a cleared modal, as literal text"
    echo "      └─ settle it with ONE read: rhx git.crew.read --tree $tree --who $who --lines $lines"
    return 1
  fi
  echo "   └─ ✅ answered, and the frame is gone"
  return 0
}
