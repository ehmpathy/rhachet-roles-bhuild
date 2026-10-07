#!/usr/bin/env bash
######################################################################
# ductwork.uri — the ADDRESS: parse a duct uri, and reach the host it names
#
# 🔴 .a PART of ductwork.sh — sourced, never executed, and only BY ductwork.sh.
#     a caller sources ductwork.sh, which loads every part. see
#     __duct_load_parts there for why the lib is cut into parts at all.
#
# .holds = __duct_parse_uri, __duct_parse_uri_scope, and the remote reach
#          probes — __duct_is_remote, __duct_probe_remote_session,
#          __duct_read_outcome, __duct_say_unreachable
######################################################################

######################################################################
# .what = parse a duct URI into its host and session
#
#         duct://grove-1/main/mechanic  -> host=grove-1  session=main/mechanic
#         duct:///worktree/mechanic     -> host=""       session=worktree/mechanic
#
# .why  = the URI is the ONE format. there was a second — a scp-shaped slug
#         (`grove-1:main/mechanic`) taken by `--on`, while the URI was printed
#         back. so a human read `duct://grove-1/main/mechanic` and could not
#         paste it into the flag that produced it; they had to re-shape it by
#         hand, from memory, every time. that is recall where recognition
#         belongs, and it is two spellings of one address —
#         `rule.require.ubiqlang`, failed on our own contract.
#
#         the slug shape was never earned. it looked inevitable because `host:x`
#         is the scp/rsync convention, but `--on` is not scp: it addresses a
#         DUCT, an object this repo declares, so it owes ssh no syntax.
#
# .the empty authority = this machine
#         `duct:///x` is the `file:///x` convention exactly: an empty authority
#         means local. that is what makes ONE format sufficient — the triple
#         slash disambiguates, so a URI round-trips with no second spelling.
#         (an earlier note here claimed a round-trip was ambiguous. it was
#         wrong: it had collapsed the empty authority instead of keeping it.)
#
# .why it failsloud
#         a bare `worktree/mechanic` is now an ERROR, not a local duct. to
#         accept it "for convenience" would restore the second format under
#         another name, and worse: `duct://grove-1/x` mistyped as
#         `grove-1/duct://x` would silently address a local duct named
#         `grove-1` — a send to the wrong machine that reports success.
######################################################################
__duct_parse_uri() {
  local uri="$1"

  if [[ "$uri" != duct://* ]]; then
    echo "✋ duct: --on takes a duct URI, got '$uri'" >&2
    echo "   ├─ remote: duct://<grove>/<tree>/<role>   e.g. duct://grove-1/main/mechanic" >&2
    echo "   ├─ local:  duct:///<tree>/<role>          e.g. duct:///worktree/mechanic" >&2
    echo "   └─ note:   local takes THREE slashes — an empty host means this machine" >&2
    return 2
  fi

  local rest="${uri#duct://}"

  if [[ "$rest" == /* ]]; then
    # empty authority -> this machine
    DUCT_HOST=""
    DUCT_SESSION="${rest#/}"
  else
    DUCT_HOST="${rest%%/*}"
    DUCT_SESSION="${rest#*/}"
  fi

  # a host with no path names no duct. caught here rather than left to tmux,
  # which would report `session 'grove-1' not found` and send a reader hunting
  # a session that was never named (rule.require.errors-name-the-fix)
  if [[ -z "$DUCT_SESSION" || "$rest" != */* ]]; then
    echo "✋ duct: '$uri' names a host but no duct" >&2
    echo "   └─ fix: add the session — duct://${DUCT_HOST}/main/mechanic" >&2
    return 2
  fi

  # ── the two name forms, and why a duct needs both ──────────────────
  #
  # DUCT_NAME    = the duct's own name, as the URI spells it (dots kept).
  #                the registry key, and the word every layer above says.
  # DUCT_SESSION = the tmux session name (dots -> underscores).
  #                what the substrate will actually call it.
  #
  # .why they must differ: tmux REWRITES a session name on create — a `.`
  #      becomes `_`, silently, with no warning. but `has-session -t` does
  #      NOT rewrite its target; it matches the stored name literally. so
  #      the two tmux verbs disagree about one string:
  #
  #        has-session -t 'a.b/mechanic'   ->  absent   (stored as a_b)
  #        new-session -s 'a.b/mechanic'   ->  DUPLICATE
  #
  #      which made duct.open a findsert for dotless names and a hard
  #      failure for dotted ones. every crew tree is `repo.beav.slug`, so
  #      the findsert failed for exactly the names we use, and `crew.boot`
  #      inherited it (rule.require.idempotent-operations).
  #
  #      measured 2026-08-25, single-variable, same instrument:
  #        duct:///zzprobe.dot/mechanic     2nd open -> duplicate, rc=1
  #        duct:///zzprobe-nodot/mechanic   2nd open -> found,     rc=0
  #
  # .why the REGISTRY keeps the dotted form: it is the duct's name, not
  #      tmux's. the tree dir, the crew ledger, and every `--on` a human
  #      types all spell it with dots; a registry keyed on tmux's rewrite
  #      would key on the substrate's opinion of our address. worse, the
  #      two spellings already coexist in `~/.ductwork/ducts/` — one crew,
  #      two rows, which is the `duplicate` phantom term=duct names.
  #
  # .note = convert HERE, at the parse, and every tmux call site below is
  #         correct with no edit. the alternative — a cast at each of the
  #         ~25 call sites — is the one the next reader forgets once.
  DUCT_NAME="$DUCT_SESSION"
  DUCT_SESSION="${DUCT_SESSION//./_}"
}

######################################################################
# .what = read a duct URI as a SCOPE — name as much of the address as you know
#
#         duct://grove-1                -> host=grove-1  scope=""             (the grove)
#         duct://grove-1/main           -> host=grove-1  scope=main           (one tree)
#         duct://grove-1/main/mechanic  -> host=grove-1  scope=main/mechanic  (one duct)
#         duct:///                      -> host=""       scope=""             (this machine)
#
# .why  = an address that names LESS is not an error, it is a WIDER address —
#         exactly how a path already works, where a directory names its
#         contents. so `duct://grove-1` says "this grove" with no ceremony.
#
#         an earlier draft demanded a trailing `/*` (`duct://grove-1/*`). that
#         star earned its keep nowhere: there is no second thing
#         `duct://grove-1` could have meant, so the star was a token the human
#         had to remember AND quote against their own shell's globber. a scope
#         is a plain prefix, so it needs no wildcard semantics to explain, and
#         it has none.
#
# .note a trailing `/` or `/*` is accepted and means the same scope. a human
#       who types one out of habit is right, not wrong (rule.forbid.surprises)
#
# .why NOT the parser the acting verbs use: leniency here must never leak into
#       them. `duct.stop --on duct://grove-1` must stay an ERROR — under scope
#       rules it would read as "the whole grove", and a typo that drops a
#       session would kill every duct on the box. so the strict parser above
#       stands, and only `list` — which merely reports — reads a scope
######################################################################
__duct_parse_uri_scope() {
  local uri="$1"

  if [[ "$uri" != duct://* ]]; then
    echo "✋ duct: --on takes a duct URI, got '$uri'" >&2
    echo "   ├─ a grove:  duct://<grove>              e.g. duct://grove-1" >&2
    echo "   ├─ a tree:   duct://<grove>/<tree>       e.g. duct://grove-1/main" >&2
    echo "   └─ here:     duct:///                    (empty host = this machine)" >&2
    return 2
  fi

  local rest="${uri#duct://}"

  if [[ "$rest" == /* ]]; then
    DUCT_HOST=""
    DUCT_SCOPE="${rest#/}"
  else
    DUCT_HOST="${rest%%/*}"
    if [[ "$rest" == */* ]]; then DUCT_SCOPE="${rest#*/}"; else DUCT_SCOPE=""; fi
  fi

  ####################################################################
  # a `*` is DECORATION here, never a glob — and that must be said out
  # loud rather than absorbed.
  #
  # .why = `--on` is a whole-SEGMENT scope. the match is `name == want`
  #        or `name == want/*`, so `main` covers `main/mechanic` and
  #        never `mainline/x`. that boundary is deliberate.
  #
  #        but the final `*` below is stripped as a courtesy, which
  #        turns a PARTIAL-segment pattern into a silent narrow:
  #
  #          --on 'duct:///proj_beav_fix-ssh-key*'
  #            -> scope 'proj_beav_fix-ssh-key'
  #            -> needs 'proj_beav_fix-ssh-key/' to follow
  #            -> the real duct is 'proj_beav_fix-ssh-key-authorized/foreman'
  #            -> `(none)`
  #
  #        that answer is byte-identical to "this machine holds no such
  #        duct", so a caller banks an absence that was really a
  #        malformed filter. a filtered read that cannot tell those two
  #        apart is a `false report` — see term=false-report, which
  #        already carries this exact row for `duct.list --on`.
  #
  # .the rule = a `*` is allowed only as a WHOLE segment: a bare `*`, or
  #             one that follows a `/`. all else fail-fasts.
  ####################################################################
  local scope_raw="$DUCT_SCOPE"

  DUCT_SCOPE="${DUCT_SCOPE%\*}"
  DUCT_SCOPE="${DUCT_SCOPE%/}"

  if [[ "$DUCT_SCOPE" == *'*'* || "$scope_raw" == *[!/]'*' ]]; then
    echo "✋ duct: --on is a whole-segment SCOPE, not a glob — got '$uri'" >&2
    echo "   ├─ a '*' is allowed only as a whole segment: 'duct:///' or 'duct:///<tree>/*'" >&2
    echo "   ├─ a partial one ('<tre>*') matches naught, and would report '(none)'" >&2
    echo "   │  — indistinguishable from a machine that truly holds no such duct" >&2
    echo "   └─ fix: name the whole segment, or drop the filter —" >&2
    echo "        duct.list --on 'duct://${DUCT_HOST}/<full-tree-name>'" >&2
    echo "        duct.list                       # then read the list yourself" >&2
    return 2
  fi
}

__duct_is_remote() {
  [[ -n "$DUCT_HOST" ]]
}

######################################################################
# .what = probe a remote duct, and CLASSIFY the outcome into its two causes
#
# .why  = `ssh <host> "tmux has-session"` fails for two very different reasons,
#         and every call site here used to collapse them into one message:
#           - ssh could not connect      → the grove is down or asleep
#           - ssh ran, the session is absent → the duct was never opened
#
#         a grove mid-hibernate therefore answered `session 'grove-1:main/mechanic' not
#         found`, which sends a reader to hunt a lost tmux session while the
#         real fix is `grove.wake`. four sites carried that same defect, so the
#         classification lives here once rather than four times over
#         (rule.require.errors-name-the-fix, rule.require.solve-at-cause).
#
# .note = ssh exits 255 for its OWN failures (refused, closed, auth) and
#         otherwise passes the remote command's exit code through. that is what
#         makes the two causes separable at all.
#
# exit:
#   0   = reachable, and the session is present
#   1   = reachable, but the session is absent
#   255 = unreachable — ssh itself never got there
######################################################################
__duct_probe_remote_session() {
  # RETAIN ssh's stderr rather than discard it. a bare `2>/dev/null` here was a
  # failhide: it threw away the one piece of evidence that says WHICH failure
  # this is, and the caller then had to guess. ssh exits 255 for refused, timed
  # out, unknown host, bad key, AND host-key mismatch alike — so the exit code
  # alone cannot tell them apart, but ssh's own words can
  # (rule.forbid.failhide, rule.require.failloud)
  # ⚠️ the `|| code=$?` is LOAD-BEARING, and its absence made every branch
  # below unreachable at the one moment they matter.
  #
  # .why = every skill wrapper here runs `set -euo pipefail`. under `set -e` a
  #        bare `VAR=$(cmd)` is a simple command, so a `cmd` that fails KILLS
  #        THE SHELL at this line, and ssh's own 255 leaves as the process
  #        exit. the three-line classification below, and every
  #        `__duct_say_unreachable` call site, were then dead code: the caller
  #        saw exit 255 and not one word of the diagnosis this function exists
  #        to produce.
  #
  #        the harness compounded it. rhachet renders exit 2 as `✋ blocked by
  #        constraints` AND forwards our stderr; 255 is outside the {0,1,2}
  #        set (rule.require.exit-code-semantics), so it renders the generic
  #        `💥 failed with an error` and the words never reach the reader.
  #
  #        measured 2026-09-02 against a real grove: `rhx duct.read --on
  #        duct://<grove>/main/mechanic` printed EXACTLY `💥 failed with an
  #        error`, exit 255. a local absent duct printed its full three-line
  #        fix at exit 2 — same file, same stderr, opposite legibility, and
  #        the only difference is which line the shell died on.
  #
  # .note = `|| true` does NOT serve: it clobbers `$?` to 0, so the probe
  #         would report every unreachable grove as reachable. the code must
  #         be captured in the same clause that suppresses the exit.
  local code=0
  DUCT_PROBE_STDERR=$(ssh -n -o ConnectTimeout=8 "$DUCT_HOST" "$(__duct_tmux_cmd)has-session -t '$DUCT_SESSION'" 2>&1 1>/dev/null) || code=$?
  [[ $code -eq 255 ]] && return 255
  [[ $code -ne 0 ]] && return 1
  return 0
}

# .what = part a read that FAILED into its two causes, from the read's own words
#   in:  $1 = the read's exit code   $2 = all it printed (stdout+stderr)
#   out: `absent`     — the session does not exist. a POSITIVE fact
#        `unread`     — the read did not answer. the state is genuinely unknown
#        `read`       — rc 0; the pane is in hand and the box ladder should run
#
# 🔴 .why the two cannot share a row — they take OPPOSITE cures
#   `unread` prescribes *"re-read the duct"*, and for an absent session that
#   is a command that can never succeed. the seat is RESIDUE: the registry
#   holds a row and no box exists behind it, so its cure is a sweep
#   (`git.crew.fell`) or a boot — never another read.
#
#   this file already makes the identical argument one case over, for `unread`
#   against `unknown`: *"they take OPPOSITE cures, so one row cannot serve
#   both."* the same sentence applies here and the row was never split.
#
# 🔴 .the exit code alone CANNOT part them, and that is the trap
#   `duct.read` returns 2 for BOTH — an absent session and an unreachable
#   grove are each a constraint under `rule.require.exit-code-semantics`. so a
#   cure that keyed on rc would grade an asleep grove's every seat `absent` and
#   invite a fell over live work. the discriminator must be the WORDS.
#
# ✅ .the discriminator is exact, and it is the tool's own sentence
#   both absent arms (local and ssh-reached) print `tmux holds no session by
#   that name`. the unreachable arm prints no such line — it says outright
#   `the session state is UNKNOWN — absent and present are both possible`,
#   which IS the honest `unread`. so the two are parted by a phrase each emits
#   on purpose, never by a guess.
#
# .measured 2026-09-17 — rhachet-roles-bhrain.beav.feat-prescribed-brain-per-stone
#   the poll reported `reviewer:❔unread` and a `❔unread × 1` tally whose guide
#   is "re-read the duct". the re-read failed: the seat is a dead local row for
#   the legacy bare `reviewer`, with no tmux session behind it. one wasted round
#   trip, prescribed by the tool, for a fact the tool already held in hand.
__duct_read_outcome() {
  local rc="${1:-0}" said="${2:-}"
  [[ "$rc" -eq 0 ]] && { printf 'read\n'; return 0; }
  case "$said" in
    *"tmux holds no session by that name"*) printf 'absent\n' ;;
    *) printf 'unread\n' ;;
  esac
}

# .what = one voice for "ssh never got there", carrying ssh's OWN words as the
#         evidence, plus the fix for each cause it could be
#
# .why  = the first draft of this asserted "the grove may be asleep" and named
#         `grove.wake`. that is a GUESS: only refused/timed-out means asleep. an
#         unknown host, a wrong key, or a host-key mismatch all exit 255 too,
#         and `grove.wake` fixes none of them. a confident wrong fix is the same
#         defect this whole split set out to repair, just one layer smaller — so
#         quote ssh, then offer the fix per cause rather than assert one
__duct_say_unreachable() {
  local op="$1"
  local said="${DUCT_PROBE_STDERR:-}"

  ####################################################################
  # DIAGNOSE — match ssh's own words to ONE cause and name ONE fix.
  #
  # the prior draft printed all four causes and let the human do the match.
  # that is a lookup table, not a diagnosis: we already hold the evidence, so
  # to hand back a menu is to make the reader redo work we could have done.
  # a menu also dilutes the right answer with three wrong ones.
  #
  # the fallback branch says "unmatched" outright rather than guess at the
  # nearest case — an unrecognized error must not be dressed as a known one
  # (rule.forbid.failhide)
  #
  # .exemption = the case patterns below quote OPENSSH's literal error text,
  #   including the word `resolve` that `rule.forbid.term=resolve` forbids.
  #   trigger: these are MATCHERS against another program's output, not our
  #   prose — reword one and the diagnosis silently stops matching, which is a
  #   worse defect than the word. openssh owns this vocabulary; we only read it.
  #   the same allowance the aws api's enum names already hold in this repo.
  ####################################################################
  local cause fix
  case "$said" in
    *"Connection refused"*|*"Connection timed out"*|*"Connection closed"*|*"No route to host"*|*"Operation timed out"*)
      cause="the grove is down, asleep, or its tunnel is dead"
      fix="rhx git.grove.wake <grove>" ;;
    *"REMOTE HOST IDENTIFICATION HAS CHANGED"*|*"Host key verification failed"*)
      cause="the endpoint answers with an identity we do not trust"
      fix="rhx git.grove.trust.gen --grove <grove>" ;;
    *"Permission denied"*)
      cause="the endpoint refused our key"
      fix="ssh -v '$DUCT_HOST'   # check the alias' IdentityFile" ;;
    *"Could not resolve hostname"*|*"Name or service not known"*|*"nodename nor servname"*)
      cause="'$DUCT_HOST' is not a host this machine knows"
      fix="rhx git.grove.wake <grove>   # writes the ssh alias" ;;
    *)
      cause="unmatched — ssh's words in the bucket are the only evidence"
      fix="ssh -v '$DUCT_HOST'   # verbose, to see where it stops" ;;
  esac

  # treestruct, with ssh's raw words held in a bucket. the bucket earns its
  # keep: the forwarded text is ANOTHER program's output, and a fenced region
  # says so — a reader never mistakes ssh's words for ours, and a multi-line
  # error keeps its shape instead of a smear into our prose
  # (rule.require.treestruct-output)
  echo "✋ duct.$op: cannot reach '$DUCT_HOST'" >&2
  echo "   ├─ what:  ssh itself failed, so the duct was never asked" >&2
  if [[ -n "$said" ]]; then
    echo "   ├─ ssh said" >&2
    echo "   │  ├─" >&2
    echo "   │  │" >&2
    echo "$said" | sed 's/^/   │  │  /' >&2
    echo "   │  │" >&2
    echo "   │  └─" >&2
  fi
  echo "   ├─ cause: $cause" >&2
  echo "   ├─ fix:   $fix" >&2
  echo "   └─ note:  the session state is UNKNOWN — absent and present are both possible" >&2
}
