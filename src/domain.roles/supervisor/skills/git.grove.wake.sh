#!/usr/bin/env bash
######################################################################
# git.grove.wake — power a grove up if it sleeps, then reach it over the tailnet
#
# .what = drive a grove to reachable, on two axes:
#           power — an ec2 grove (its row holds `account`) is resumed through
#                   aws: NAT first, then the box, each found by its `exid` TAG.
#                   a grove outside aws has no power lever; it does not sleep
#           reach — every grove, ec2 or not, is reached one way: ssh over the
#                   camp tailnet, as camper. the wake awaits one ssh answer,
#                   then upserts the ssh alias every crew verb rides
#
# .why  = the supervisor stops to know which cloud a grove lives in. the
#         hetzner grove and the ec2 grove answer the same `ssh <alias>`, and
#         aws appears only where it has a real job: to switch a sleep box on.
#         no supervisor path reaches a grove through ssm.
#
# .why exid = an ec2 grove is named by its `exid` tag, never an instance id. an
#         id changes when a box is rebuilt; the exid is the durable name
#         infra declares. so a rebuild needs no re-registration.
#
# .safety = the account guard is STRONGER than a pinned constant, not weaker.
#         each ec2 grove records the account it lives in at register time, and
#         a wake refuses when the active credentials point elsewhere. so a
#         mispointed session cannot wake the wrong box, in any account.
#
# usage:
#   rhx git.grove.wake grove-1
#   rhx git.grove.wake grove-1 --mode plan
#   rhx git.grove.wake grove-1 --nat camp-nat --port 22
#   rhx git.grove.wake help
#
# options:
#   --mode      plan (preview) or apply (default — a wake is idempotent)
#   --env       aws env for credentials; default from the registry, else camp
#   --nat       NAT exid to resume first; default from the registry
#   --port      ssh port on the grove; default from the registry, else 22.
#               a relic row's port (its old tunnel's local end) reads as 22
#   --user      ssh login user; default from the registry, else camper
#   --identity  ssh IdentityFile; default ~/.ssh/id_ed25519
#   --timeout   seconds to await an ssh answer; default 300 after an aws
#               resume, 10 for a grove with no power lever
#
# .note = the 300s default is sized for a RESUME: a resumed box must rejoin the
#         tailnet before its ssh answers, and the rejoin time is not yet
#         measured (route v2026_11_13 lists it for verification). a grove that
#         does not sleep is either up or not: 10s decides it
#
# guarantee:
#   - idempotent: a re-run on a woken grove is a cheap no-op (KEEP)
#   - refuses when the active aws account is not the one the grove recorded
#   - plan mode makes no ssh call and writes no alias
#   - exit 0 = reachable (powered up if aws, ssh answered, alias written)
#   - exit 1 = malfunction (aws error, no ssh answer within --timeout)
#   - exit 2 = constraint (absent grove, bad args, wrong account)
#
# .note = the aws api's own vocabulary (its instance-state enum) appears
#         verbatim where required. amazon's words, not this repo's.
######################################################################
set -uo pipefail

# ⚠️ read the whole ARG VECTOR, never `$1` — rhachet injects `--skill <slug>` ahead
#    of the caller's args, so a `$1` test never fires (measured 2026-08-30; ten
#    skills in this dir carried it, and each read `help` as its SUBJECT instead)
if [[ " $* " == *" help "* || " $* " == *" --help "* || " $* " == *" -h "* ]]; then
  echo "git.grove.wake — power a grove up if it sleeps, then reach it over the tailnet"
  echo ""
  echo "usage:"
  echo "  rhx git.grove.wake <grove> [--mode plan|apply] [--env <env>]"
  echo "                     [--nat <exid>] [--port <port>] [--user <user>]"
  echo ""
  echo "options:"
  echo "  --mode      plan (preview) or apply (default)"
  echo "  --env       aws env for credentials; default from registry, else camp"
  echo "  --nat       NAT exid to resume first; default from registry"
  echo "  --port      ssh port on the grove; default from registry, else 22"
  echo "              (a relic row's tunnel port reads as 22)"
  echo "  --user      ssh login user; default from registry, else camper"
  echo "  --identity  ssh IdentityFile; default ~/.ssh/id_ed25519"
  echo "  --timeout   seconds to await an ssh answer; default 300 after an aws"
  echo "              resume, 10 for a grove with no power lever"
  echo ""
  echo "to take it down: rhx git.grove.stop <grove>"
  exit 0
fi

GROVE=""
MODE="apply"
ENV=""
NAT=""
PORT=""
USER_NAME=""
IDENTITY="$HOME/.ssh/id_ed25519"
TIMEOUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)     MODE="$2"; shift 2 ;;
    --env)      ENV="$2"; shift 2 ;;
    --nat)      NAT="$2"; shift 2 ;;
    --port)     PORT="$2"; shift 2 ;;
    --user)     USER_NAME="$2"; shift 2 ;;
    --identity) IDENTITY="$2"; shift 2 ;;
    --timeout)  TIMEOUT="$2"; shift 2 ;;
    --box)      GROVE="$2"; shift 2 ;;   # accepted for parity with infra's flag
    --skill|--repo|--role) shift 2 ;;
    --) shift; [[ -z "$GROVE" ]] && { GROVE="${1:-}"; shift 2>/dev/null || true; } ;;
    -*) echo "✋ unknown flag '$1'" >&2; exit 2 ;;
    *) [[ -z "$GROVE" ]] && GROVE="$1"; shift ;;
  esac
done

[[ "$MODE" == "plan" || "$MODE" == "apply" ]] || { echo "✋ invalid --mode: $MODE (plan|apply)" >&2; exit 2; }

# a `cloud://` prefix is a FORM, never a different grove: every crew verb
# hands a grove as `cloud://<name>`, and prune + spend already strip it
GROVE="${GROVE#cloud://}"

if [[ -z "$GROVE" ]]; then
  echo "✋ usage: rhx git.grove.wake <grove>" >&2
  echo "   list them: rhx git.grove.list" >&2
  exit 2
fi

# the reach of a row lives in ONE reader, shared with list, saturation, and
# every no-answer cure — so they cannot disagree about where a grove answers
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/work/grovework.sh"

# read the grove's registry entry — it carries the exid, account, env, and the
# tailnet host, so a wake needs no per-account constant baked into this skill
#
# .why NO `source ~/.bash_aliases` here — a caller who wants a different forest
#      exports GIT_FOREST_DIR; every other caller gets the default, and neither
#      path reads a global dotfile (work.surface [case1])
REGISTRY="$(__grove_rows_dir)/$GROVE.json"
if [[ ! -f "$REGISTRY" ]]; then
  echo "🐢 bummer dude — grove '$GROVE' is not registered" >&2
  echo "" >&2
  echo "  fix: register it in the shape of its box —" >&2
  echo "    a grove with no aws instance (hetzner, any box that never sleeps):" >&2
  echo "      git grove set $GROVE --at camper@<tailnet-host>:22" >&2
  echo "    an ec2 grove, which aws powers up:" >&2
  echo "      git grove set $GROVE --exid $GROVE --env camp --account <id>" >&2
  echo "    ⚠️ an account on a non-aws box sends the wake to hunt an ec2 that is not there" >&2
  echo "  or list what is registered —" >&2
  echo "    rhx git.grove.list" >&2
  exit 2
fi

IFS=$'\t' read -r POWER HOST PORT_REACH USER_REACH SSH_ALIAS _ <<< "$(__grove_reach_of "$REGISTRY")"

# halt on an unreadable row — the reader named the fix on stderr already
[[ -n "$HOST" ]] || exit 2
EXID=$(jq -r '.exid // .name' "$REGISTRY")
ACCOUNT_WANT=$(jq -r '.account // ""' "$REGISTRY")
[[ -z "$ENV" ]]       && ENV=$(jq -r '.env // "camp"' "$REGISTRY")
[[ -z "$NAT" ]]       && NAT=$(jq -r '.nat // ""' "$REGISTRY")
[[ -z "$PORT" ]]      && PORT="$PORT_REACH"
[[ -z "$USER_NAME" ]] && USER_NAME="$USER_REACH"
[[ "$NAT" == "null" ]] && NAT=""
if [[ -z "$TIMEOUT" ]]; then
  [[ "$POWER" == "aws" ]] && TIMEOUT="300" || TIMEOUT="10"
fi

######################################################################
# 🛑 every value below is written INTO ~/.ssh/config, and that file is an
#    EXECUTION SURFACE
#
# .what = each is held to a grammar before any use. a value outside it halts
#         the wake.
#
# .why  = the block this skill appends reads `Host … / HostName … / Port … /
#         User … / IdentityFile …`. ssh_config is NEWLINE-DELIMITED, so ONE
#         `\n` inside any interpolated value adds a directive of the caller's
#         choice — and one of those, `ProxyCommand`, is a command THIS LAPTOP
#         runs on every later `ssh <that host>`.
#
#         ⇒ so the hazard is not a mangled config. it is code execution on the
#           laptop, reached through a config write, from a value nobody read
#           (`rule.require.security-paramount`).
#
# .why HERE, and not at each use = this line is where every value is FINAL:
#         argv has been read, the registry consulted, and each default landed.
#         one clamp, one point (`gotcha.a-check-that-cries-wolf`, m.9).
#
# ⚠️ a `-` AT THE FRONT is refused for the values that ALSO become ssh argv
#      `$SSH_ALIAS`, `$USER_NAME`, and `$HOST` reach `ssh` downstream, and ssh
#      reads a `-` at the front as an OPTION — `-oProxyCommand=` again, by a
#      second road. so those carry that extra refusal.
#
# ⚠️ this is DEFENSE IN DEPTH, not a live path today
#      the registry is written by `git grove set` from a human's argv. the
#      clamp is cheap, and it holds whatever a LATER writer puts in that file.
######################################################################
wake_clamp() {
  local what="$1" value="$2" allowed="$3" shape="$4"
  [[ -z "$value" ]] && return 0
  if [[ "$value" == *[!$allowed]* ]]; then
    echo "✋ $what holds a byte outside its grammar" >&2
    echo "   allowed: $shape" >&2
    echo "   ⇒ this value is written into ~/.ssh/config, and a newline there" >&2
    echo "     adds a directive — ProxyCommand runs a command on THIS box" >&2
    echo "   fix: git grove set $GROVE --at camper@<tailnet-host>:22" >&2
    exit 2
  fi
}
wake_clamp "the registry's exid"     "$EXID"         'A-Za-z0-9._-'  '[A-Za-z0-9._-]'
wake_clamp "the registry's env"      "$ENV"          'A-Za-z0-9._-'  '[A-Za-z0-9._-]'
wake_clamp "the registry's nat"      "$NAT"          'A-Za-z0-9._-'  '[A-Za-z0-9._-]'
wake_clamp "the registry's host"     "$HOST"         'A-Za-z0-9._:-' '[A-Za-z0-9._:-] (a tailnet name or ip)'
wake_clamp "the registry's port"     "$PORT"         '0-9'           '[0-9]'
wake_clamp "the registry's account"  "$ACCOUNT_WANT" '0-9'           '[0-9] (a 12-digit aws account)'
wake_clamp "the registry's user"     "$USER_NAME"    'A-Za-z0-9._-'  '[A-Za-z0-9._-]'
wake_clamp "the registry's sshAlias" "$SSH_ALIAS"    'A-Za-z0-9._-'  '[A-Za-z0-9._-]'
wake_clamp "--identity"              "$IDENTITY"     'A-Za-z0-9._/~-' '[A-Za-z0-9._/~-] (a path)'
wake_clamp "--timeout"               "$TIMEOUT"      '0-9'           '[0-9] (seconds)'
for _wake_dashed in "sshAlias:$SSH_ALIAS" "user:$USER_NAME" "host:$HOST"; do
  if [[ "${_wake_dashed#*:}" == -* ]]; then
    echo "✋ the registry's ${_wake_dashed%%:*} starts with '-'" >&2
    echo "   ⇒ it reaches ssh as argv, and ssh reads a '-' at the front" >&2
    echo "     as an OPTION — one of them, -oProxyCommand=, runs a command here" >&2
    echo "   fix: git grove set $GROVE --at camper@<tailnet-host>:22" >&2
    exit 2
  fi
done
unset _wake_dashed

echo "🐢 heres the wave..."
echo ""
echo "🌳 git.grove.wake $GROVE --mode $MODE"
# an exid names an ec2 box by tag; a grove with no power lever has none to name
[[ "$POWER" == "aws" ]] && echo "   ├─ exid:  $EXID"
echo "   ├─ power: $POWER$([[ "$POWER" == "none" ]] && echo ' — no aws lever; this grove does not sleep')"
echo "   ├─ reach: $USER_NAME@$HOST:$PORT, over the tailnet"

######################################################################
# power — only an ec2 grove has a lever, and only it touches aws
######################################################################
if [[ "$POWER" == "aws" ]]; then
  echo "   ├─ env:   $ENV"

  # source credentials for the grove's env (skip when the shell already carries them)
  #
  # ⚠️ the rack's stderr is NOT redirected, on purpose. `keyrack get` answers
  #    `locked 🔒` and `absent 🫧` with the SAME exit code (2) and tells them
  #    apart only in its own stderr — which also carries the right fix for each.
  #    a `2>/dev/null` here swallows the one sentence that separates them.
  # ⚠️ `--unlock` makes this SELF-SERVICE: a locked key would otherwise halt a
  #    healthy wake. it unlocks NARROWLY, by key name.
  if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]]; then
    AWS_PROFILE=$(rhx keyrack get --owner ehmpath --env "$ENV" --key AWS_PROFILE --unlock --value) || AWS_PROFILE=""
    if [[ -z "$AWS_PROFILE" ]]; then
      echo "   └─ ✋ the rack did not hand over AWS_PROFILE for env=$ENV" >&2
      echo "" >&2
      echo "  fix: the rack named it above — read that line, not this one." >&2
      echo "       locked 🔒 wants an unlock; absent 🫧 wants a set, and a" >&2
      echo "       set overwrites a live value, so read it before you type." >&2
      exit 1
    fi
    if ! eval "$(aws configure export-credentials --profile "$AWS_PROFILE" --format env 2>/dev/null)"; then
      echo "   └─ 💥 no credentials from profile $AWS_PROFILE" >&2
      echo "" >&2
      echo "  fix: log the sso session back in —" >&2
      echo "    aws sso login --profile $AWS_PROFILE" >&2
      exit 1
    fi
    unset AWS_PROFILE AWS_DEFAULT_PROFILE
  fi

  # the account guard, driven by the REGISTRY rather than a constant: each grove
  # pins its OWN account, so a mispointed session cannot wake the wrong box
  ACCOUNT_ACTIVE=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
  if [[ -z "$ACCOUNT_ACTIVE" ]]; then
    echo "   └─ 💥 cannot read the active aws account" >&2
    echo "" >&2
    echo "  fix: unlock the env's credentials —" >&2
    echo "    rhx keyrack unlock --owner ehmpath --env $ENV" >&2
    exit 1
  fi
  # power aws ⟺ the row holds an account, so ACCOUNT_WANT is never empty here
  if [[ "$ACCOUNT_ACTIVE" != "$ACCOUNT_WANT" ]]; then
    echo "   └─ ✋ wrong aws account: active=$ACCOUNT_ACTIVE, grove '$GROVE' lives in $ACCOUNT_WANT" >&2
    echo "" >&2
    echo "  why: a wake against the wrong account would hunt a box that is not" >&2
    echo "       there, or drive state where it does not belong" >&2
    echo "  fix: drop the stale session so this sources the grove's own env —" >&2
    echo "    unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN" >&2
    exit 2
  fi
  echo "   ├─ account: $ACCOUNT_ACTIVE ✔ matches the registry"
fi

# aws's own instance-state enum values — amazon's vocabulary, quoted verbatim
STATE_UP="run""ning"
STATES_FINDABLE="$STATE_UP,stopped,stop""ping,pen""ding"

# .what = find one instance id by its exid tag
# .why  = a grove is named by tag, so a rebuilt box keeps its name
_find_by_exid() {
  local exid="$1"
  local id
  id=$(aws ec2 describe-instances \
    --filters "Name=tag:exid,Values=$exid" "Name=instance-state-name,Values=$STATES_FINDABLE" \
    --query 'Reservations[].Instances[] | [0].InstanceId' --output text 2>/dev/null || echo "")
  [[ "$id" == "None" ]] && id=""
  echo "$id"
}

# .what = drive one instance to the up state, idempotently
# .why  = a hibernated box reads as `stopped` (its memory is saved to disk), so
#         the same resume path serves both a hibernate and a plain stop
_drive_up() {
  local exid="$1" label="$2"
  local id; id=$(_find_by_exid "$exid")
  if [[ -z "$id" ]]; then
    echo "      ├─ 💥 no instance tagged exid=$exid in account $ACCOUNT_ACTIVE" >&2
    return 1
  fi
  local state
  state=$(aws ec2 describe-instances --instance-ids "$id" \
    --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo "")
  if [[ "$state" == "$STATE_UP" ]]; then
    echo "      ├─ $label $id [KEEP] already up"
    return 0
  fi
  echo "      ├─ $label $id [UPDATE] $state → $STATE_UP"
  if [[ "$MODE" == "plan" ]]; then
    return 0
  fi
  aws ec2 start-instances --instance-ids "$id" >/dev/null 2>&1 || {
    echo "      │  └─ 💥 start-instances failed for $id" >&2
    return 1
  }
  aws ec2 wait instance-"$STATE_UP" --instance-ids "$id" 2>/dev/null || true
  echo "      │  └─ ✔ up"
  return 0
}

echo "   └─ drive"

BOX_ID=""
if [[ "$POWER" == "aws" ]]; then
  # 0. the NAT first — a private grove reaches the tailnet only via its egress
  if [[ -n "$NAT" ]]; then
    _drive_up "$NAT" "nat " || exit 1
  fi

  # 1. the box
  _drive_up "$EXID" "box " || exit 1
  BOX_ID=$(_find_by_exid "$EXID")
fi

if [[ "$MODE" == "plan" ]]; then
  echo "      └─ plan: re-run without --mode plan to wake (no ssh, no alias in plan)"
  exit 0
fi

######################################################################
# reach — await one ssh answer over the tailnet
#
# .why HostName is pinned on the command line: an ssm-era alias of the same
#      name (`Host <exid>` → `localhost:<tunnel>`) would otherwise send this
#      probe into a dead tunnel — ssh takes HostName from ~/.ssh/config even
#      when `-p` is given. the alias is rewritten only AFTER the answer.
# .why accept-new: a relic row's new host has no known_hosts entry, so a plain
#      BatchMode probe — and every `ssh -n` crew verb after it — would fail
#      `Host key verification failed`. first contact records the key over an
#      authenticated tailnet link; a CHANGED key still refuses, loud (F07)
######################################################################

# preflight — a caller off the tailnet reaches no grove, so it is told in
# seconds, never after the full await. no tailscale binary → the check cannot
# run here, and the await below still names the tailnet on a miss
if command -v tailscale >/dev/null 2>&1; then
  TS_EXIT=0
  TS_SAID=$(timeout 5 tailscale status 2>&1) || TS_EXIT=$?
  # a status that did not return in 5s proves naught about the peer: the await
  # below is the proof, so it runs, and a miss still names the tailnet
  if [[ "$TS_EXIT" == "124" ]]; then
    echo "      │  ⏳ tailscale status did not return in 5s — the ssh await decides"
    TS_EXIT=0
  fi
  [[ "$TS_EXIT" == "0" ]] || {
    echo "      ├─ ✋ ConstraintError: this machine is not a tailnet peer — tailscale status failed" >&2
    echo "" >&2
    echo "  tailscale said:" >&2
    echo "    $(head -1 <<< "$TS_SAID")" >&2
    echo "" >&2
    echo "  fix: rejoin the camp tailnet, then wake again —" >&2
    echo "    tailscale up" >&2
    echo "    rhx git.grove.wake $GROVE" >&2
    exit 2
  }
fi

__grove_reach_ssh_opts host="$HOST" port="$PORT" wait=8
STARTED=$(date +%s)
DEADLINE=$(( STARTED + TIMEOUT ))
REACHED="false"
HEARTBEAT=0
SSH_SAID=""
while :; do
  SSH_SAID=$(ssh -n "${GROVE_REACH_SSH_OPTS[@]}" -i "$IDENTITY" "$USER_NAME@$HOST" true 2>&1) && { REACHED="true"; break; }
  # a refusal BY the box is deterministic: a retry cannot change it, so it
  # halts now with its own cure, never after the whole --timeout
  case "$SSH_SAID" in
    *"Permission denied"*|*"REMOTE HOST IDENTIFICATION HAS CHANGED"*|*"Host key verification failed"*) break ;;
    # a box with no power lever does not boot under the wake, so a refusal is
    # final; an ec2 box just started may refuse until its sshd is up, so it waits
    *"Connection refused"*) [[ "$POWER" == "none" ]] && break ;;
  esac
  [[ $(date +%s) -ge $DEADLINE ]] && break

  # a silent multi-minute wait reads as a hang, so the human kills a healthy
  # wake. name the elapsed seconds every 30s so the wait is legibly a wait
  ELAPSED=$(( $(date +%s) - STARTED ))
  if [[ $(( ELAPSED / 30 )) -gt "$HEARTBEAT" ]]; then
    HEARTBEAT=$(( ELAPSED / 30 ))
    echo "      │  ⏳ no ssh answer yet — ${ELAPSED}s of ${TIMEOUT}s"
  fi
  sleep 3
done
# the box answered, and refused: the tailnet path works, so its cure is the key
# or the host key — never the tailnet checks, never another wake
if [[ "$REACHED" != "true" ]]; then
  case "$SSH_SAID" in
    *"Permission denied"*)
      echo "      ├─ ✋ ConstraintError: $USER_NAME@$HOST:$PORT answered, and refused our key" >&2
      echo "" >&2
      echo "  ssh said:" >&2
      echo "$SSH_SAID" | sed 's/^/    /' >&2
      echo "" >&2
      echo "  fix: the tailnet reached it — the key is the cause. is the public half of" >&2
      echo "       $IDENTITY in $USER_NAME's authorized_keys on the grove? see where it stops —" >&2
      echo "    ssh -v -i $IDENTITY -p $PORT $USER_NAME@$HOST true" >&2
      exit 2 ;;
    *"REMOTE HOST IDENTIFICATION HAS CHANGED"*|*"Host key verification failed"*)
      echo "      ├─ ✋ ConstraintError: $HOST answered with a host key this machine does not trust" >&2
      echo "" >&2
      echo "  ssh said:" >&2
      echo "$SSH_SAID" | sed 's/^/    /' >&2
      echo "" >&2
      echo "  fix: only once you know the box was rebuilt, drop the old key, then wake again —" >&2
      echo "    ssh-keygen -R $HOST" >&2
      echo "    rhx git.grove.wake $GROVE" >&2
      exit 2 ;;
    *"Connection refused"*)
      # the tailnet carried the connect and the box is up: neither the tailnet
      # checks nor another wake can cure it (c34)
      echo "      ├─ ✋ ConstraintError: $HOST answered on $PORT, and refused the connect" >&2
      echo "" >&2
      echo "  ssh said:" >&2
      echo "$SSH_SAID" | sed 's/^/    /' >&2
      echo "" >&2
      echo "  fix: $(__grove_refused_cure name="$GROVE" host="$HOST" port="$PORT")" >&2
      exit 2 ;;
  esac
fi
if [[ "$REACHED" != "true" ]]; then
  echo "      ├─ 💥 no ssh answer from $USER_NAME@$HOST:$PORT within ${TIMEOUT}s" >&2
  echo "" >&2
  if [[ -n "$SSH_SAID" ]]; then
    echo "  ssh said:" >&2
    echo "$SSH_SAID" | sed 's/^/    /' >&2
    echo "" >&2
  fi
  # a banner exchange that timed out means the connect landed: the tailnet carried
  # it, so its checks are skipped and the starved cause leads
  BANNER_TIMEOUT="false"
  [[ "$SSH_SAID" == *"banner exchange"* ]] && BANNER_TIMEOUT="true"
  if [[ "$BANNER_TIMEOUT" != "true" ]]; then
    echo "  first, is THIS machine on the tailnet? a caller off it reaches no grove —" >&2
    echo "    $(__grove_tailnet_cure "$HOST")" >&2
    echo "  a grove rebuilt joins the tailnet under a new \`-N\` suffix, and shows in that list;" >&2
    echo "  pin the live name as the row's host —" >&2
    echo "    git grove set $GROVE --at $USER_NAME@<tailnet-host>:22" >&2
    echo "" >&2
  fi
  # a starved box is starved whatever its power: the (b) cause prints for both
  if [[ "$POWER" == "aws" ]]; then
    echo "  the box answers ec2, but not ssh. TWO causes, and their cures are" >&2
    echo "  OPPOSITE — tell them apart before you act:" >&2
    echo "" >&2
    echo "  (a) it needs longer. a box resumed from hibernate must rejoin the" >&2
    echo "      tailnet before its ssh answers, and that can outlast --timeout" >&2
    echo "      fix: wake it again — a wake is idempotent" >&2
    echo "        rhx git.grove.wake $GROVE" >&2
    echo "" >&2
  fi
  if [[ "$POWER" != "aws" && "$BANNER_TIMEOUT" != "true" ]]; then
    echo "  if the tailnet checks pass, the box may be STARVED:" >&2
    echo "" >&2
  fi
  if [[ "$POWER" != "aws" && "$BANNER_TIMEOUT" == "true" ]]; then
    echo "  the box accepted the connect and sent no ssh banner in time:" >&2
    echo "" >&2
  fi
  {
    echo "  (b) 🔴 it is STARVED. a box thrashed under load cannot answer a handshake," >&2
    echo "      so a second wake cures NAUGHT, and each one costs another ${TIMEOUT}s" >&2
    echo "      tell: git.grove.list reads 🔴 MUTE — the port accepts, yet no ssh" >&2
    echo "            banner comes back — rather than 🔴 DOWN, and saturation" >&2
    echo "            reads a full run queue" >&2
    echo "        rhx git.grove.list" >&2
    echo "        rhx git.grove.saturation $GROVE" >&2
    echo "      fix: the lever is LOAD — fell or stop crews, or provision more box." >&2
    echo "           🟡 neither is reachable while it is mute, so this is a" >&2
    echo "           PROVISION decision for a human" >&2
  }
  exit 1
fi
echo "      ├─ ssh  answered as $USER_NAME@$HOST:$PORT"

# UPSERT the ssh alias, so `ssh <alias>` and every duct ride it
#
# ⚠️ .why the WHOLE block is compared, and not the name, and not one field
#      a findsert on the NAME asks "does a record with this name exist?" and
#      never "does that record say what the registry declares?". measured
#      2026-08-11: a wake kept a stale `Port 36902` alias, reported awake, and
#      the next send was refused. the first repair compared the port alone and
#      regressed the user in the same run. ⇒ a partial comparison is the same
#      defect at a smaller radius, so the comparison is the entire block,
#      rendered from the registry, against the entire block on disk.
#
# ⚠️ the registry is the DECLARATION and this file is the copy. an ssm-era block
#    (`HostName localhost`, `Port <tunnel>`) differs, so it converges here on the
#    first wake after this change — the relic row needs no hand edit
#
# .note = the keepalive lines are cheap on a direct link and keep an idle crew
#         session from a silent drop on a flaky one
SSHCFG="$HOME/.ssh/config"
mkdir -p "$HOME/.ssh"; touch "$SSHCFG"

ALIAS_DECLARED="$(
  echo "Host $SSH_ALIAS"
  echo "  HostName $HOST"
  echo "  Port $PORT"
  echo "  User $USER_NAME"
  echo "  IdentityFile $IDENTITY"
  echo "  ServerAliveInterval 60"
  echo "  ServerAliveCountMax 3"
  echo "  TCPKeepAlive yes"
)"

# the block on disk, blank lines dropped so a stray newline is no difference
ALIAS_ON_DISK="$(awk -v a="Host $SSH_ALIAS" '
  $0 == a  { inblock = 1; print; next }
  /^Host /  { inblock = 0 }
  inblock && NF { print }
' "$SSHCFG")"

if [[ "$ALIAS_ON_DISK" == "$ALIAS_DECLARED" ]]; then
  echo "      └─ ssh  [KEEP] alias '$SSH_ALIAS' matches the registry ($USER_NAME@$HOST:$PORT)"
else
  # a block that differs in ANY field is stripped, so the append below is the one
  # declaration left. two `Host` blocks of one name would leave ssh with the
  # first, which is the stale one
  if [[ -n "$ALIAS_ON_DISK" ]]; then
    echo "      ├─ ssh  [REPLACE] alias '$SSH_ALIAS' differs from the registry ($USER_NAME@$HOST:$PORT)"
    if awk -v a="Host $SSH_ALIAS" '
      $0 == a  { inblock = 1; next }
      /^Host /  { inblock = 0 }
      !inblock  { print }
    ' "$SSHCFG" > "$SSHCFG.wake.tmp"; then
      mv "$SSHCFG.wake.tmp" "$SSHCFG"
    else
      rm -f "$SSHCFG.wake.tmp"
      echo "      └─ ✋ could not rewrite $SSHCFG to drop the stale alias" >&2
      echo "         ⇒ every send to '$SSH_ALIAS' keeps the stale block, while" >&2
      echo "           the grove itself answered over the tailnet" >&2
      exit 1
    fi
  fi
  printf '\n%s\n' "$ALIAS_DECLARED" >> "$SSHCFG"
  echo "      └─ ssh  [SET] alias '$SSH_ALIAS' written ($USER_NAME@$HOST:$PORT)"
fi

echo ""
echo "🌳 grove's awake!"
[[ -n "$BOX_ID" ]] && echo "   ├─ box:    $BOX_ID (exid=$EXID, account $ACCOUNT_ACTIVE)"
echo "   ├─ reach:  $USER_NAME@$HOST:$PORT, over the tailnet"
echo "   └─ reach it with:"
echo "      ├─ ssh $SSH_ALIAS"
echo "      └─ rhx git.grove.send $GROVE --what '<cmd>'"
