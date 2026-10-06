#!/usr/bin/env bash
######################################################################
# git.grove.keyrack — hand a grove a credential from THIS host's rack
#
# .what = read a credential value on this box and set it into a grove's
#         keyrack, so a clone there can unlock it like any other key.
#
# .why  = a grove is a FRESH machine, and a keyrack key is per-MACHINE. so a
#         clone booted on a grove reads an EMPTY rack and dies on an absent
#         key — while the value sits, unlocked, on the supervisor's laptop
#         one ssh hop away. that gap has cost this fleet whole days: five
#         crews sat at one stone with the same absent-key malfunction.
#
# ⚠️ .why this is NOT `git.grove.auth`
#
#   auth answers "who is this machine logged in as?" — a browser, a url, a
#   code, a brain. this answers "what secrets can a clone on this machine
#   read?" they share a grove and naught else: of auth's five flags, four do
#   not apply here and `--brain` must be actively REFUSED, because a keyrack
#   key is per-machine and a per-brain scope would be a fiction.
#
#   four inapplicable flags and one refused is the tell that a subject is
#   different, not that a mech is absent.
#
# usage:
#   rhx keyrack get --owner ehmpath --key FIREWORKS_API_KEY --env prep --value \
#     | rhx git.grove.keyrack set <grove> \
#         --org ehmpathy --key FIREWORKS_API_KEY --env prep --value @stdin
#
# args:
#   set        the only verb today                          [required]
#   <grove>    grove exid, `cloud://<exid>`, or `local`      [required]
#   --org      the org to set the key under                  [required]
#   --key      the key name, e.g. FIREWORKS_API_KEY          [required]
#   --env      test | prep | prod | camp                     [required]
#   --value    must be `@stdin` — a literal is REFUSED       [required]
#   --owner    keyrack owner on the grove                    [default: ehmpath]
#   --vault    storage vault                                 [default: os.secure]
#   --grant    keyrack's grant mechanism         [default: PERMANENT_VIA_REPLICA]
#
# ⚠️ .the READ half is the CALLER's, and that is not an oversight
#
#   `keyrack --org` accepts only `@this` — the org of the repo you are stood
#   in — so BOTH halves are cwd-bound. you read from a LOCAL repo of that
#   org; this skill finds a repo of that org ON THE GROVE and sets there.
#
#   a skill that tried to do both halves would have to guess which local repo
#   to read from, and a wrong guess SUCCEEDS — against the org you did not
#   mean. so the read stays where the caller can see which org it hit.
#
#   the removal of the constraint itself is caught as
#   `.dream/2026_09_03.keyrack-set-outside-an-org-repo`.
#
# guarantee:
#   - the value NEVER appears in argv. `--value @stdin` is the only accepted
#     form; a literal is refused BY NAME rather than tolerated
#   - the org repo on the grove is DISCOVERED, then its DECLARED org is
#     verified against --org before one byte is written
#   - the set is VERIFIED by a read-back, compared as a sha256 — so neither
#     side ever prints the secret, and a silent truncation cannot pass
#   - exit 0 = set and verified, exit 1 = malfunction, exit 2 = constraint
######################################################################

set -euo pipefail

verb=""
grove=""
key=""
env=""
org=""
value=""

# defaults match what the extant keys on this fleet already carry, so the
# bare invocation does the common-case work.
#
# ⚠️ `--grant` names keyrack's GRANT MECHANISM. it is spelled `--grant` here
#    rather than `--mech` because keyrack's own help calls it a "grant
#    mechanism", and `--mech` is this fleet's word for WHICH mechanism a
#    skill performs. one word, one sense.
keyrack_owner="ehmpath"
keyrack_vault="os.secure"
keyrack_grant="PERMANENT_VIA_REPLICA"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --org) org="$2"; shift 2 ;;
    --key) key="$2"; shift 2 ;;
    --env) env="$2"; shift 2 ;;
    --value) value="$2"; shift 2 ;;
    --owner) keyrack_owner="$2"; shift 2 ;;
    --vault) keyrack_vault="$2"; shift 2 ;;
    --grant) keyrack_grant="$2"; shift 2 ;;
    --skill|--repo|--role) shift 2 ;;
    --help|-h|help) awk 'NR<=2 { next } /^####/ { exit } { sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; exit 0 ;;

    # ⚠️ FAIL LOUD — never shift an unknown flag away (rule.forbid.failhide).
    #    duct.send ate `--anyway`, then `--await`, and the second left a tree
    #    sprouted with no behavior. a dropped flag here would set a key under
    #    terms the caller never asked for, and report success.
    -*)
      echo "✋ git.grove.keyrack: unknown arg '$1'" >&2
      echo "   known: --org --key --env --value --owner --vault --grant" >&2
      exit 2 ;;
    *)
      if [[ -z "$verb" ]]; then verb="$1"; shift; continue; fi
      if [[ -n "$grove" ]]; then
        echo "✋ git.grove.keyrack: more than one grove given ('$grove', '$1')" >&2
        exit 2
      fi
      grove="$1"; shift ;;
  esac
done

if [[ -z "$verb" ]]; then
  echo "✋ git.grove.keyrack: a verb is required" >&2
  echo "   known: set" >&2
  echo "   e.g. rhx keyrack get --owner ehmpath --key K --env prep --value \\" >&2
  echo "          | rhx git.grove.keyrack set grove-1 --org ehmpathy --key K --env prep --value @stdin" >&2
  exit 2
fi
if [[ "$verb" != "set" ]]; then
  echo "✋ git.grove.keyrack: unknown verb '$verb'" >&2
  echo "   known: set" >&2
  echo "   why: a READ back off a grove would print a secret onto this box's" >&2
  echo "        terminal, so there is deliberately no 'get' here." >&2
  exit 2
fi
if [[ -z "$grove" ]]; then
  echo "✋ git.grove.keyrack: a grove is required" >&2
  echo "   e.g. rhx git.grove.keyrack set grove-1 --org ehmpathy ..." >&2
  exit 2
fi
if [[ -z "$org" || -z "$key" || -z "$env" ]]; then
  echo "✋ git.grove.keyrack: --org, --key, and --env are all required" >&2
  echo "   e.g. rhx keyrack get --owner ehmpath --key FIREWORKS_API_KEY --env prep --value \\" >&2
  echo "          | rhx git.grove.keyrack set $grove \\" >&2
  echo "              --org ehmpathy --key FIREWORKS_API_KEY --env prep --value @stdin" >&2
  exit 2
fi

# ⚠️ REFUSE a literal value. @stdin is the only accepted form.
#
# .why = an argv is not private. it is world-readable on the box for the life
#        of the process (`ps aux`), it lands in the caller's shell history,
#        and it rides into any log or error that echoes the command — this
#        skill's own usage lines among them. a secret that reaches argv is a
#        secret that must be rotated.
#
#        @stdin is this repo's extant convention for exactly that
#        (git.commit.set -m @stdin, sedreplace --old @stdin), so this is a
#        reuse rather than a coinage.
if [[ -z "$value" ]]; then
  echo "✋ git.grove.keyrack: --value is required" >&2
  echo "   and it must be @stdin — pipe the value in:" >&2
  echo "     rhx keyrack get --owner ehmpath --key $key --env $env --value | rhx git.grove.keyrack set ..." >&2
  exit 2
fi
if [[ "$value" != "@stdin" ]]; then
  echo "✋ git.grove.keyrack: --value must be @stdin, never a literal" >&2
  echo "   why: an argv is world-readable on this box (ps), lands in shell" >&2
  echo "        history, and rides into any log that echoes the command." >&2
  echo "        a secret that reaches argv is a secret you must rotate." >&2
  echo "   fix: pipe it —" >&2
  echo "     rhx keyrack get --owner ehmpath --key $key --env $env --value \\" >&2
  echo "       | rhx git.grove.keyrack set $grove --org $org --key $key --env $env --value @stdin" >&2
  exit 2
fi

# ⚠️ a tty on stdin means NOBODY piped a value, so the read below would hang
#    forever, on a human who was never asked. fail-fast instead.
if [[ -t 0 ]]; then
  echo "✋ git.grove.keyrack: --value @stdin, but stdin is a terminal" >&2
  echo "   naught was piped in, so there is no value to push." >&2
  exit 2
fi

# ── the grove ──────────────────────────────────────────────────────
# accept every shape a caller may hold: a bare exid, the `cloud://` uri form
# a --grove flag uses, and `local` for this box.
host="$grove"
case "$grove" in
  local) host="" ;;
  cloud://*) host="${grove#cloud://}" ;;
esac

# .what = run a read-only snippet ON the grove
# .why  = `-n` closes stdin on purpose. a read must never eat the caller's
#         piped value — the value belongs to the SET alone.
__grove_sh() {
  if [[ -n "$host" ]]; then
    ssh -n -o ConnectTimeout=10 "$host" "$1"
  else
    bash -c "$1"
  fi
}

# .what = run a snippet ON the grove, through a LOGIN shell, with our stdin
#         forwarded to it
#
# .why  = two deliberate differences from __grove_sh, and neither is
#         decoration:
#
#   1. NO `-n`. this variant EXISTS to forward stdin — the credential value
#      rides in and lands in `keyrack set`'s prompt. that is the whole seam.
#   2. `bash -lc`. an `ssh host cmd` runs a NON-login shell, so the profile
#      that puts `rhx` on PATH is never sourced. absent this, every remote
#      `rhx` call dies `command not found` — a failure that reads as "the
#      grove has no rhachet" when the truth is "we asked the wrong shell".
#
#      `printf %q` quotes the payload for the remote shell, so a snippet with
#      quotes or a `$` survives the trip verbatim rather than gets re-expanded
#      on the far side.
__grove_login_sh() {
  if [[ -n "$host" ]]; then
    ssh -o ConnectTimeout=10 "$host" "bash -lc $(printf '%q' "$1")"
  else
    bash -lc "$1"
  fi
}

# read the whole of stdin, then strip a final newline — `keyrack get --value`
# prints one, and a value stored WITH it is a different secret than the one
# you read. the read-back below would catch that, but a failure the caller
# cannot act on is worse than one we simply avoid.
secret="$(cat)"
secret="${secret%$'\n'}"
if [[ -z "$secret" ]]; then
  echo "✋ git.grove.keyrack: the piped value is empty" >&2
  echo "   the read that fed this pipe produced no bytes — check it first:" >&2
  echo "     rhx keyrack get --owner ehmpath --key $key --env $env --value | wc -c" >&2
  echo "   ⚠️ a LOCKED key prints its tip and pipes as ZERO bytes, so 'locked'" >&2
  echo "      and 'absent' look identical downstream. unlock it first:" >&2
  echo "     rhx keyrack unlock --owner ehmpath --env $env --key $key" >&2
  exit 2
fi

echo "🦫 chew on it"
echo ""
echo "🔑 git.grove.keyrack set $grove"
echo "   ├─ 🌳 grove: ${host:-this box}"
echo "   ├─ 🏛️  org: $org"
echo "   ├─ 🔑 key: $key"
echo "   ├─ 🌍 env: $env"
echo "   ├─ 👤 owner: $keyrack_owner"
echo "   └─ 📏 value: ${#secret} bytes (never printed)"
echo ""

# ── find a repo of this org, on the grove ──────────────────────────
#
# .why = `keyrack --org` accepts only `@this`, which is read off the cwd's
#        .agent/keyrack.yml. so the set has nowhere to happen but inside a
#        repo of the target org.
#
# ⚠️ .the FIRST repo is not the same as a USABLE one — do not `head -1`
#
#   a repo's `.agent/keyrack.yml` carries an `extends:` list, and those
#   dep manifests are NOT in the repo. they arrive from `node_modules`,
#   materialized by `rhachet init`. so a repo cloned onto a grove and
#   never installed has a manifest whose whole chain dangles, and
#   `keyrack set` there dies with `extended keyrack not found`.
#
#   `head -1` picked exactly that repo on the first live run
#   (`sandpine/app-lessons-native`, alphabetically first, never
#   installed) and reported it as THE repo of the org. that verdict is
#   about a subject set of one, chosen before the check that decides it
#   — `term=partial-audit`, in this skill's own discovery.
#
#   so: enumerate EVERY candidate, probe each for a resolved chain, and
#   take the first that answers. a skipped repo is reported by name, so
#   an org whose repos are all uninstalled says exactly that.
echo "🔎 a repo of '$org' on the grove"
#
# ⚠️ .the WORKTREES are one level deeper, and they are the INSTALLED ones
#
#   `~/git/<org>/<repo>` is the base clone. it is fetched for reference and
#   is routinely never installed. the work happens in a WORKTREE, at
#   `~/git/<org>/_worktrees/<tree>`, and a worktree IS installed — a crew
#   cannot boot a route there otherwise.
#
#   a glob of `~/git/<org>/*/` sees only the base clones, so it reported
#   `51 repo(s) of 'ehmpathy', not one of them installed` on a grove that
#   held three live ehmpathy crews at that moment. true of the subject set
#   it enumerated, and false of the org — `term=partial-audit` again, in
#   the very probe added to cure the last one.
#
#   so enumerate BOTH levels, and put `_worktrees` first: it is where a
#   hit is expected, so the common case reports no skips at all.
repo_probe="$(__grove_sh "for g in \$(ls -d \"\$HOME\"/git/$org/_worktrees/*/.git \"\$HOME\"/git/$org/*/.git 2>/dev/null); do r=\"\${g%/.git}\"; m=\"\$r/.agent/keyrack.yml\"; [ -f \"\$m\" ] || continue; miss=0; for p in \$(sed -n 's|^[[:space:]]*-[[:space:]]*\\(\\.agent/.*\\)\$|\\1|p' \"\$m\"); do [ -f \"\$r/\$p\" ] || miss=1; done; echo \"\$miss \$r\"; done" || true)"

repo_path=""
repo_skipped=0
repo_skipped_first=""
while IFS=' ' read -r miss cand; do
  [[ -n "$cand" ]] || continue
  if [[ "$miss" == "0" ]]; then
    repo_path="$cand"
    break
  fi
  echo "   ├─ ⏭️  skipped (never installed): $cand"
  [[ -z "$repo_skipped_first" ]] && repo_skipped_first="$cand"
  repo_skipped=$(( repo_skipped + 1 ))
done <<< "$repo_probe"

if [[ -z "$repo_path" ]]; then
  if (( repo_skipped > 0 )); then
    echo "   └─ ✋ $repo_skipped repo(s) of '$org', not one of them installed" >&2
    echo "" >&2
    echo "✋ git.grove.keyrack: no INSTALLED repo of org '$org' on ${host:-this box}" >&2
    echo "   why: a repo's .agent/keyrack.yml extends dep manifests that live in" >&2
    echo "        node_modules and are materialized by \`rhachet init\`. an" >&2
    echo "        uninstalled clone has a chain that dangles, so \`keyrack set\`" >&2
    echo "        there dies with 'extended keyrack not found'." >&2
    echo "   fix: install one of them, e.g." >&2
    echo "     rhx git.grove.send --to $grove --what 'cd $repo_skipped_first && npm ci && npx rhachet init'" >&2
    exit 2
  fi
  echo "   └─ ✋ none found under ~/git/$org/" >&2
  echo "" >&2
  echo "✋ git.grove.keyrack: no repo of org '$org' on ${host:-this box}" >&2
  echo "   why: keyrack's --org accepts only @this, so the set must run INSIDE" >&2
  echo "        a repo of that org. there is none to run it in." >&2
  echo "   fix: clone one there first, e.g." >&2
  echo "     rhx git.grove.send --to $grove --what 'gh repo clone $org/<repo> ~/git/$org/<repo>'" >&2
  exit 2
fi
echo "   ├─ found: $repo_path"

# ⚠️ VERIFY the org rather than trust the path.
#
# .why = ~/git/<org>/<repo> is a convention, not a guarantee. a repo parked
#        under ehmpathy/ is not obliged to DECLARE org: ehmpathy, and if it
#        declares another the set lands on the wrong org — and SUCCEEDS. that
#        is term=false-report: no failure, and a verdict about a subject the
#        caller never named.
org_declared="$(__grove_sh "sed -n 's/^org:[[:space:]]*//p' '$repo_path/.agent/keyrack.yml' 2>/dev/null | head -1" || true)"
org_declared="$(echo "$org_declared" | tr -d '[:space:]')"
if [[ -z "$org_declared" ]]; then
  echo "   └─ ✋ it declares no org" >&2
  echo "" >&2
  echo "✋ git.grove.keyrack: '$repo_path' has no org in .agent/keyrack.yml" >&2
  echo "   --org @this would derive nought there, so the set is not attempted." >&2
  exit 2
fi
if [[ "$org_declared" != "$org" ]]; then
  echo "   └─ ✋ it declares org '$org_declared', not '$org'" >&2
  echo "" >&2
  echo "✋ git.grove.keyrack: the repo's org does not match --org" >&2
  echo "   asked for: $org" >&2
  echo "   repo says: $org_declared   ($repo_path)" >&2
  echo "   why: --org @this reads THIS field, so the set would have landed on" >&2
  echo "        '$org_declared'. it would have succeeded, against the wrong org." >&2
  exit 2
fi
echo "   └─ 🟢 it declares org: $org_declared"
echo ""

# ── the set ────────────────────────────────────────────────────────
#
# ⚠️ --mech is REQUIRED on the remote side, and not by our choice. `keyrack
#    set` asks for the grant mechanism interactively, and refuses to when
#    stdin is not a terminal — which it never is here, because stdin carries
#    the value. measured 2026-09-03:
#      "✋ blocked: a mechanism choice is required but stdin is not a terminal"
#    so absent it, the value can never be piped at all.
echo "📤 set $org.$env.$key on the grove"
set_out=""
set_rc=0
set_out="$(printf '%s' "$secret" | __grove_login_sh "cd '$repo_path' && rhx keyrack set --owner '$keyrack_owner' --key '$key' --env '$env' --vault '$keyrack_vault' --mech '$keyrack_grant'" 2>&1)" || set_rc=$?
if [[ $set_rc -ne 0 ]]; then
  echo "   └─ 💥 the set failed" >&2
  echo "" >&2
  echo "💥 git.grove.keyrack: keyrack set failed on ${host:-this box}" >&2
  echo "$set_out" | sed 's/^/   /' >&2
  exit 1
fi
echo "$set_out" | sed 's/^/   │  /'

# ── VERIFY the set, by read-back ───────────────────────────────────
#
# .why = `keyrack set` reports on what it CONFIGURED — the vault, the mech,
#        the address. it says naught about the VALUE it stored, so a
#        truncated or empty write reports success identically to a good one.
#        exactly the shape rule.require.verify-after-send exists for.
#
# .why a HASH rather than the value: neither side may print a secret, and a
#      sha256 compare answers "did the same bytes land?" without one. a
#      length compare would not — a truncation to the same length, or a shell
#      that ate a `$`, both keep the byte count.
echo "   │"
echo "   ├─ 🔍 read it back to prove the VALUE landed, not merely the config"
want_hash="$(printf '%s' "$secret" | sha256sum | cut -d' ' -f1)"
got_hash=""
got_rc=0
got_hash="$(__grove_login_sh "cd '$repo_path' && rhx keyrack unlock --owner '$keyrack_owner' --env '$env' --key '$key' >/dev/null 2>&1; rhx keyrack get --owner '$keyrack_owner' --key '$key' --env '$env' --value 2>/dev/null | sha256sum | cut -d' ' -f1")" || got_rc=$?
got_hash="$(echo "$got_hash" | tr -d '[:space:]')"

# the hash of an EMPTY read — a locked or absent key prints a tip rather than
# a value, and that pipes through as zero bytes. named here so the error can
# say WHICH failure it was, rather than a bare "hashes differ".
empty_hash="$(printf '' | sha256sum | cut -d' ' -f1)"

if [[ $got_rc -ne 0 || -z "$got_hash" ]]; then
  echo "   └─ 💥 could not read the key back" >&2
  echo "" >&2
  echo "💥 git.grove.keyrack: the set reported success, and the read-back failed" >&2
  echo "   ⚠️ the key's state on ${host:-this box} is UNKNOWN — do not assume it took." >&2
  echo "   check by hand:" >&2
  echo "     cd $repo_path && rhx keyrack get --owner $keyrack_owner --key $key --env $env --value | wc -c" >&2
  exit 1
fi
if [[ "$got_hash" == "$empty_hash" ]]; then
  echo "   └─ 💥 the key reads back EMPTY" >&2
  echo "" >&2
  echo "💥 git.grove.keyrack: the set reported success and stored nought" >&2
  echo "   the key is configured on the grove, and its value is zero bytes." >&2
  echo "   so a clone there will fail on an absent key, with a rack that LOOKS set." >&2
  exit 1
fi
if [[ "$got_hash" != "$want_hash" ]]; then
  echo "   └─ 💥 the value that landed is NOT the value sent" >&2
  echo "" >&2
  echo "💥 git.grove.keyrack: the read-back does not match" >&2
  echo "   sent:   ${want_hash:0:16}…  (${#secret} bytes)" >&2
  echo "   landed: ${got_hash:0:16}…" >&2
  echo "   likely: the value was mangled in transit — a final newline, or a" >&2
  echo "           shell expansion on the far side." >&2
  exit 1
fi

echo "   └─ 🟢 sha256 matches — the same bytes landed"
echo ""
echo "🌊 $org.$env.$key is set on ${host:-this box}"
echo "   └─ a clone there reads it after: rhx keyrack unlock --owner $keyrack_owner --env $env"
exit 0
