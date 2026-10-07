#!/usr/bin/env bash
######################################################################
# .what = run a command on a grove, or put a file onto one
#
# .why  = a duct addresses one KEYBOARD; some acts want the BOX. a wish file
#         that a behavior boot will `cat` has to exist on the grove before the
#         boot runs, and a keystroke channel cannot carry a multi-line document
#         (tmux send-keys would land each newline as a submit).
#
#         `git.grove.wake` has advertised this skill in its closing hint since
#         it shipped — "reach it with: rhx git.grove.send <grove> --what
#         '<cmd>'" — while no such skill existed. that hint is a fix a caller
#         cannot run, which is worse than no hint at all
#         (rule.require.errors-name-the-fix). this file makes the promise true.
#
# usage:
#   rhx git.grove.send <grove> --what 'ls -la ~/git'        # run a command
#   cat local.md | rhx git.grove.send <grove> --what 'cat > ~/x.md'
#   rhx git.grove.send <grove> --file ./wish.md --into '~/wish.md'
#
# args:
#   <grove>   the grove's registered name (see: rhx git.grove.list)
#   --what    a command to run there
#   --file    a LOCAL file to put onto the grove   (with --into)
#   --into    the REMOTE path to write it to       (with --file)
#
# .why --file/--into rather than a `cat > path` the caller writes by hand
#      a file's CONTENT is data and a remote path is a command. to hand a
#      caller one channel for both invites them to interpolate content into a
#      shell string, and a document that holds a backtick or a `$(` then
#      executes on the grove. --file keeps the two apart by construction: the
#      content rides stdin and is never parsed, and only the DESTINATION is
#      shell-quoted, by this skill rather than by its caller.
#
# guarantee:
#   - the grove must be registered AND reachable; neither is presumed
#   - --file verifies the byte count landed, and fails loud when it did not
#   - exit 0 = ran, exit 1 = malfunction, exit 2 = constraint
######################################################################
set -euo pipefail

GROVE=""
WHAT=""
FILE=""
INTO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --what) WHAT="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    --into) INTO="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    --) shift; [[ -z "$GROVE" ]] && { GROVE="${1:-}"; shift 2>/dev/null || true; } ;;
    -h|--help)
      echo "🌳 git.grove.send — run a command on a grove, or put a file onto one"
      echo ""
      echo "  usage:"
      echo "    rhx git.grove.send <grove> --what 'ls -la ~/git'"
      echo "    cat local.md | rhx git.grove.send <grove> --what 'cat > ~/x.md'"
      echo "    rhx git.grove.send <grove> --file ./wish.md --into '~/wish.md'"
      echo ""
      echo "  list groves: rhx git.grove.list"
      exit 0 ;;

    # ⚠️ FAIL LOUD — never `shift` an unknown flag away (rule.forbid.failhide).
    -*) echo "✋ git.grove.send: unknown flag '$1'" >&2
        echo "   known: --what --file --into --help" >&2
        exit 2 ;;
    *) [[ -z "$GROVE" ]] && GROVE="$1"; shift ;;
  esac
done

if [[ -z "$GROVE" ]]; then
  echo "✋ usage: rhx git.grove.send <grove> --what '<cmd>'" >&2
  echo "   list them: rhx git.grove.list" >&2
  exit 2
fi

# .why both-or-neither, checked before anything runs: a --file with no --into
#      has no destination, and an --into with no --file has no content. either
#      alone would otherwise fall through to the --what arm and run a command
#      the caller never wrote.
if [[ -n "$FILE" || -n "$INTO" ]]; then
  if [[ -z "$FILE" || -z "$INTO" ]]; then
    echo "✋ --file and --into come as a pair" >&2
    echo "   rhx git.grove.send $GROVE --file ./wish.md --into '~/wish.md'" >&2
    exit 2
  fi
  if [[ -n "$WHAT" ]]; then
    echo "✋ --what and --file are two different acts; pick one" >&2
    exit 2
  fi
fi

if [[ -z "$WHAT" && -z "$FILE" ]]; then
  echo "✋ no act named — pass --what '<cmd>' or --file <path> --into <path>" >&2
  exit 2
fi

# the grove must be REGISTERED — the ssh alias is written by a wake, so a name
# absent from the forest has no alias and ssh would fall through to dns
REGISTRY="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves/$GROVE.json"
if [[ ! -f "$REGISTRY" ]]; then
  echo "🐢 bummer dude — grove '$GROVE' is not registered" >&2
  echo "" >&2
  echo "  fix: see what is —" >&2
  echo "    rhx git.grove.list" >&2
  exit 2
fi
SSH_ALIAS=$(jq -r '.sshAlias // .name' "$REGISTRY")

######################################################################
# the file arm
######################################################################
if [[ -n "$FILE" ]]; then
  if [[ ! -f "$FILE" ]]; then
    echo "✋ no such file: $FILE" >&2
    exit 2
  fi

  bytes_want=$(wc -c < "$FILE" | tr -d ' ')

  # ⚠️ a `~` at the front must sit OUTSIDE the quotes, or the grove takes it as
  #    a filename character.
  #
  # .why this cost a live failure, 2026-09-02. the remote command quoted the
  #      whole path — `cat > '~/x.md'` — and a shell expands `~` only when it is
  #      UNQUOTED. so the grove made a directory literally named `~` and wrote
  #      the file inside it. `cat ~/x.md` from a login shell then found nought,
  #      because THAT `~` expanded to /home/camper as it should.
  #
  # .why the verify did not catch it: the byte check quoted the path the SAME
  #      way, so it read back the same literal `~/x.md` and found 4540 bytes.
  #      two instruments, one derivation — they concurred, and both were wrong
  #      (term=false-report, the derived-pair trap). a check that shares its
  #      subject's defect is not a second opinion.
  #
  # .how the split, rather than an expansion HERE: `$HOME` on this laptop is
  #      /home/bert and the grove's is /home/camper, so a local expansion would
  #      be a local answer to a remote question — the exact defect
  #      __crew_tree_dir_on_grove exists to end. the tilde is left for the
  #      GROVE's shell, and only the remainder is quoted.
  if [[ "$INTO" == "~/"* ]]; then
    INTO_Q="~/'${INTO#\~/}'"
  else
    INTO_Q="'$INTO'"
  fi

  echo "🌳 git.grove.send $GROVE --file $FILE --into $INTO"
  echo "   ├─ bytes: $bytes_want"

  # .why the destination is single-quoted HERE, and the content never is
  #      `$INTO` is a path the caller chose, so it is quoted into the remote
  #      command exactly once, by this line. the CONTENT goes over stdin and is
  #      never seen by any shell — so a wish that holds a backtick is a wish,
  #      not a command (see the --file note in the header).
  #
  # .why `mkdir -p` on the parent: a boot that writes a wish into a tree wants
  #      the tree's dir to exist; without this the caller learns that only from
  #      a redirect failure, which names the shell and not the fix.
  #
  # ⚠️ NO `-n` on this ssh, and that is the whole point of the arm — the file's
  #    bytes ARE this ssh's stdin. every other ssh in this repo carries -n
  #    because an inherited stdin is a defect there; here it is the payload.
  #    marked for the clamp in work.surface [case21].
  # stdin: forwarded on purpose
  if ! ssh "$SSH_ALIAS" "mkdir -p \"\$(dirname $INTO_Q)\" && cat > $INTO_Q" < "$FILE"; then
    echo "   └─ 💥 the write failed" >&2
    echo "      check the grove is awake: rhx git.grove.wake $GROVE" >&2
    exit 1
  fi

  # .why verify rather than trust the exit code: a truncated write over a
  #      half-open tunnel closes clean, so `cat` exits 0 over fewer bytes than
  #      it was handed. the exit code reports the CHANNEL; the byte count
  #      reports the FILE (rule.require.verify-after-send).
  bytes_got=$(ssh -n "$SSH_ALIAS" "wc -c < $INTO_Q 2>/dev/null | tr -d ' '" || echo "")
  if [[ "$bytes_got" != "$bytes_want" ]]; then
    echo "   └─ 💥 landed $bytes_got bytes, sent $bytes_want" >&2
    echo "      the write reported success and the file is short — do not use it" >&2
    exit 1
  fi

  echo "   └─ ✔ landed, $bytes_got bytes verified at $INTO"
  exit 0
fi

######################################################################
# the command arm
######################################################################
echo "🌳 git.grove.send $GROVE --what '$WHAT'"
echo ""

# .why NO `-n` here either: a caller may pipe into the remote command, which is
#      the shape wake's hint has always implied (`cat x | ... --what 'cat > y'`).
#      with no pipe the tty is stdin and ssh forwards none of it — so the
#      absent-pipe case costs the caller no surprise.
# stdin: forwarded on purpose
ssh "$SSH_ALIAS" "$WHAT"
