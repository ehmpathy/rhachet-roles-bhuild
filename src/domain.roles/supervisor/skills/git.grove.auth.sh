#!/usr/bin/env bash
######################################################################
# git.grove.auth — sign a brain in on a grove, from YOUR browser
#
# .what = find the sign-in prompt a brain raised on a grove, lift its url
#         across to this box, and open it in the local browser. then take
#         the code the browser hands back and paste it into the grove.
#
# .why  = a brain booted on a grove asks a human to sign in, and the human
#         is on a DIFFERENT machine with the browser. so the url has to
#         cross that gap, and until now the only way across was to read it
#         off a pane by eye and retype it.
#
#         that is not merely tedious. it is UNRELIABLE, and it fails in the
#         one direction that costs: an oauth url is 300+ characters of
#         base64url with no redundancy, so a single wrong character yields
#         a link that LOOKS right and does not work (term=false-report).
#         no human can eyeball the difference.
#
# ⚠️ .why the GROVE is the subject, never a duct
#
#   a sign-in is a property of the MACHINE. claude writes its credential to
#   ~/.claude on the box, so one sign-in authorizes EVERY duct on that
#   grove — the crew that exists now and the crew booted tomorrow.
#
#   to name this per-duct would teach the opposite: that each duct needs
#   its own sign-in, which is false and would have a human answer the same
#   prompt once per role forever. the duct this reads is an implementation
#   detail it DERIVES, never an argument it takes.
#
# usage:
#   rhx git.grove.auth grove-1 --brain claude --mech oauth
#   rhx git.grove.auth grove-1 --brain claude --mech oauth --code 'the-code'
#   rhx git.grove.auth grove-1 --brain claude
#   rhx git.grove.auth grove-1 --brain claude --print
#   rhx git.grove.auth local --brain claude --mech oauth
#
# args:
#   <grove>    grove exid, `cloud://<exid>`, or `local`     [required]
#   --brain    which brain to sign in (today: claude)       [required]
#   --mech     HOW the sign-in is reached                   [default: attach]
#              oauth  — raise our OWN: boot claude in a duct we own, drive it
#                       through its first-run screens to the oauth selector,
#                       read the url there
#              token  — mint a LONG-LIVED token (`claude setup-token`) instead
#                       of a session. same two legs; the terminus is a token on
#                       stdout, not a credential on the box. see below
#              attach — find a duct already AT a prompt someone else raised
#   --print    print the url; do NOT open a browser
#   --code     paste this code back into the grove's prompt
#   --width    columns to render the pane at while it reads (default: 600)
#              `--width 0` reads the pane as-is and resizes no part of it
#              ⛔ attach ONLY — oauth sizes its own duct at birth
#
# ⚠️ .the two mechs answer DIFFERENT questions, and only one is hermetic
#
#   `attach` presumes a sign-in prompt is ALREADY up somewhere on the grove —
#   raised by a crew boot, a human, some earlier run. so it is a READER: it
#   scans, hopes, and fails when nobody happened to raise one. worse, what it
#   finds is a pane whose geometry belongs to whoever made it, which is the
#   whole reason it must fight a repaint race to read a url at all.
#
#   `oauth` OWNS the flow end to end. it boots claude itself, so:
#
#     - it never has to hope a prompt exists — it raises one
#     - it sizes the duct at birth, so the url wraps into rows that fit ABOVE
#       the input box on the FIRST paint. defects 1 and 2 below are absent by
#       construction; no resize, no SIGWINCH toggle, no repaint race
#     - it knows which duct holds the prompt, so `--code` needs no scan and
#       cannot answer the wrong one
#
#   prefer `oauth`. `attach` remains for the case a prompt is already up and
#   you want THAT one answered rather than a fresh sign-in.
#
# ⚠️ .`token` MINTS A CREDENTIAL — it does not sign the box in
#
#   `oauth` and `attach` both end with a credential written to ~/.claude on the
#   grove. `token` ends with a token printed on STDOUT and the grove unchanged.
#   so it is the only mech whose subject is not really the machine — the machine
#   is merely a tty that can render an Ink TUI.
#
#   ⇒ `--mech token` on `local` is the ordinary case, and it is what a caller
#     who wants to STORE an account reaches for:
#
#       rhx git.grove.auth local --brain claude --mech token
#       rhx git.grove.auth local --brain claude --mech token --code '<code>' \
#         | rhx keyrack set --key CLAUDE_CODE_OAUTH_TOKEN --vault aws.params ...
#
#   ⚠️ the two mechs mint DIFFERENT SCOPES, and the gap is not cosmetic:
#
#     /login       org:create_api_key user:profile user:inference
#                  user:sessions:claude_code user:mcp_servers user:file_upload
#     setup-token  user:inference                                    ← that is ALL
#
#   measured 2026-09-05, off the two urls side by side. so a setup-token carries
#   no `user:profile` (hence `claude auth status` can name no email under it) and
#   no `user:sessions:claude_code`. whether it drives a full repl is UNVERIFIED
#   — treat it as an inference credential until a real call proves otherwise.
#
# ⚠️ .`claude auth status` CANNOT verify a token, and says otherwise
#
#   under CLAUDE_CODE_OAUTH_TOKEN it reports `loggedIn: true` for a string we
#   invented — measured with the literal `sk-ant-oat01-notarealtoken`. it checks
#   PRESENCE, never validity, and returns no email to compare.
#
#   ⇒ so the terminus that grades `oauth` is USELESS here, and this mech must
#     never borrow it. a token is proven by a call that spends it, never by a
#     status line (term=false-report, the reader-inference family).
#
# ⚠️ .why a plain read of that pane is WRONG, three times over
#
#   claude wraps the url at ~93 columns and paints it into its viewport. three
#   separate defects follow, and a correct read must answer all three:
#
#   1. HEIGHT truncates it. a short pane paints the url's first row and drops
#      the rest — those rows were never printed, so no capture recovers them
#      and no length of sleep helps. `-y 60` is the actual cure. width is not:
#      claude wraps at ~93 whatever the pane offers.
#
#   2. claude repaints only on SIGWINCH. so the height must arrive as a RESIZE,
#      and a resize to the size already set delivers no signal — hence the
#      one-column toggle in the read loop, purely to force the repaint.
#
#   3. the url appears MORE THAN ONCE in the buffer — an older copy in
#      scrollback, plus whatever the live screen holds mid-repaint. "take the
#      last match" therefore prefers a bare first row: 93 characters, cut
#      mid-client-id, and complete-looking. rank by the gate, never by
#      position.
#
#   ⚠️ this header first claimed the widen was useless and `-J` alone was the
#      cure. that was wrong on both halves — it read the symptom (a 93-column
#      fragment) and named a cause it never checked. the fragment came from
#      defect 3, while defects 1 and 2 were what the resize was actually for.
#
# guarantee:
#   - the url is VALIDATED before it is offered: it must carry both
#     code_challenge= and state=. one that fails is REFUSED rather than
#     opened, because a corrupt link that looks right costs more than an
#     honest failure
#   - absent --code it sends NO key, so it cannot answer a prompt on a human's
#     behalf. it does resize the window (and restores it on every exit path),
#     because a repaint is the only way the url's later rows get printed at
#     all; `--width 0` opts out of even that
#   - the scan is ONE round trip, whatever the session count
#     (rule.require.bulk-over-byhand)
#   - absent --code it sends no key, so it cannot disturb the sign-in
#   - exit 0 = done, exit 1 = malfunction, exit 2 = constraint
######################################################################

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/ductwork.sh"

grove=""
brain=""
print_only=""
code=""
width=600
width_given=""
mech="attach"

# 🔴 DEBUG IS ON BY DEFAULT, and the wait is CAPPED.
#
# .why = every wait in this skill polls a remote pane, and when one stalls the
#        caller sees a still cursor for minutes with no word on which step, how
#        many passes, or what the pane actually holds. the whole diagnosis then
#        happens by hand, after the fact, against a pane that has since moved
#        on — which is how three defects here survived several rounds each.
#
# ⇒ so the trace is the DEFAULT rather than a flag: a caller who must know to
#   ask for the diagnostic does not have it at the moment it is needed, and
#   that moment is never predicted. `--quiet` opts out.
debug=1

# the BEFORE half of the swap verdict. only an OWNED duct reads it (it boots the
# session, so it holds the moment the credential is still the old one), so the
# terminus must be able to tell "unread" from "signed in as nobody" — a sentinel
# rather than an empty string, since both are empty.
acct_before_read=""
email_before=""
org_before=""

# ⚠️ the cap is WALL-CLOCK, never a pass count. the loops below counted passes
#    and multiplied by their sleep to reason about the wait — a figure that is
#    wrong by however long each ssh round trip takes, and ssh is the slow part.
STEP_CAP_SECS="${GROVE_AUTH_STEP_CAP:-90}"

# .what = seconds elapsed since the epoch
__now() { date +%s; }

# .what = trace one step, with its elapsed time
# .why  = to stderr ALWAYS — stdout is a contract under `--mech token`, which
#         pipes the token into keyrack. one stray trace line there would store
#         prose as a credential.
__dbg() { [[ -n "$debug" ]] && echo "   │  🔍 $*" >&2; return 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --grove) grove="$2"; shift 2 ;;
    --brain) brain="$2"; shift 2 ;;
    --mech) mech="$2"; shift 2 ;;
    --code) code="$2"; shift 2 ;;
    --width) width="$2"; width_given=1; shift 2 ;;
    --print) print_only=1; shift ;;
    --quiet) debug="" ; shift ;;
    --skill|--repo|--role) shift 2 ;;
    --help|-h|help) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; exit 0 ;;

    # ⚠️ FAIL LOUD — never shift an unknown flag away (rule.forbid.failhide).
    #    duct.send ate `--anyway`, then `--await`, and the second left a tree
    #    sprouted with no behavior. a dropped `--print` here opens a browser a
    #    caller explicitly asked us not to.
    -*)
      echo "✋ git.grove.auth: unknown arg '$1'" >&2
      echo "   known: --brain --mech --print --code --width" >&2
      exit 2 ;;
    *)
      if [[ -n "$grove" ]]; then
        echo "✋ git.grove.auth: more than one grove given ('$grove', '$1')" >&2
        exit 2
      fi
      grove="$1"; shift ;;
  esac
done

if [[ -z "$grove" ]]; then
  echo "✋ git.grove.auth: a grove is required" >&2
  echo "   e.g. rhx git.grove.auth grove-1 --brain claude" >&2
  exit 2
fi

# ⚠️ --brain is REQUIRED, and an unknown one fail-fasts by name.
#
# .why = each brain signs in by its own mechanism, and only claude's is
#        built. a skill that silently treated every brain as claude would
#        scan for a url that a different brain never prints, then report
#        "no sign-in found" — true of its search and false about the grove
#        (term=false-report, the reader-inference family).
if [[ -z "$brain" ]]; then
  echo "✋ git.grove.auth: --brain required" >&2
  echo "   known: claude" >&2
  exit 2
fi
if [[ "$brain" != "claude" ]]; then
  echo "✋ git.grove.auth: no sign-in mechanism for brain '$brain'" >&2
  echo "   known: claude" >&2
  echo "   why: each brain signs in its own way; only claude's is built" >&2
  exit 2
fi

if [[ "$mech" != "oauth" && "$mech" != "attach" && "$mech" != "token" ]]; then
  echo "✋ git.grove.auth: unknown --mech '$mech'" >&2
  echo "   known: oauth (raise our own sign-in) | token (mint a long-lived token)" >&2
  echo "        | attach (find one already up)" >&2
  exit 2
fi

# ⚠️ `token` and `oauth` share every mechanism and differ in three data points.
#
# .why a shared arm rather than a copy: the duct boot, the screen driver, the
#      row-join, the url gate, and the browser handoff are identical — and each
#      of them encodes a defect this fleet paid to find. a second copy would
#      inherit today's fixes and none of tomorrow's (rule.prefer.wet-over-dry
#      cuts the other way once the duplication is THIS load-bearing).
owned=""
[[ "$mech" == "oauth" || "$mech" == "token" ]] && owned=1

BOOT_CMD="claude"
[[ "$mech" == "token" ]] && BOOT_CMD="claude setup-token"

# ⚠️ REFUSE the pair rather than ignore half of it (rule.forbid.failhide).
#
# .why = --width is a knob on the ATTACH read, which fights a pane whose size
#        belongs to somebody else. the oauth mech sizes its own duct at birth,
#        so there is no such fight and the flag governs nought. to accept it
#        silently would report success over a knob that did naught — a caller
#        who set 600 and got their url would believe the flag took effect.
if [[ -n "$width_given" && -n "$owned" ]]; then
  echo "✋ git.grove.auth: --width does not apply under --mech $mech" >&2
  echo "   why: $mech boots its OWN duct and sizes it at birth, so there is" >&2
  echo "        no foreign geometry to correct for." >&2
  echo "   fix: drop --width, or use --mech attach" >&2
  exit 2
fi

# the duct the oauth mech owns. one per grove, and it is REPLACED on each run
# rather than reused — see the kill-session below for why.
#
# .note = no dot in the name, on purpose. tmux forbids `.` in a session name
#         and silently writes `_`, so a dotted name would have us look up one
#         string and tmux hold another (term=ledger's canon lesson).
#
# ⚠️ `token` takes its OWN duct, and that separation is a safety property.
#
# .why = a shared duct would let leg 2 of one mech answer the prompt raised by
#        the other. the two prompts render alike — same oauth screen, same
#        "Paste code here" box — so the mismatch would be invisible, and the
#        code would be spent against a flow the caller never asked for.
AUTH_SESSION="_auth_claude"
[[ "$mech" == "token" ]] && AUTH_SESSION="_token_claude"

# ── the grove ──────────────────────────────────────────────────────
# accept every shape a caller may hold: a bare exid, the `cloud://` uri
# form a --grove flag uses, and `local` for this box. an empty host means
# local, which is the same zero value a `duct:///` uri carries.
host="$grove"
case "$grove" in
  local) host="" ;;
  cloud://*) host="${grove#cloud://}" ;;
esac

where="on this box"
[[ -n "$host" ]] && where="on $host"

TMUXC="$(__duct_tmux_cmd)"

# .what = run a shell snippet ON the grove
# .why  = the host is DATA the caller handed us, so it rides in rather than
#         gets guessed. a local check on a remote subject is the family this
#         fleet has now caught six times.
#
# 🔴 every call here is a FRESH ssh handshake — there is no multiplex — so a
#    poll loop pays a full connect per pass. that is the dominant cost of every
#    wait in this skill, and it was invisible until it was timed.
#
# ⚠️ `-o BatchMode=yes` so a prompt can never hang the loop: without it, a host
#    that wants a passphrase or a host-key answer waits forever on a stdin that
#    `-n` already closed, and the skill reads as "slow" rather than "blocked".
__grove_sh() {
  local __t0 __rc __ms
  __t0=$(date +%s%N)
  if [[ -n "$host" ]]; then
    ssh -n -o ConnectTimeout=10 -o BatchMode=yes "$host" "$1"
    __rc=$?
  else
    bash -c "$1"
    __rc=$?
  fi
  __ms=$(( ($(date +%s%N) - __t0) / 1000000 ))

  # only the SLOW ones, or the trace drowns the signal it exists to carry
  [[ -n "$debug" && "$__ms" -gt 400 ]] && echo "   │  🐌 ${__ms}ms — ${1:0:60}" >&2

  return $__rc
}

# ── answer the TRUST select, on either render claude draws ─────────
#
# .what = grant the trust-folder prompt, whichever shape it arrives in
#
# 🔴 .why = claude code v2.1.270 dropped the NUMBERS from this one select AND
#    inverted its order. the two facts compound:
#
#      |         | earlier            | v2.1.270                     |
#      |---------|--------------------|------------------------------|
#      | render  | `1. Yes, proceed`  | `❯ No, exit`                 |
#      |         | `2. No, exit`      | `  Yes, I trust this folder` |
#      | `1`     | granted trust      | 🔴 a **NO-OP**               |
#      | default | yes                | 🔴 **No, exit**              |
#
#    ⚠️ measured 2026-09-09 on `grove-sandpine-v20260901`. every run parked on this
#      one screen and spent its whole pass budget, so the defect read as **"the
#      skill got slow"** rather than "one keystroke went dead". a wall-clock cap
#      plus a pane dump named it in a single run, where six rounds of thought
#      about ssh and tmux had each named the wrong layer
#      (`rule.require.trust-but-verify` — read the pane, never reason about it).
#
# 🔴 a bare `Enter` is NOT the cure, and it is the obvious one: the cursor now
#    rests on `No, exit`, so an Enter alone DECLINES and claude quits. the
#    keystroke must MOVE first.
#
# ⚠️ and the digit is READ off the pane rather than assumed, because the ORDER is
#    exactly what changed. a hardcoded `1` is the defect this repairs; a
#    hardcoded `2` would be the same defect, one release later.
__answer_trust() {
  local __pane="$1" __digit
  # ⚠️ `|| true` because the ABSENCE of a match is the common case now, and grep
  #    reports it with exit 1. under `set -e` that kills the skill outright — so
  #    the arrow render, which is the one this repair exists to serve, would
  #    abort the run before it ever reached its own branch.
  __digit=$(printf '%s\n' "$__pane" | grep -oE '[0-9]+\. *Yes' | grep -oE '^[0-9]+' | head -1 || true)

  if [[ -n "$__digit" ]]; then
    __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' $__digit"
    echo "   ├─ ⌨️  trust folder → $__digit (numbered render)"
    return 0
  fi

  # the arrow render: two options, `Yes` is the SECOND, so one Down lands it
  __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' Down"
  __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' Enter"
  echo "   ├─ ⌨️  trust folder → Down,Enter (arrow render — its default is 'No, exit')"
}

# ── is an INTERACTIVE screen up, parked on a human? ────────────────
#
# .what = true where the pane holds a screen that will never clear by itself
#
# 🔴 .why it is a HELPER rather than a grep at each guard: both the stall guard
#    and the unknown-screen guard need this exact question, and when it was
#    written inline they each keyed on `Enter to confirm` ALONE. that phrase is
#    the SELECT footer, and it is not the only screen claude parks on.
#
# ⚠️ measured 2026-09-14 on `grove-sandpine-v20260901`, and it cost a full budget:
#   a failed code exchange rendered
#
#     OAuth error: Request failed with status code 400
#     Press Enter to retry.
#     Esc to cancel
#
#   byte-identical for 30 passes over 76 seconds. it matched no arm, so the
#   unknown guard should have named it — and it carries no `Enter to confirm`,
#   so neither guard ever looked. **two guards, one phrase, one blind spot.**
#
# ⇒ the lesson is the shape, not the string: a probe copied into two callers is
#   one probe with two chances to be wrong together
#   (`rule.always.pave-on-second-repeat`). every footer claude uses to say
#   "a human must act" belongs HERE, and a new one is added here rather than at
#   either call site.
__screen_up() {
  printf '%s\n' "$1" | grep -qE 'Enter to confirm|Esc to cancel|Press Enter to'
}

# ── read the account this grove is signed in as ───────────────────
#
# .what = `<email>\t<orgId>`, both empty where the grove is signed in as nobody
#
# 🔴 .why SED over the whole json, never a jq PATH — claude code v2.1.270
#    FLATTENED this schema. `.account.email` became `.email`, and
#    `.organization.uuid` became `.orgId`. a path read now returns `null`, and a
#    verdict built on it reports **"signed in as nobody"** over a healthy
#    credential — an error on a run that in fact succeeded.
#
# ⚠️ measured 2026-09-09: the field NAMES survived the move and only their DEPTH
#   changed, which is exactly why a name match holds where a path match breaks.
#   ⇒ **bind to the least a caller needs**: the depth is the upstream's business,
#   the field name is the contract.
__account_read() {
  local __j __e __o
  __j=$(__grove_sh "claude auth status --json || true" || true)
  __e=$(printf '%s' "$__j" | sed -n 's/.*"email"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  __o=$(printf '%s' "$__j" | sed -n 's/.*"orgId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
  printf '%s\t%s' "$__e" "$__o"
}

# ── the duct the sign-in lives in ──────────────────────────────────
session=""

if [[ -n "$owned" ]]; then

  # ⚠️ leg 2 must NOT re-boot. a fresh claude mints a fresh state and
  #    code_challenge, so the code in the caller's hand would answer a prompt
  #    that no longer exists — and the failure would read as a bad code rather
  #    than as our own doing.
  if [[ -n "$code" ]]; then
    if ! __grove_sh "${TMUXC}has-session -t '$AUTH_SESSION' 2>/dev/null"; then
      echo "✋ git.grove.auth: no oauth duct '$AUTH_SESSION' $where" >&2
      echo "   the sign-in it raised is gone, so the code has nought to answer." >&2
      echo "   fix: mint a fresh url —" >&2
      echo "     rhx git.grove.auth $grove --brain claude --mech $mech" >&2
      exit 2
    fi
    session="$AUTH_SESSION"
  else
    echo "🦫 chew on it"
    echo ""
    echo "🔑 git.grove.auth $grove --brain claude --mech $mech"
    echo "   ├─ 🌳 grove: ${host:-this box}"
    echo "   ├─ 🔧 duct: $AUTH_SESSION (ours — booted for this sign-in)"

    # ⚠️ REPLACE the duct, never reuse it.
    #
    # .why = an auth is intrinsically non-idempotent: each run mints a new
    #        state + code_challenge, so a prior url on this duct is dead the
    #        instant we start. to reuse the duct would leave that dead url in
    #        the scrollback, where the read below would have to tell it from
    #        the live one — the exact hazard `__url_best` was written for. a
    #        fresh duct has exactly one candidate.
    __grove_sh "${TMUXC}kill-session -t '$AUTH_SESSION' 2>/dev/null; true"

    # ⚠️ SIZE IT AT BIRTH — this is the whole gain of a duct we own.
    #
    #    the url then wraps into rows that fit, ABOVE the input box, on the
    #    FIRST paint. all three defects the attach mech fights are absent by
    #    construction: nought to resize, no SIGWINCH to force, no repaint to
    #    race. `bash -lc` so the login shell puts claude on PATH.
    if ! boot_err=$(__grove_sh "${TMUXC}new-session -d -s '$AUTH_SESSION' -x 200 -y 50 'bash -lc \"$BOOT_CMD\"'" 2>&1); then
      echo "   └─ 💥 could not boot '$BOOT_CMD' $where" >&2
      echo "" >&2
      echo "   tmux said: $boot_err" >&2
      exit 1
    fi
    # 🔴 the BEFORE half of the verdict, read here because the credential is
    #    still the old one until a code lands. the terminus compares against it.
    #
    # ⚠️ it must be read BEFORE the chain runs, and there is no second chance: a
    #   run that skips it can only ever report what it finds, and what it finds
    #   is identical on a swap and on a no-op.
    acct_before=$(__account_read)
    email_before="${acct_before%%	*}"
    org_before="${acct_before##*	}"
    acct_before_read=1
    [[ -n "$email_before" ]] && echo "   ├─ 📋 before: $email_before · org ${org_before:-unread}"

    # 🔴 `-x/-y` ALONE DOES NOT HOLD — tmux honors it only under `window-size
    #    manual`. under the default `window-size latest` a detached session is
    #    re-sized out from under the flag, so the boot reports 200x50 and the
    #    pane is whatever tmux felt like.
    #
    # ⚠️ measured 2026-09-09 on `grove-sandpine-v20260901`, tmux 3.2a: the line
    #   below printed `at 200x50` while `list-panes` read **45x25**. the echo was
    #   a claim about the FLAG, never a read of the pane — a false report of the
    #   plainest kind (`term=false-report`), and it stood for as long as the
    #   skill has existed because nobody measured the thing it asserted.
    #
    # ⇒ so set the mode, resize, then **read the size back and print THAT**. a
    #   render that quotes its input is decoration; one that quotes the record
    #   is an instrument.
    __grove_sh "${TMUXC}set-option -t '$AUTH_SESSION' window-size manual 2>/dev/null; true"
    __grove_sh "${TMUXC}resize-window -t '$AUTH_SESSION' -x 200 -y 50 2>/dev/null; true"
    pane_wh=$(__grove_sh "${TMUXC}list-panes -t '$AUTH_SESSION' -F '#{pane_width}x#{pane_height}'" 2>/dev/null | head -1)
    echo "   ├─ 🌱 booted '$BOOT_CMD' at ${pane_wh:-unread} (asked 200x50)"

    # 🔴 ANNOUNCE THE PRODUCT VERSION, every run.
    #
    # .why = this skill drives a TUI it does not own, by screen text and
    #        keystrokes. so an upstream release can retire a key, rename a
    #        screen, or add one — and every such break presents as a WAIT, never
    #        as an error.
    #
    # ⚠️ v2.1.270 broke three things at once here (a numberless trust select, a
    #   new renderer prompt, a flattened auth-status schema) and the version was
    #   nowhere in the output. so the first question a reader could ask was
    #   "why is it slow" rather than "what moved" — and the answer sat one line
    #   away the whole time.
    #
    # ⇒ it costs one ssh call and turns a mystery into a named cause. a version
    #   that differs from the last run is the single most useful fact available
    #   at the top of a failure report.
    brain_version=$(__grove_sh "claude --version 2>/dev/null | head -1" 2>/dev/null || true)
    echo "   ├─ 🏷️  claude ${brain_version:-unread} (a break in the chain below is usually a version move)"

    # 🔴 the TOKEN mech needs the pane to OUTLIVE its process.
    #
    # .why = a tmux session ends with the program it runs, and the two brains
    #        end differently: `claude` is a repl that STAYS, while
    #        `claude setup-token` prints its token and EXITS at once. so the
    #        pane that holds the token is torn down in the same breath that
    #        fills it, and a reader which polls every 2s finds no session at
    #        all — not a token it failed to match, but a pane that is gone.
    #
    # ⚠️ the failure reads as a MISS rather than a RACE, which is what makes it
    #    costly: the diagnostic prints the pane it read, and an absent session
    #    reads as empty, so the message says "no token was printed" beneath a
    #    blank pane. that is a true sentence about the wrong subject —
    #    measured on grove-sandpine-v20260811, 2026-09-08 (term=false-report).
    #
    # .how = `remain-on-exit on` keeps the pane, with its scrollback, after the
    #        process exits. we then kill the session ourselves once the token
    #        is read, so the fell stays deliberate rather than incidental.
    # ⚠️ spelled as a `&&` one-liner, to match BOOT_CMD and AUTH_SESSION above —
    #    a second `if [[ "$mech" == "token" ]]; then` block would collide with
    #    the token ARM's own opener, and every reader that anchors on that line
    #    would silently bind to whichever came first.
    [[ "$mech" == "token" ]] && __grove_sh "${TMUXC}set-option -t '$AUTH_SESSION' remain-on-exit on 2>/dev/null; true"
    [[ "$mech" == "token" ]] && echo "   ├─ 📌 remain-on-exit — setup-token exits, and the pane must not"

    ####################################################################
    # ⚠️ ANSWER A SCREEN WE RECOGNIZE — never one we assume.
    #
    # .why = a blind Enter is a keystroke on a decision we did not read. so
    #        each pass matches a KNOWN marker and answers only that; anything
    #        else is waited out and, if it never resolves, reported WITH the
    #        pane so a human sees what we saw (rule.require.errors-name-the-fix).
    #
    # .why a DIGIT rather than Enter: a numbered select is answered by its
    #      number, which is cursor-independent. Enter takes whatever happens to
    #      be highlighted — correct today, and a silent mis-pick the day claude
    #      reorders its list or remembers a prior choice.
    #
    # .why AT MOST ONCE per kind: a screen we already answered and that is
    #      still up means our answer did not take. a second keystroke would
    #      land in whatever came next instead, so we wait and time out loud.
    ####################################################################
    answered=""
    arrived=""
    pane=""
    pane_prev=""
    still=0
    unknown=0
    __t_leg1=$(__now)
    for _pass in $(seq 1 40); do
      # 🔴 the CAP is checked before the poll, never after the loop ends.
      #    a pass budget says naught about elapsed time when each pass pays an
      #    ssh handshake of unknown cost.
      __el=$(( $(__now) - __t_leg1 ))
      if [[ "$__el" -ge "$STEP_CAP_SECS" ]]; then
        echo "   └─ ⏱️  leg 1 gave up after ${__el}s (cap ${STEP_CAP_SECS}s), $_pass passes" >&2
        echo "      screens answered: [${answered:-none}]" >&2
        echo "" >&2
        echo "      the pane, as we last read it:" >&2
        printf '%s\n' "$pane" | grep -v '^ *$' | tail -20 | awk '{ printf "     | %s\n", $0 }' >&2
        echo "" >&2
        echo "   fix: read it live —" >&2
        echo "     rhx git.grove.send $grove --what 'tmux capture-pane -t $AUTH_SESSION -p'" >&2
        exit 1
      fi

      pane=$(__grove_sh "${TMUXC}capture-pane -t '$AUTH_SESSION' -p -J -S -200" 2>/dev/null || true)

      # ⚠️ the LAST rows, never the first — a pane's newest line is its state,
      #    and its oldest is a relic (term=duct.pane.relic)
      __dbg "leg1 pass $_pass · ${__el}s · pane tail: $(printf '%s' "$pane" | grep -v '^ *$' | tail -1 | cut -c1-70)"

      ####################################################################
      # 🔴 A PANE THAT DOES NOT MOVE IS A DEAD KEYSTROKE, never a slow boot
      #
      # .why = the two are indistinguishable from outside — both are a loop that
      #        waits — so the cap alone reports "gave up after 90s" and names no
      #        cause. that is the whole reason the v2.1.270 trust break read as
      #        "the skill got slow" and cost six rounds of thought at the wrong
      #        layer.
      #
      # ⇒ a byte-identical pane across passes says our answer did NOT take. held
      #   beside a live select, that is a screen we have no arm for, or an arm
      #   whose key the product retired. either way it will NEVER clear, so the
      #   wait is pure loss and the honest move is to fail at once and show it.
      #
      # ⚠️ scoped to a live SCREEN on purpose. a still pane with no screen up is
      #   an ordinary wait — a boot, a network round trip — and to fail on that
      #   would trade a real defect for a false alarm.
      #
      # 🔴 the scope is `__screen_up`, never a bare `Enter to confirm`. that
      #   phrase is the SELECT footer alone, and a retry prompt
      #   (`Press Enter to retry` / `Esc to cancel`) held this loop for its whole
      #   budget while both guards looked past it. see the helper.
      ####################################################################
      if [[ "$pane" == "$pane_prev" ]]; then still=$((still + 1)); else still=0; fi
      pane_prev="$pane"

      if [[ "$still" -ge 4 ]] && __screen_up "$pane"; then
        echo "   └─ 💥 a screen is up and the pane has not moved in $still passes (${__el}s)" >&2
        echo "      screens answered: [${answered:-none}]" >&2
        echo "" >&2
        echo "      ⇒ either this screen has no arm, or its arm sends a key the" >&2
        echo "        product no longer accepts. it will not clear on its own." >&2
        echo "" >&2
        printf '%s\n' "$pane" | grep -v '^ *$' | tail -20 | awk '{ printf "     | %s\n", $0 }' >&2
        echo "" >&2
        echo "   fix: add or repair the arm for the screen above, in this skill." >&2
        exit 1
      fi

      if printf '%s\n' "$pane" | grep -q 'claude.com/cai/oauth'; then
        arrived=1
        __dbg "leg1 reached the oauth screen in ${__el}s, $_pass passes"
        break
      fi

      # ⚠️ the TRUST screen belongs to leg 1 too, and that is the whole
      #    already-authed defect.
      #
      # .why = on a FRESH box claude asks to trust the folder AFTER the
      #        sign-in, so leg 2 owned that marker and leg 1 never needed it.
      #        on an ALREADY-AUTHED box there is no sign-in to wait for, so
      #        the very same screen arrives at STARTUP — ahead of the repl,
      #        in leg 1, where no arm existed to answer it.
      #
      #        so the swap path parked on a screen the fresh path never sees,
      #        and reported "claude never reached the oauth screen" while a
      #        plain yes/no select sat unanswered. measured 2026-09-03 on a
      #        grove that had been signed in for a day.
      #
      # ⇒ the lesson generalizes past this one marker: leg 1's marker set was
      #   derived from ONE path through the program. a screen is not owned by
      #   a leg, it is owned by a STATE, and the two legs do not see the same
      #   states on a box with history.
      #
      # .note = matched on "Quick safety check", the screen's own body text.
      #         leg 2 matches "trust this folder" — a phrase this screen does
      #         NOT render — so that arm was never the one that fired here.
      # ⚠️ the REPL is matched on THREE markers, and one alone was a defect.
      #
      # .why = `for shortcuts` is ONE skin of the status line, and the status
      #        line varies with the mode claude happens to be in. an
      #        accept-edits box renders `⏵⏵ accept edits on (shift+tab to
      #        cycle)` and the phrase never appears — so the repl was up, with
      #        a live `❯` prompt, and leg 1 spent all 40 passes then reported
      #        "claude never reached the oauth screen" over a pane that plainly
      #        held one. measured 2026-09-07 on an authed grove.
      #
      # ⇒ so a marker must key on what the SCREEN IS, never on one skin of it.
      #   `Welcome back` is the authed-startup banner and does not move with
      #   the mode; the two status-line phrases cover the modes we have seen.
      #
      # .note = the SAME defect class as the trust arm below — a marker set
      #         derived from one path through the program. the trust screen was
      #         a state leg 1 had never visited; this is a state it visits every
      #         time, under a skin it had never seen.
      kind=""
      case "$pane" in
        *"Choose the text style"*) kind=theme ;;
        *"Quick safety check"*)    kind=trust ;;
        *"fullscreen renderer"*)   kind=render ;;
        *"Select login method"*)   kind=method ;;
        *"for shortcuts"*|*"shift+tab to cycle"*|*"Welcome back"*) kind=repl ;;
      esac

      ####################################################################
      # 🔴 AN UNMATCHED SELECT IS A NEW SCREEN, caught on SIGHT
      #
      # .why = the stall guard needs a byte-identical pane, so a screen that
      #        ANIMATES — a spinner, a cursor that blinks, a token counter —
      #        never trips it and burns the full cap instead. this guard keys on
      #        the absence of an ARM, which is a fact about our own code rather
      #        than about the paint, so animation cannot hide it.
      #
      # ⚠️ measured 2026-09-09: v2.1.270 added `Try the new fullscreen renderer?`
      #   and it sat unreachable behind a broken trust arm. with this guard it
      #   would have been named the first time it rendered, by its own text.
      #
      # ⚠️ TWO passes, never one — a screen mid-paint matches no arm for an
      #   instant, and to fail on that trades a real defect for a false alarm.
      ####################################################################
      if [[ -z "$kind" ]] && __screen_up "$pane"; then
        unknown=$((unknown + 1))
      else
        unknown=0
      fi

      if [[ "$unknown" -ge 2 ]]; then
        echo "   └─ 💥 a screen is up that this skill has NO ARM for" >&2
        echo "      screens answered: [${answered:-none}]" >&2
        echo "      claude ${brain_version:-unread}" >&2
        echo "" >&2
        printf '%s\n' "$pane" | grep -v '^ *$' | tail -20 | awk '{ printf "     | %s\n", $0 }' >&2
        echo "" >&2
        echo "   ⇒ the product added or renamed a screen. add an arm for it in the" >&2
        echo "     leg-1 case of this skill, keyed on a phrase from its body text." >&2
        exit 1
      fi

      if [[ -n "$kind" && "$answered" != *"[$kind]"* ]]; then
        case "$kind" in
          theme)
            __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' 1"
            echo "   ├─ ⌨️  theme picker → 1 (dark)" ;;
          trust)
            # the grove's OWN home, which this skill booted claude in a moment
            # ago. a trust grant over a dir we chose ourselves is not a
            # decision borrowed from the human.
            __answer_trust "$pane" ;;
          render)
            # 🔴 DECLINE, and this is not a preference. the fullscreen renderer
            #    draws on the terminal's ALTERNATE screen buffer, which
            #    `capture-pane` does not read — so every screen after it would
            #    capture blank, and a blank pane matches no arm at all.
            #
            # ⇒ the whole skill reads a pane to decide its next keystroke. to
            #   accept here is to blind the instrument the skill IS.
            #
            # ⚠️ new in claude code v2.1.270, and it arrives AFTER the trust
            #   grant — so it was unreachable until the trust arm was repaired,
            #   and it would have been the very next wall.
            __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' 2"
            echo "   ├─ ⌨️  fullscreen renderer → 2 (not now — it would blind capture-pane)" ;;
          method)
            __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' 1"
            echo "   ├─ ⌨️  login method → 1 (claude subscription — the oauth arm)" ;;
          repl)
            # already past first-run, and possibly signed in. /login re-opens
            # the method selector, which the `method` arm then answers.
            __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' '/login' Enter"
            echo "   ├─ ⌨️  already past first-run → sent /login" ;;
        esac
        answered="$answered[$kind]"
      fi

      sleep 2
    done

    if [[ -z "$arrived" ]]; then
      echo "   └─ 💥 claude never reached the oauth screen" >&2
      echo "" >&2
      echo "   screens answered: ${answered:-(none we recognize)}" >&2
      echo "" >&2
      echo "   the pane, as we last read it:" >&2
      printf '%s\n' "$pane" | tail -25 | awk '{ printf "     | %s\n", $0 }' >&2
      echo "" >&2
      echo "   fix: watch it live —" >&2
      echo "     rhx git.grove.send $grove --what 'tmux capture-pane -t $AUTH_SESSION -p'" >&2
      exit 1
    fi
    echo "   ├─ ✔ reached the oauth screen"
    session="$AUTH_SESSION"
  fi

else

  # ── attach: find a duct someone else left at a sign-in ────────────
  # ONE round trip, whatever the session count: the loop runs ON the grove
  # rather than here (rule.require.bulk-over-byhand). a per-session capture
  # from this box would be N+1 ssh connections to answer one question.
  scan="${TMUXC}list-sessions -F '#{session_name}' 2>/dev/null | while IFS= read -r s; do ${TMUXC}capture-pane -t \"\$s\" -p -S -200 2>/dev/null | grep -q 'claude.com/cai/oauth' && printf '%s\n' \"\$s\"; done"

  if ! sessions=$(__grove_sh "$scan" 2>/dev/null); then
    echo "💥 git.grove.auth: could not reach the grove '$host'" >&2
    echo "   check it is awake: rhx git.grove.wake $host --mode plan" >&2
    exit 1
  fi

  session=$(printf '%s\n' "$sessions" | grep -v '^$' | head -1 || true)

  if [[ -z "$session" ]]; then
    echo "✋ git.grove.auth: no claude sign-in prompt $where" >&2
    echo "   every duct there is either signed in already, or at some other" >&2
    echo "   prompt. to RAISE one rather than hunt for one:" >&2
    echo "     rhx git.grove.auth $grove --brain claude --mech oauth" >&2
    exit 2
  fi

fi

# ── paste the code back, when asked ────────────────────────────────
if [[ -n "$code" ]]; then
  echo "🦫 chew on it"
  echo ""
  echo "🔑 git.grove.auth $grove --brain claude --mech $mech --code ***"
  echo "   ├─ 🌳 grove: ${host:-this box}"
  echo "   ├─ 🔧 duct: $session"

  # 🔴 LEG 2 TAKES ITS OWN BEFORE, and this is not a duplicate of leg 1's.
  #
  # .why = the two legs are separate INVOCATIONS of this skill. a variable set
  #        in leg 1 is gone by the time leg 2 runs, so a before captured only at
  #        the boot can never reach the terminus that compares it — the swap
  #        verdict would silently degrade to a single read on every real run,
  #        which is the one path a caller actually walks.
  #
  # 🟢 and leg 2 can take it honestly: the code has not been sent yet, so the
  #    OLD credential is still the live one at this exact line. a capture one
  #    statement later would read the new account and compare it to itself.
  acct_before=$(__account_read)
  email_before="${acct_before%%	*}"
  org_before="${acct_before##*	}"
  acct_before_read=1
  [[ -n "$email_before" ]] && echo "   ├─ 📋 before: $email_before · org ${org_before:-unread}"

  ####################################################################
  # 🔴 LEG 2 IS IDEMPOTENT — it reads the box, then decides
  #
  # .why = a re-run must CONVERGE, never corrupt. a blind re-paste appends to
  #        whatever the box already holds, so a second run over a stuck first one
  #        yields a doubled code — and the failure then reads as a bad code
  #        rather than as our own fault. three states, three acts:
  #
  #   | the box holds        | the act                    |
  #   |----------------------|----------------------------|
  #   | empty                | paste, then submit         |
  #   | 🔴 the code already  | **submit only** — no paste |
  #   | the prompt is gone   | skip to the screen chain   |
  #
  # ⇒ so a caller who re-runs with the same code always advances the flow by
  #   exactly the step still owed (`rule.require.idempotent-procedures`).
  ####################################################################
  box=$(__grove_sh "${TMUXC}capture-pane -t '$session' -p -J -S -40" 2>/dev/null || true)

  if ! printf '%s\n' "$box" | grep -q 'Paste code here'; then
    echo "   ├─ ✔ the code box is already gone — the chain is past the paste"
  else
    # the box masks its content with asterisks, so a filled box is legible
    if printf '%s\n' "$box" | grep -qE 'Paste code here[^*]*\*{10,}'; then
      echo "   ├─ ↩️  the box already holds a code — submit only, never re-paste"
    else
      code_q="${code//\'/\'\\\'\'}"
      __grove_sh "${TMUXC}send-keys -t '$session' -l '$code_q'"
      echo "   ├─ ⌨️  code pasted"
      sleep 1
    fi

    # 🔴 the Enter is its OWN send, never an extra arg on the paste.
    #
    # .why = a long code arrives as a PASTE, and the Ink input box swallows the
    #        Enter that rides in the same `send-keys`. the code then sits in the
    #        box unsubmitted while the skill reports it sent — and the caller
    #        finishes the job by hand, which is the tell that the tool is not
    #        finished (`rule.always.entool-the-skills-you-touch`).
    #
    # ⚠️ measured 2026-09-09: a 92-char code sat masked in the box, the prompt
    #   read as "STILL up", and the run exited 1 over a code that was perfectly
    #   good. the same defect `git.crew.send --submit` exists to name.
    __grove_sh "${TMUXC}send-keys -t '$session' Enter"
    echo "   ├─ ⌨️  submitted"
  fi

  # rule.require.verify-after-send — a send is never complete on its own
  # report. between the read that justified it and the moment it lands, the
  # prompt may have moved.
  sleep 3
  after=$(__grove_sh "${TMUXC}capture-pane -t '$session' -p -S -40" 2>/dev/null || true)
  if printf '%s\n' "$after" | grep -q 'claude.com/cai/oauth'; then
    echo "   └─ ✋ the sign-in prompt is STILL up — the code may be wrong or stale" >&2
    echo "" >&2
    echo "   read it:" >&2
    echo "     rhx git.grove.send $grove --what 'tmux capture-pane -t $session -p'" >&2
    exit 1
  fi
  echo "   ├─ ✔ the sign-in prompt cleared"

  # ⚠️ the drive runs under `oauth` ALONE, and the gate is a safety property.
  #
  # .why = under `attach`, `$session` is whatever the SCAN found — a duct a
  #        HUMAN may be sat at. the code itself is theirs to receive, since
  #        they asked for it. every key AFTER it is ours, and ours to send
  #        into a session we do not own. under `oauth` the duct is one this
  #        skill booted a moment ago, so no such doubt exists.
  if [[ -z "$owned" ]]; then
    echo ""
    echo "🦫 dam fine! the code landed $where"
    echo "   ⚠️  under --mech attach the duct is not ours, so the first-run"
    echo "      screens after it are the human's to answer."
    exit 0
  fi

  ####################################################################
  # ⚠️ the TOKEN mech ends HERE, and its terminus is the token itself.
  #
  # .why = setup-token raises no first-run chain — it prints a token and
  #        exits. so the screen driver below would find no marker, spend its
  #        30 passes, and then reach for `claude auth status`, which under an
  #        oauth_token reports `loggedIn: true` for a string we invented. that
  #        is the one terminus this mech must never borrow.
  #
  # .how  = the token is read from the pane by its own prefix and printed on
  #         STDOUT ALONE, so it pipes into `keyrack set --value @stdin`. every
  #         human-readable line goes to stderr, which is what keeps the pipe
  #         clean (the `keyrack get --value` convention).
  if [[ "$mech" == "token" ]]; then
    tok=""
    for _pass in $(seq 1 20); do
      pane=$(__grove_sh "${TMUXC}capture-pane -t '$AUTH_SESSION' -p -J -S -200" 2>/dev/null || true)
      tok=$(printf '%s\n' "$pane" | tr -d ' \t' | grep -o 'sk-ant-oat[0-9]*-[A-Za-z0-9_-]\{20,\}' | tail -1 || true)
      [[ -n "$tok" ]] && break
      sleep 2
    done

    if [[ -z "$tok" ]]; then
      echo "   └─ 💥 the code landed and NO token was printed" >&2
      echo "" >&2
      printf '%s\n' "$pane" | grep -v '^ *$' | tail -15 | awk '{ printf "     | %s\n", $0 }' >&2
      echo "" >&2
      echo "   fix: mint a fresh url and try again —" >&2
      echo "     rhx git.grove.auth $grove --brain claude --mech token" >&2
      exit 1
    fi

    __grove_sh "${TMUXC}kill-session -t '$AUTH_SESSION' 2>/dev/null; true"
    echo "   ├─ ✔ token minted — ${#tok} chars, prefix ${tok:0:14}…" >&2
    echo "   └─ 🔒 the duct is felled, so the token lives only in this pipe" >&2
    echo "" >&2
    echo "🦫 dam fine! store it — the value is on stdout, never in argv:" >&2
    echo "   rhx keyrack set --key CLAUDE_CODE_OAUTH_TOKEN --vault aws.params \\" >&2
    echo "     --reach <email> --org @all --env camp" >&2

    # ⚠️ stdout gets the token and NOUGHT else — this line is the contract.
    printf '%s\n' "$tok"
    exit 0
  fi

  ####################################################################
  # ⚠️ the code is NOT the last keystroke.
  #
  # .why = a correct code is answered by a CHAIN of first-run screens — a
  #        login confirmation, a security notice, a trust-this-folder select,
  #        an effort select — and every one of them waits on a key. a leg 2
  #        that sends the code, reads the pane once, and exits 0 on the
  #        absence of the oauth url leaves the duct parked mid-chain on a
  #        grove which is authed and unusable, under a line that says it is
  #        signed in.
  #
  # .why each screen is keyed on its OWN body text, never on the shared
  #      "Press Enter to continue" that two of them carry: one kind for both
  #      would let the answer-once guard swallow the second press, and the
  #      chain would hang on the screen it had already "answered".
  #
  # .why `repl` is matched LAST: the status line can sit on screen beneath a
  #      live select, so an active screen must outrank it. first-match order
  #      is the guard.
  ####################################################################
  answered=""
  landed=""
  pane=""
  pane_prev=""
  still=0
  unknown=0
  oauth_err=""
  __t_leg2=$(__now)
  for _pass in $(seq 1 30); do
    # the same wall-clock cap as leg 1 — see there for why a pass budget lies
    __el=$(( $(__now) - __t_leg2 ))
    if [[ "$__el" -ge "$STEP_CAP_SECS" ]]; then
      echo "   ├─ ⏱️  leg 2 gave up after ${__el}s (cap ${STEP_CAP_SECS}s), $_pass passes" >&2
      echo "   │     screens answered: [${answered:-none}]" >&2
      printf '%s\n' "$pane" | grep -v '^ *$' | tail -12 | awk '{ printf "   │    | %s\n", $0 }' >&2
      # ⚠️ do NOT exit — the credential terminus below is the real verdict, and
      #    it may well have landed while the screen chain stalled
      break
    fi

    pane=$(__grove_sh "${TMUXC}capture-pane -t '$AUTH_SESSION' -p -J -S -200" 2>/dev/null || true)

    __dbg "leg2 pass $_pass · ${__el}s · pane tail: $(printf '%s' "$pane" | grep -v '^ *$' | tail -1 | cut -c1-70)"

    ####################################################################
    # 🔴 AN OAUTH ERROR IS A TERMINUS, never a screen to answer
    #
    # .why = the code exchange can FAIL — an expired code, a spent one, a
    #        server-side reject — and claude reports it in the pane and parks:
    #
    #          OAuth error: Request failed with status code 400
    #          Press Enter to retry.
    #
    # 🔴 .why it must be caught HERE rather than left to the terminus: a failed
    #    exchange leaves the account UNMOVED, which is byte-identical to a
    #    no-op swap on the one axis the verdict measures. so the terminus read
    #    `before == after`, concluded NO-OP, and printed **"the credential is
    #    fresh"** over a credential that never changed — then blamed the browser
    #    and prescribed a sign-out that repairs no part of it.
    #
    # ⚠️ measured 2026-09-14 on `grove-sandpine-v20260901`. the run exited 2 with a
    #   confident cause and a useless cure; the pane held the true one the whole
    #   time. a verdict drawn from a CORRELATE of the outcome rather than from a
    #   record of it (`term=false-report`, and the same shape
    #   `rule.require.trust-but-verify` names: read the pane, never reason about
    #   it).
    #
    # ⇒ so the error is captured as its own FACT, and the terminus branches on
    #   it BEFORE it may reach for the no-op arm.
    ####################################################################
    if printf '%s\n' "$pane" | grep -q 'OAuth error'; then
      oauth_err=$(printf '%s\n' "$pane" | grep -o 'OAuth error.*' | head -1)
      break
    fi

    # the same stall guard as leg 1 — see there for why a still pane under a live
    # select is a dead keystroke rather than a slow one
    if [[ "$pane" == "$pane_prev" ]]; then still=$((still + 1)); else still=0; fi
    pane_prev="$pane"

    if [[ "$still" -ge 4 ]] && __screen_up "$pane"; then
      echo "   ├─ 💥 a screen is up and the pane has not moved in $still passes (${__el}s)" >&2
      echo "   │     screens answered: [${answered:-none}]" >&2
      printf '%s\n' "$pane" | grep -v '^ *$' | tail -16 | awk '{ printf "   │    | %s\n", $0 }' >&2
      # ⚠️ BREAK, never exit — same reason as the cap below: the credential
      #   terminus is the real verdict, and it may already have landed
      break
    fi

    # ⚠️ the same THREE repl markers as leg 1, and their absence here is what
    #    printed a false warning on EVERY swap this session.
    #
    # .why = leg 2 ends when it sees the repl. keyed on `for shortcuts` alone it
    #        never saw one, so all four swaps of 2026-09-04 fell out of the loop
    #        and reported "⚠️ the repl never came up, though the credential DID
    #        land" — while the repl was up and healthy behind an accept-edits
    #        status line.
    #
    # ⇒ the warning was HARMLESS and that is precisely what made it durable: the
    #   credential terminus below is the real verdict, so the run still ended
    #   correct and the line read as a quirk of the chain rather than as a
    #   defect in the reader. **a false alarm that never blocks anything is the
    #   kind that survives longest** (term=false-report).
    kind=""
    case "$pane" in
      *"Login successful"*)        kind=welcome ;;
      *"Security notes"*)          kind=notes ;;
      *"Quick safety check"*)      kind=trust ;;
      *"fullscreen renderer"*)     kind=render ;;
      *"recommend medium effort"*) kind=effort ;;
    esac

    # 🔴 the repl is a SEPARATE AXIS, never a fifth arm of the case above.
    #
    # .why = `Login successful` is not a screen that ends. it is a TRANSCRIPT
    #        LINE the repl keeps forever — `❯ /login` / `⎿ Login successful`
    #        sits on the VISIBLE pane beside a live `❯` and the status bar.
    #        as a fifth arm it matched first on every pass, so `repl`, placed
    #        last on purpose, was unreachable and leg 2 always fell out of the
    #        loop. measured on grove-sandpine-v20260901, 2026-09-07.
    #
    # ⚠️ first-match order cannot settle this, because BOTH claims hold:
    #      · an UNANSWERED select must outrank the repl — the status bar can
    #        sit on screen beneath a live modal
    #      · a DEAD transcript line must NOT outrank it
    #    one ordered list has no slot for both. so the rank is by ANSWERED
    #    state rather than by position: an open screen wins, a closed one
    #    yields.
    repl=""
    case "$pane" in
      *"for shortcuts"*|*"shift+tab to cycle"*|*"Welcome back"*) repl=1 ;;
    esac

    ####################################################################
    # 🔴 AN UNMATCHED SELECT IS A NEW SCREEN — leg 1's twin. see there for why
    #    the stall guard alone cannot catch an ANIMATED screen.
    #
    # ⚠️ it must clear BOTH axes, never just `$kind`. leg 2 ranks by answered
    #   state rather than by position, so a pane with a live repl is a pane
    #   this skill understands even where no case arm matched — to test `$kind`
    #   alone would fire on the terminus itself.
    ####################################################################
    if [[ -z "$kind" && -z "$repl" ]] && __screen_up "$pane"; then
      unknown=$((unknown + 1))
    else
      unknown=0
    fi

    if [[ "$unknown" -ge 2 ]]; then
      echo "   ├─ 💥 a screen is up that this skill has NO ARM for" >&2
      echo "   │     screens answered: [${answered:-none}]" >&2
      echo "   │     claude ${brain_version:-unread}" >&2
      printf '%s\n' "$pane" | grep -v '^ *$' | tail -16 | awk '{ printf "   │    | %s\n", $0 }' >&2
      echo "   │  ⇒ the product added or renamed a screen. add an arm for it in the" >&2
      echo "   │    leg-2 case of this skill, keyed on a phrase from its body text." >&2
      # ⚠️ BREAK, never exit — same reason as the cap and stall guards above:
      #   the credential terminus is the real verdict, and it may already
      #   have landed behind the screen we cannot name
      break
    fi

    if [[ -n "$kind" && "$answered" != *"[$kind]"* ]]; then
      case "$kind" in
        welcome)
          __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' Enter"
          echo "   ├─ ⌨️  login confirmed → Enter" ;;
        notes)
          __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' Enter"
          echo "   ├─ ⌨️  security notes → Enter" ;;
        trust)
          __answer_trust "$pane" ;;
        render)
          # see leg 1's arm — it would blind capture-pane
          __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' 2"
          echo "   ├─ ⌨️  fullscreen renderer → 2 (not now — it would blind capture-pane)" ;;
        effort)
          __grove_sh "${TMUXC}send-keys -t '$AUTH_SESSION' 1"
          echo "   ├─ ⌨️  effort → 1 (medium — claude's own default)" ;;
      esac
      answered="$answered[$kind]"
      sleep 2
      continue
    fi

    # every open screen is closed, so a repl on the pane is the terminus
    if [[ -n "$repl" ]]; then landed=1; break; fi

    sleep 2
  done

  ####################################################################
  # ⚠️ THE FINAL CLAIM IS THE CREDENTIAL, never the screen.
  #
  # .why = "the repl is up" and "this grove is signed in as X" are two
  #        different facts, and a line that measures the first while it
  #        asserts the second is a volunteered diagnosis
  #        (term=volunteered-diagnosis). `claude auth status` reads the
  #        credential itself, over a FRESH connection, so it cannot inherit
  #        any state from the pane it grades.
  #
  # .why it also NAMES the account: a swap that silently re-authed the very
  #      account we meant to leave is indistinguishable from a success until
  #      somebody prints the email. this is the one line that would have
  #      caught it.
  ####################################################################
  acct_after=$(__account_read)
  email_now="${acct_after%%	*}"
  org_now="${acct_after##*	}"

  ####################################################################
  # 🔴 THE EXCHANGE FAILED — and this branch outranks EVERY one below it
  #
  # .why the ORDER is the whole repair, and it is owed against two neighbours:
  #
  #   · the NO-OP arm — a failure and a no-op both leave the account unmoved,
  #     so every comparison below reads them alike. the no-op arm would claim
  #     `the credential is fresh`, the exact opposite of what happened, and
  #     send the caller to sign out of a browser that was never at fault.
  #
  #   · the SIGNED-IN-AS-NOBODY arm — on a failed FIRST auth there is no prior
  #     account, so `email_now` is empty and that arm fires. its dump does
  #     carry the error, but its headline names a vague end-state where a
  #     precise cause is in hand. the specific verdict outranks the general.
  #
  # ⚠️ it outranks the repl warn too: `the repl never came up, though the
  #   credential DID land` asserts a landing that did not occur, so on this
  #   path it is a second false sentence stacked on the first.
  ####################################################################
  if [[ -n "$oauth_err" ]]; then
    echo "   └─ 💥 the code was REFUSED — the credential did NOT change" >&2
    echo "" >&2
    echo "   claude said: $oauth_err" >&2
    echo "" >&2
    if [[ -n "$email_now" ]]; then
      echo "   still signed in as: $email_now · org ${org_now:-unread}" >&2
    else
      echo "   the grove is signed in as nobody — this was a first auth, and it failed" >&2
    fi
    echo "" >&2
    echo "   .why = a 400 here is almost always an EXPIRED or SPENT code. a url" >&2
    echo "          mints a fresh state + code_challenge, so the code it yields" >&2
    echo "          is good once and briefly." >&2
    echo "" >&2
    echo "   ⚠️ this is NOT a no-op swap. the account is unmoved because the" >&2
    echo "      exchange failed, never because the browser re-chose it — so a" >&2
    echo "      sign-out repairs no part of this." >&2
    echo "" >&2
    echo "   fix: mint a fresh url and paste the code back PROMPTLY —" >&2
    echo "     rhx git.grove.auth $grove --brain claude --mech oauth" >&2
    exit 1
  fi

  # ⚠️ reached only where the pane named NO error — so an empty account here is
  #   a genuine unknown, and the pane dump is the whole diagnosis.
  if [[ -z "$email_now" ]]; then
    echo "   └─ 💥 the chain finished and the grove is signed in as nobody" >&2
    echo "" >&2
    printf '%s\n' "$pane" | grep -v '^ *$' | tail -12 | awk '{ printf "     | %s\n", $0 }' >&2
    echo "" >&2
    echo "   fix: mint a fresh url and try again —" >&2
    echo "     rhx git.grove.auth $grove --brain claude --mech oauth" >&2
    exit 1
  fi

  if [[ -z "$landed" ]]; then
    echo "   ├─ ⚠️ the repl never came up, though the credential DID land"
  fi

  ####################################################################
  # 🔴 the verdict is a COMPARISON, never a single read
  #
  # .why = a run has THREE outcomes, and two of them print the same sentence:
  #
  #   | the run    | what moved   | what one endpoint prints |
  #   |------------|--------------|--------------------------|
  #   | a swap     | the account  | `signed in as X`         |
  #   | 🔴 a NO-OP | **naught**   | `signed in as X` — same  |
  #   | a failure  | naught       | `signed in as X` — same  |
  #
  # 🔴 .the third row once read `an error, exit ≠ 0`, and that was FALSE — the
  #   claim that made this whole block safe to reason about. `auth status` reads
  #   the credential, and a credential that never changed answers perfectly: a
  #   refused exchange is invisible to this endpoint, exactly as a no-op is.
  #
  #   measured 2026-09-14: a 400 reached this comparison, matched the NO-OP arm,
  #   and printed `the credential is fresh` over one that never moved.
  #
  # ⇒ so rows 2 and 3 are parted UPSTREAM, by the pane, and `$oauth_err` carries
  #   that fact down here. by the time control reaches this block, a failure has
  #   already exited — which is the only reason the comparison below is sound.
  #
  #   the account a swap lands is chosen by the BROWSER, never by the caller: the
  #   url authorizes whichever identity that browser session already holds. so a
  #   caller who wants a different account and does not sign out first re-auths
  #   the SAME one — and the run succeeds, writes a fresh credential, and reports
  #   truthfully. no read of one endpoint can part rows 1 and 2.
  #
  # ⚠️ and the compare needs BOTH fields. one human can hold two orgs, so an
  #   unmoved email beside a moved orgId is a real swap — `email` alone would
  #   call it a no-op. measured three times on 2026-09-08 (`term=auth.swap`).
  ####################################################################
  # ⚠️ UNREAD is not the same as SIGNED-OUT, and both are an empty string. a mech
  #    that booted no duct held no moment at which the old credential was still
  #    live, so it has no before to compare against — and must SAY so rather than
  #    let a reader take its single read for a comparison.
  if [[ -z "$acct_before_read" ]]; then
    echo "   └─ ✔ signed in — $email_now"
    echo "      ⚠️ a read, never a comparison — no before was taken under --mech $mech,"
    echo "         so a no-op swap would print this same line"
    echo ""
    echo "🦫 dam fine! claude is signed in as $email_now $where"
    exit 0
  fi

  if [[ -z "$email_before" ]]; then
    echo "   └─ ✔ signed in — $email_now (no prior account; a first auth, never a swap)"
    echo ""
    echo "🦫 dam fine! claude is signed in as $email_now $where"
    exit 0
  fi

  if [[ "$email_before" == "$email_now" && "$org_before" == "$org_now" ]]; then
    echo "   └─ ⚠️ NO-OP — the credential is fresh and the ACCOUNT did not move"
    echo ""
    echo "   before: $email_before · org $org_before"
    echo "   after:  $email_now · org $org_now"
    echo ""
    echo "   .why = the browser chose it. that session still held this account, so"
    echo "          the url re-authorized the one you meant to leave."
    echo ""
    echo "   fix: sign out at claude.com, or open the url in a private window,"
    echo "        then mint a fresh one —"
    echo "     rhx git.grove.auth $grove --brain claude --mech oauth"
    exit 2
  fi

  echo "   └─ ✔ SWAPPED — $email_before → $email_now"
  echo ""
  echo "   org: $org_before → $org_now"
  echo ""
  echo "🦫 dam fine! claude is signed in as $email_now $where"
  exit 0
fi

# ── validate ───────────────────────────────────────────────────────
# ⚠️ this gate is the point of the skill, and it must never be relaxed.
#
# .why = a url mangled by the overlay, or clipped at the tail, is still a
#        well-formed string that starts with https://claude.com/ — it merely
#        does not work, and no human can see the difference. to hand that over
#        would be a false report in its costliest shape: our ordinary success
#        format, over content that is untrue.
#
#        so we check the two parameters that always ride at the END of a
#        claude oauth url. where the overlay ate the middle, or the pane
#        clipped the tail, at least one of them is absent.
#
#        proven live: a 400-col read yielded a url whose last parameter was
#        `code_challenge_method=S256` — a plausible terminus — with `&state=`
#        silently absent. the gate refused it.
__url_complete() {
  [[ -n "$1" ]] && [[ "$1" == *"code_challenge="* ]] && [[ "$1" == *"state="* ]]
}

# ── widen, so the box has no url row to sit on ─────────────────────
# ⚠️ the widen and the join are NOT alternatives — each covers what the other
#    cannot, and the url needs both:
#
#      the JOIN  reassembles rows claude wrapped. it cannot recover a row the
#                input box overwrote, because those characters are destroyed.
#      the WIDEN gives the url fewer rows, so the box lands BELOW it rather
#                than on it — which is the only way that row survives at all.
#
# .note = `window-size manual` is required before resize-window takes; tmux
#         otherwise snaps the window back to its client's size at once. it is
#         restored on every exit path, a failure included.
#
# ⚠️ the resize is VERIFIED, never assumed. these calls first shipped as
#    `2>/dev/null || true`, which failhid the one fact the read depends on:
#    when the widen did not take, the skill read a narrow pane and blamed the
#    url. a width we measured is a fact; a resize we merely issued is a wish.
#
# `--width 0` opts out of the widen entirely: read the pane exactly as it is,
# and mutate no part of a session a human may be at.
#
# ⚠️ the oauth mech opts out ALWAYS, and not as a shortcut: it sized its own
#    duct at birth, so the pane already has the geometry this block exists to
#    impose. to resize it here would re-introduce the very repaint race the
#    owned duct removes.
if [[ -n "$owned" ]]; then width=0; fi

if [[ "$width" != "0" ]]; then

restore_width() {
  __grove_sh "${TMUXC}set-option -t '$session' window-size latest" 2>/dev/null || true
}
trap restore_width EXIT

if ! resize_err=$(__grove_sh "${TMUXC}set-option -t '$session' window-size manual" 2>&1); then
  echo "💥 git.grove.auth: could not set window-size manual on '$session'" >&2
  echo "   tmux said: $resize_err" >&2
  exit 1
fi
if ! resize_err=$(__grove_sh "${TMUXC}resize-window -t '$session' -x $width -y 60" 2>&1); then
  echo "💥 git.grove.auth: could not widen '$session' to ${width} cols" >&2
  echo "   tmux said: $resize_err" >&2
  exit 1
fi

width_got=$(__grove_sh "${TMUXC}display-message -p -t '$session' '#{window_width}'" 2>&1 || true)
if [[ "$width_got" != "$width" ]]; then
  echo "💥 git.grove.auth: the widen did NOT take — asked ${width} cols, the window reports '${width_got}'" >&2
  echo "   why: we refuse to read at a width we did not get." >&2
  exit 1
fi

fi

# ⚠️ the url spans SEVERAL rows, and WE rejoin them — tmux cannot.
#
# .why = claude wraps the url itself and prints real newlines, so tmux never
#        marks those rows as wrapped and `capture-pane -J` leaves them apart.
#        a plain grep therefore returns only the first row — ~90 characters,
#        cut mid-client-id. that fragment is a well-formed https://claude.com/
#        string, so it reads as a url and is a dead link.
#
# .how  = a continuation row is one that holds url characters and no space. we
#         append rows while that holds, and stop at the first row that does not.
#         a later url resets the accumulator, so the FRESHEST one is what we
#         hand over — a pane may still hold an expired url from an earlier try.
#
# ⚠️ the no-space test is the SAFETY property, not a convenience.
#
#    claude draws its "Paste code here if prompted >" box over one row when the
#    prompt is live, and the characters beneath are DESTROYED in the capture,
#    never merely hidden. observed at 45 columns:
#
#      A%2F%2Fplatform.claude.com%2Foauth%2Fcode%2Fc
#      aPaste code here if prompted > key+user%3Apro   <- `llback&scope=...` gone
#
#    an overwritten row carries spaces, so the join STOPS there rather than
#    splice a hole into the middle. the url then lacks `state=` and the gate
#    below refuses it. a short read is honest; a spliced one is a false report.
__url_from_pane() {
  printf '%s\n' "$1" | awk '
  # ⚠️ RIGHT-TRIM FIRST, and only then test. a widened pane pads every row out
  #    to its full width, so the continuation rows carry a trailing run of
  #    spaces — and the no-space test below rejected them for it. the widen
  #    thereby defeated the join, and the pair reported a one-row url.
  #
  #    trailing space is padding; INTERIOR space is the box collision. so a
  #    right-trim strips the artifact and leaves the safety property whole.
  # ⚠️ trim BOTH ends, and only then test for a space.
  #
  # .why = the repl paints the url inside an INDENTED box, so every row
  #        carries leading spaces as well as trailing ones. a right-trim alone
  #        rejected each continuation row for its indent, so the join stopped
  #        at row 1 and the gate refused a 44-character fragment. measured
  #        2026-09-03 on the already-authed swap path, where the box renders
  #        narrower than the ~93 columns the fresh path had shown.
  #
  # ⚠️ this does NOT weaken the safety property, which is about INTERIOR
  #    spaces: a row the "Paste code here" box overwrote carries a space in
  #    the MIDDLE, and a trim of the two ends leaves that space exactly where
  #    it is. so an overwritten row is still rejected and the join still stops
  #    rather than splice a hole. indent and padding are artifacts; an
  #    interior space is evidence.
  {
    line = $0
    sub(/^[ \t]+/, "", line)
    sub(/[ \t]+$/, "", line)
  }
  line ~ /https:\/\/claude\.com\// {
    if (u != "") print u
    sub(/^.*https:\/\/claude\.com\//, "https://claude.com/", line)
    u = line
    more = 1
    next
  }
  more {
    if (line ~ /^[A-Za-z0-9._~:\/?#@!$&()*+,;=%-]+$/) { u = u line; next }
    more = 0
  }
  END { if (u != "") print u }
' || true
}

# ⚠️ pick the BEST candidate, never the last one.
#
# .why = the pane holds the url MORE THAN ONCE — a scrollback copy from when it
#        was first printed, plus whatever the live screen currently renders. an
#        earlier cut took the last match and so preferred the newest, which on
#        a mid-redraw pane is a bare first row: 93 characters, cut mid-client-id
#        and complete-looking. it beat a whole, correct copy sitting above it.
#
#        so rank by the gate rather than by position: the LAST candidate that
#        satisfies it wins (freshest among the sound ones). where none does, we
#        keep the longest purely so the refusal can show its best attempt.
__url_best() {
  local all complete
  all="$(__url_from_pane "$1")"
  complete=$(printf '%s\n' "$all" | awk '/code_challenge=/ && /state=/' | tail -1)
  if [[ -n "$complete" ]]; then
    printf '%s\n' "$complete"
    return 0
  fi
  printf '%s\n' "$all" | awk '{ if (length($0) > length(best)) best = $0 } END { print best }'
}

# ⚠️ the read RETRIES against the gate, never against a clock.
#
# .why = claude redraws on SIGWINCH, so a capture taken before the re-wrap
#        lands reads the OLD, narrow rows. a fixed `sleep` is a guess at how
#        long that takes, and the guess fails silently — observed live: two
#        seconds sufficed on one run and, on the very next, returned the same
#        93-column fragment cut mid-client-id.
#
#        the gate already knows what a good read looks like, so it is the
#        correct loop condition. we re-read until it is satisfied, or until
#        the attempts are spent. no duration is ever assumed.
url=""
for i in 1 2 3 4 5 6 7 8; do
  # ⚠️ NUDGE THE REDRAW, do not merely wait for one.
  #
  # .why = claude paints its login screen into the viewport and repaints only
  #        on SIGWINCH. so a pane too SHORT renders the url's first row and
  #        drops the rest — the missed rows were never printed, so no capture
  #        can recover them, and no length of sleep changes that.
  #
  #        a resize is what delivers SIGWINCH, so each pass toggles the width
  #        by one column to guarantee a fresh one. HEIGHT is the fix (-y 60
  #        gives the url room to land whole); the toggle is only the trigger.
  if [[ "$width" != "0" ]]; then
    __grove_sh "${TMUXC}resize-window -t '$session' -x $((width - i % 2)) -y 60" 2>/dev/null || true
  fi
  sleep 1
  pane=$(__grove_sh "${TMUXC}capture-pane -t '$session' -p -J -S -400" 2>/dev/null || true)
  url=$(__url_best "$pane")
  __url_complete "$url" && break
done

if ! __url_complete "$url"; then
  echo "💥 git.grove.auth: the url read back INCOMPLETE — it is refused, never handed over" >&2
  echo "   got: ${url:-(none)}" >&2
  echo "" >&2
  echo "   why: it must carry both code_challenge= and state=. a url short of" >&2
  echo "        either is a wrapped row read alone, or a row the input box" >&2
  echo "        overwrote — either way it looks right and does not work." >&2
  echo "" >&2
  # ⚠️ SHOW THE ROWS WE READ. an error that reports only its verdict leaves the
  #    human to re-derive the pane state by hand, and the pane is what they
  #    cannot see from here (rule.require.errors-name-the-fix).
  echo "   the rows it read, from the first url row on:" >&2
  printf '%s\n' "$pane" | awk '
    /https:\/\/claude\.com\// { n = 1 }
    n && n <= 8 { printf "     %d| [%s]\n", n, $0; n++ }
  ' >&2
  echo "" >&2
  echo "   fix: read the pane by eye and copy it whole —" >&2
  echo "        rhx duct.read --on 'duct://${host}/${session}' --lines 40" >&2
  exit 1
fi

# the oauth arm already opened this tree while it drove the screens, so it
# resumes the SAME tree here rather than start a second one.
if [[ -z "$owned" ]]; then
  echo "🦫 chew on it"
  echo ""
  echo "🔑 git.grove.auth $grove --brain claude --mech attach"
  echo "   ├─ 🌳 grove: ${host:-this box}"
  echo "   ├─ 🔧 duct: $session"
fi
echo "   ├─ 🔭 read with capture-pane -J (wrapped rows rejoined)"
echo "   ├─ ✔ url complete — carries code_challenge + state"
echo "   └─ 🔗 sign in:"
echo ""
echo "$url"
echo ""

if [[ -n "$print_only" ]]; then
  echo "🦫 printed — open it yourself (--print)"
  echo "   └─ then hand the code back:"
  echo "      rhx git.grove.auth $grove --brain claude --mech $mech --code '<the code>'"
  exit 0
fi

# ⚠️ VERIFY THE OPEN — do not report a browser we never proved we raised.
#
# .why = this shipped as `xdg-open "$url" >/dev/null 2>&1 &` — backgrounded,
#        both streams discarded, exit code unread. so it printed "opened in
#        your browser" whether or not a browser opened, which is a false
#        report in its costliest shape: our ordinary success line over content
#        that is untrue. caught live — a human watched for a window that never
#        came while we told them it had (term=false-report, cause = failhide).
#
# .how  = run it in the FOREGROUND and read its verdict. `timeout` bounds the
#         rare handler that does not detach, so a verified open cannot become
#         a hang. the url is already printed above, so a refusal still leaves
#         the caller everything they need.
if command -v xdg-open >/dev/null 2>&1; then
  open_err=""
  open_code=0
  open_err=$(timeout 15 xdg-open "$url" 2>&1) || open_code=$?

  # ⚠️ SAY WHAT WE MEASURED, never what we hope it caused.
  #
  # .why = this line read "opened in your browser", which is a claim about a
  #        WINDOW. all we ever observe is xdg-open's exit code — and a `$BROWSER`
  #        wrapper commonly ends in `setsid -f ... >/dev/null 2>&1`, which
  #        returns 0 the instant it forks, whether or not the browser came up.
  #        so a 0 here is honest about the HANDOFF and says nought about the
  #        window (term=volunteered-diagnosis: the measured half and the
  #        reasoned half, fused into one sentence).
  #
  #        observed live — a human watched for a window that never came while
  #        this line told them it had. the url stays printed above precisely so
  #        the weaker claim still leaves them whole.
  if [[ $open_code -eq 0 ]]; then
    echo "🦫 dam fine! handed to xdg-open on THIS box, which took it (exit 0)"
    echo "   ├─ ⚠️ that is the HANDOFF, not the window — a \$BROWSER wrapper that"
    echo "   │     forks and detaches exits 0 either way. if no tab came up, the"
    echo "   │     url above is still good; open it by hand."
    echo "   └─ hand the code back with:"
    echo "      rhx git.grove.auth $grove --brain claude --mech $mech --code '<the code>'"
    exit 0
  fi

  echo "✋ git.grove.auth: xdg-open did NOT open it — the url above is still good" >&2
  echo "" >&2
  if [[ $open_code -eq 124 ]]; then
    echo "   what: xdg-open hung past 15s and was cut off" >&2
  else
    echo "   what: xdg-open exited $open_code" >&2
    [[ -n "$open_err" ]] && echo "   said: $open_err" >&2
  fi
  echo "" >&2
  echo "   fix: copy the url above into a browser by hand, then:" >&2
  echo "     rhx git.grove.auth $grove --brain claude --mech $mech --code '<the code>'" >&2
  exit 1
fi

echo "✋ no xdg-open on this box — the url is above, open it by hand" >&2
echo "   then: rhx git.grove.auth $grove --brain claude --code '<the code>'" >&2
exit 1