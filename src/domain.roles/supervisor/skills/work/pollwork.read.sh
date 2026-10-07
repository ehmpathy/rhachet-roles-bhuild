#!/usr/bin/env bash
######################################################################
# pollwork.read — the sweep header, and the parallel read of every tree
#
# 🔴 .a PART of pollwork.sh — sourced, never executed, and only BY pollwork.sh.
#     git.crew.poll.sh sources pollwork.sh, which loads every part. see
#     __poll_load_parts there for why the poll is cut into parts at all.
#
# .holds = __poll_render_header, __poll_tree_facts_on_grove, __poll_one_tree,
#          and the __poll_read_trees stage
######################################################################

######################################################################
# __poll_render_header — the sweep header: scope, groves, and what was not read
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_render_header() {
echo "🦫 chew on it"
echo ""
echo "🪵 git.crew.poll"
echo "   ├─ derived from: crew ledger ∪ duct registry ∪ live tmux (every host)"
echo "   ├─ scope: crews only — every tree is \`git tree status --repo @all\`"
# ⭐ declare the star scope loudly — a filtered sweep that hides its filter is
#    the clipped-sweep defect (rule.forbid.clipped-sweeps). state the funded set
#    shown, the non-star crews hidden, and the flag that widens.
if [[ "$STAR" == "true" ]]; then
  echo "   ├─ ⭐ scope: SPONSORED stars (the default) — ${#TREES[@]} shown, ${STAR_HIDDEN} non-star crew(s) hidden (pass --all to widen)"

  # 🔴 the ANOMALY, named — never folded into the hidden count above.
  #    a hidden IDLE tree is correct to hide; a hidden INFLIGHT tree holds a
  #    grove slot off-budget, which the invariant forbids outright. so it gets
  #    its own line, its own ⚠️, and the TREE NAME — a bare count would force
  #    the reader into `--all` to learn which tree, and a tool must guide
  #    rather than merely classify.
  if (( STAR_ANOMALY > 0 )); then
    echo "   ├─ ⚠️  ANOMALY: ${STAR_ANOMALY} unsponsored tree(s) are INFLIGHT — a grove slot spent off-budget"

    # ⚠️ CAPPED, and the remainder DECLARED. measured 2026-09-15 on the first
    #    live run: 22 anomalies rendered 22 lines ABOVE a 5-line fleet report,
    #    which inverts the signal — the reader meets the caveat and loses the
    #    verdict. a cap with a declared remainder honors both rules at once:
    #    the count is never silent (rule.forbid.clipped-sweeps) and the report
    #    stays scannable (rule.require.treestruct-output).
    __anom_shown=0
    for __t in "${STAR_ANOMALY_TREES[@]}"; do
      (( __anom_shown < 5 )) || break
      echo "   │   ├─ $__t — sponsor it, or fell it: rhx git.crew.fell --tree $__t"
      __anom_shown=$(( __anom_shown + 1 ))
    done
    # 🔴 the remainder names a surface that still MARKS the anomaly.
    #
    #    it read `… N more — rhx git.crew.poll --all to read every one`, and
    #    that pointer is false: this whole arm — the COUNT at line ~1779 and
    #    the render here alike — sits inside `if [[ "$STAR" == "true" ]]`, so
    #    `--all` emits no anomaly block at all. a reader who obeyed the tool
    #    received every tree UNMARKED, with no tell that the signal was gone.
    #
    #    ⇒ the remedy the tool named DESTROYED the signal it named it for —
    #      `term=false-report` at its worst shape: not a wrong number, but a
    #      pointer that reads true and whose destination contradicts it.
    #
    #    measured 2026-09-20 over four consecutive babysit ticks. step 2 of
    #    the babysit contract asks for the WHOLE FLEET, so the supervisor ran
    #    `--all` every tick, never once met this block, and reported "the
    #    grove is stalled and no lever exists" on three consecutive ticks —
    #    while 26 unsponsored INFLIGHT trees each held an off-budget grove
    #    slot, which is precisely the lever that verdict denied
    #    (define.invariant.crew.inflight-implies-sponsored).
    #
    # ⚠️ the CAP stays. it is correct and measured (see above) — the defect
    #    was never the withheld rows, only the lie about where to find them.
    if (( STAR_ANOMALY > __anom_shown )); then
      echo "   │   ├─ … $(( STAR_ANOMALY - __anom_shown )) more, withheld — the cap keeps this report scannable"
      echo "   │   └─ 🔴 \`--all\` renders NO anomaly block: it shows every tree and MARKS none. the sponsored set lives in the store — rhx eco.priority get"
    fi
  fi
fi
# 🔴 the partition runs UNCONDITIONALLY, and above every surface that reads it
#
#   it lived inside the header's `if` for exactly one tick, and that was already
#   a defect: the FOOTER caveats on `--fellable` / `--healable` read their own
#   count off `${#HOSTS_UNREACHED[@]}` and so kept the fused figure the header
#   had just stopped emitting — one report, two counts of one set that do not
#   agree (`4 grove(s) UNREACHED` beneath a header that named 2 and 2).
#
#   ⇒ the partition is a property of the SET, never of one render. it belongs
#     where every consumer can see it, computed once.
__unreached_asleep=()
__unreached_gone=()
__forest_groves="${GIT_FOREST_DIR:-$HOME/.git.forest}/groves"
for __u in "${HOSTS_UNREACHED[@]}"; do
  if [[ -f "$__forest_groves/$__u.json" ]]; then
    __unreached_asleep+=("$__u")
  else
    __unreached_gone+=("$__u")
  fi
done

if (( ${#HOSTS_UNREACHED[@]} > 0 )); then
  # .why LOUD, and above the report rather than beneath it
  #   a grove we could not ask yields the same empty session list as a grove
  #   that holds no crews. the reader must meet that caveat BEFORE the
  #   verdicts it qualifies (term=partial-audit).
  #
  #   ⚠️ this line once read `crews there render 👻 phantom and MAY be at
  #      work` — a caveat that asked the reader to hold a footnote in order
  #      to read a verdict correctly. a verdict that needs a footnote to be
  #      read correctly is the WRONG VERDICT, so the footnote is no longer
  #      the repair: those crews render `😴 asleep` on their own rows, and
  #      this line names the count rather than corrects it.
  # 🔴 .why the set is PARTED before it is rendered
  #    this row named ONE cause for a set that holds TWO, and prescribed one
  #    cure for both (`rule.require.enumerate-before-you-name`, the ninth
  #    instance on record).
  #
  #    measured 2026-09-16. the row read:
  #      ⚠️  UNREACHED: …v20260811.ground …v20260810 …v20260811 …v20260810.ground
  #      └─ crews there render 😴 asleep … rhx git.grove.wake <grove>
  #    and `rhx git.grove.list` held FOUR entries, none of them v20260810. the
  #    prescribed cure, run on it:
  #      🐢 bummer dude — grove 'grove-sandpine-v20260810' is not registered
  #    exit 2. so HALF the names on that row carried a command that cannot work,
  #    under a sentence that cannot be true — `😴 asleep` says a box is there
  #    and quiet, where in truth the forest holds no such box (term=false-report:
  #    a true claim about one axis dressed as a claim about another).
  #
  # ⚠️ the two take OPPOSITE cures, which is what makes the union a defect
  #    rather than a terseness:
  #      registered + no answer  → the tunnel is down. `git.grove.wake` repairs it
  #      not registered          → the grove is GONE. no wake exists; the crews
  #                                named on it are orphans on a box that was
  #                                recreated out from under them, and the move is
  #                                a fell or a re-register, never a wake
  #
  #    the registry test is the same one `git.grove.wake` itself applies, so the
  #    two populations are settled identically wherever either is read.
  if (( ${#__unreached_asleep[@]} > 0 )); then
    echo "   ├─ ⚠️  UNREACHED: ${__unreached_asleep[*]}"
    echo "   │   └─ registered, no answer — crews there render 😴 asleep, NOT down — rhx git.grove.wake <grove>"
  fi
  if (( ${#__unreached_gone[@]} > 0 )); then
    echo "   ├─ ⚠️  RETIRED: ${__unreached_gone[*]}"
    echo "   │   └─ NOT in the forest — a wake exits 2 here. crews named on it are ORPHANS on a box that is gone — rhx git.grove.list"
  fi
fi
echo "   └─ read: parallel, read-only"

if (( ${#TREES[@]} == 0 )); then
  echo ""
  echo "🦫 the pond is still — no crews, past or present"
  exit 0
fi
echo ""

}

######################################################################
# read one tree — printed as a single tab-separated record
######################################################################

# .what = the four git facts a release verdict needs, read ON THE GROVE
#         emits `<remote>\t<branch>\t<commits>\t<dirtyline>`, one line
#
# 🔴 .why it exists — `--fellable` could not name a tree on a grove
#    the verdict below needs five facts. FOUR are properties of the box the
#    worktree sits on (org/repo, branch, commit count, dirty). the FIFTH —
#    did the pr merge — is a property of GITHUB, and `gh pr list --repo
#    <org>/<repo> --head <branch>` answers it from any box on earth.
#
#    the whole grove arm returned `🌐 on grove — not read from here` because
#    the first four were unreachable, and it took the fifth down with them. so
#    the flag whose WHOLE PURPOSE is to render the fell set could not name a
#    single grove tree, on a fleet that is 24/25 on-grove.
#
# ⚠️ .and it disclosed the blind spot, which is what let it survive
#    the footer said, honestly, every tick: "a tree that SHIPPED looks
#    identical to one that did not." a declared bound reads as settled rather
#    than broken — measured 2026-09-17, four consecutive ticks deferred one
#    tree's closeout by quoting that sentence back as a verdict. one
#    `gh pr list --head <branch>` then answered it: MERGED at 13:09Z.
#
# .note ONE ssh per grove tree, per tick — the tree lookup and the four reads
#       ride in the same remote `sh -c`. the poll already spends a `duct.read`
#       per tree under `--live`, so this is the same order of cost, and a drop
#       degrades to the decline that was the unconditional answer before.
#
# ⚠️ the three load-bearing flags, each a defect first (see
#    __crew_tree_dir_on_grove, which carries the same three for the same
#    reasons): the root is CREWWORK_GIT_ROOT_REMOTE so `~` resolves on the
#    GROVE · the glob runs under `sh`, never the login zsh, which ERRORS on an
#    unmatched glob · `-n` so an ssh inside a caller's `while read` cannot eat
#    that loop's stdin.
__poll_tree_facts_on_grove() {
  local host="$1" slug="$2"
  local dotted="${slug//_/.}"
  local root="${CREWWORK_GIT_ROOT_REMOTE:-~/git}"
  local rscript out

  # single-quoted here so NAUGHT expands locally: every `$1`/`$d`/`$b` below
  # is the REMOTE shell's. the three positionals arrive after the `sh` argv0.
  # 🔴 the dirt ships WHOLE, `;`-joined — it used to ship `head -1`
  #   one line cannot be classified. a set whose first entry is `.radio` and
  #   whose second is a source file would read `tool state only` and invite a
  #   stash over real work. the join is `;` because the record is ONE
  #   tab-separated line, so a newline would split it into two rows.
  #   `head -40` bounds it: a tree with 400 dirty files is work by any read,
  #   and the render names one path plus a count regardless.
  rscript='d=$(ls -d "$1"/*/_worktrees/"$2" "$1"/*/_worktrees/"$3" 2>/dev/null | head -1); [ -n "$d" ] || exit 9; b=$(git -C "$d" merge-base HEAD origin/main 2>/dev/null || git -C "$d" merge-base HEAD origin/master 2>/dev/null || echo ""); if [ -n "$b" ]; then c=$(git -C "$d" rev-list --count "$b"..HEAD 2>/dev/null || echo 0); else c="?"; fi; printf "%s\t%s\t%s\t%s\n" "$(git -C "$d" remote get-url origin 2>/dev/null)" "$(git -C "$d" rev-parse --abbrev-ref HEAD 2>/dev/null)" "$c" "$(git -C "$d" status --porcelain 2>/dev/null | head -40 | tr "\n" ";")"'

  # $root rides UNQUOTED so the grove's shell expands its `~`; the two slug
  # forms ride quoted, since a tree name is data and a glob is not wanted there
  out=$(ssh -n -o BatchMode=yes -o ConnectTimeout=8 "$host" \
          "sh -c '$rscript' sh $root \"$dotted\" \"$slug\"" 2>/dev/null) || return 1
  [[ -n "$out" ]] || return 1
  printf '%s' "$out"
}

# .what = derive the release verdict for one tree
# .why  = each tree is read in its own subshell so one slow remote never
#         holds the rest; a record is emitted even on total failure, so a
#         broken tree is a 💥 row rather than an absent one
__poll_one_tree() {
  local tree="$1" host="${2:-}"
  local dir org repo branch glyph verdict detail

  # ⚠️ a CLOUD crew's tree is on the grove, and every read below this line is
  #    local — `__crew_tree_dir`, `git -C`, `gh pr`. so a grove tree is not a
  #    tree this function can judge, and it must say that rather than judge it.
  #
  # .why it is not enough to let the lookup fail: it did, and it rendered
  #      `💥 unknown — no worktree on disk`. that sentence names THE disk while
  #      it read only THIS one, so it is a `term=false-report` — exit 0,
  #      ordinary row shape, content untrue. measured on the first grove crew,
  #      2026-09-02: the worktree was plainly on the grove, and the crew half
  #      of the very same row read `😶 at work`. one row, two derivations of
  #      unequal reach — the exact defect the crew half was repaired for, one
  #      column over.
  #
  # ✅ .REPAIRED 2026-09-17 — the decline is now a FAILURE path, never the
  #    whole grove path. the prose above stands as the record of why the skip
  #    was right at the time, and one line of it was wrong: it read "to ssh a
  #    `git status` + `gh pr` per tree, per tick, is a different instrument".
  #
  #    the `gh pr` half never needed a grove at all — merge state is a property
  #    of GITHUB, and `gh pr list --repo <org>/<repo> --head <branch>` answers
  #    it from any box. only the four LOCAL facts needed the grove, and they
  #    ride in ONE ssh (__poll_tree_facts_on_grove). so the fifth fact was held
  #    hostage by the four for no reason but the order of the reads.
  #
  # 🔴 the cost of that was `--fellable` — the flag whose whole purpose is to
  #    render the fell set — naming no grove tree at all, on a fleet 24/25
  #    on-grove, under a footer that disclosed it honestly every tick.
  local remote="" commits="" dirty=""

  if [[ -n "$host" ]]; then
    local __facts=""
    __facts="$(__poll_tree_facts_on_grove "$host" "$tree")" || __facts=""

    # .why the verdict word is fixed (`on grove`) and the host rides in the
    #      DETAIL: the summary tallies by verdict over a fixed list, so a
    #      verdict that embeds a host name can never match a bucket — it tallies
    #      as zero and the trees line renders empty, which reads as "no trees"
    #      rather than "one tree i declined to judge". a verdict is a CLASS; the
    #      host is a fact about the instance.
    #
    # ⚠️ this is still the honest verdict for a subject you did not read — an
    #    asleep grove, a dropped tunnel, a tree the glob did not find. what it
    #    may NEVER become is a fall-through to the no-pr arm below, which would
    #    render `🫧 no work` over a tree that shipped.
    if [[ -z "$__facts" ]]; then
      printf '%s\t🌐\ton grove\t%s — not read from here\t-\n' "$tree" "$host"
      return 0
    fi

    local __dirty_raw=""
    IFS=$'\t' read -r remote branch commits __dirty_raw <<<"$__facts"
    # 🔴 ONE classifier, two feeds. the grove arm and the local arm produce the
    #   same `;`-joined shape and hand it to the same predicate, so the two can
    #   never diverge — the two-derivations-of-unequal-reach defect this file
    #   records three times over in its own comments.
    dirty="$(__crew_dirt_read "$__dirty_raw")"

    # the ssh answered and the worktree is there, but git did not. an empty
    # org or branch would build `gh pr list --repo /  --head ''`, which fails
    # and lands in the no-pr arm — a confident `🫧 no work` over an unread tree
    if [[ -z "$remote" || -z "$branch" ]]; then
      printf '%s\t🌐\ton grove\t%s — worktree found, git did not answer\t-\n' "$tree" "$host"
      return 0
    fi
  else
    dir="$(__crew_tree_dir "$tree")" || {
      printf '%s\t💥\tunknown\tno worktree on this box\t-\n' "$tree"
      return 0
    }

    # read org/repo from the REMOTE, never from the path or the slug.
    # the layout is $root/<org>/_worktrees/<repo>.<user>.<slug> — org-level,
    # so the repo is not a path segment at all, and to derive it from the
    # slug's dots would be a claim about a NAME rather than a read of the
    # subject (term=partial-audit._.choice._.md, the fourth mechanism)
    remote="$(git -C "$dir" remote get-url origin 2>/dev/null)" || remote=""
    if [[ -z "$remote" ]]; then
      printf '%s\t💥\tunknown\tno origin remote\t-\n' "$tree"
      return 0
    fi

    branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)" || {
      printf '%s\t💥\tunknown\tcould not read branch\t-\n' "$tree"
      return 0
    }

    # does the branch carry any work at all?
    local base
    base="$(git -C "$dir" merge-base HEAD origin/main 2>/dev/null || git -C "$dir" merge-base HEAD origin/master 2>/dev/null || echo "")"
    if [[ -n "$base" ]]; then
      commits="$(git -C "$dir" rev-list --count "$base"..HEAD 2>/dev/null || echo 0)"
    else
      commits="?"
    fi

    # uncommitted work is what makes a fell REFUSE (git.tree.del's safety
    # gate), so a merged tree that is dirty is not actually fellable — say
    # so on the row rather than let the fell surface it later.
    #
    # 🔴 and say WHAT the dirt is. this read ran already and its content was
    #   discarded, so `✋ dirty` cost a send-plus-read per tree before a
    #   supervisor could decide. same `;`-joined shape as the grove arm, same
    #   classifier.
    dirty="$(__crew_dirt_read "$(git -C "$dir" status --porcelain 2>/dev/null | head -40 | tr '\n' ';')")"
  fi

  # 🔴 the org/repo parse is SHARED, below the branch — both arms yield the
  #    same `<remote>` shape, so one parse serves both. two copies would be two
  #    derivations of one fact, which is the defect class this file records
  #    three times over in its own comments.
  # git@github.com:org/repo.git  |  https://github.com/org/repo.git
  remote="${remote%.git}"
  remote="${remote#*github.com[:/]}"
  remote="${remote#*github.com:}"
  remote="${remote#*github.com/}"
  org="${remote%%/*}"
  repo="${remote##*/}"

  # the pr, if one exists — --state all so a MERGED pr is still visible
  local prjson
  prjson="$(gh pr list --repo "$org/$repo" --head "$branch" --state all \
              --json number,state,isDraft,mergeStateStatus,statusCheckRollup \
              --limit 1 2>/dev/null)" || prjson=""

  if [[ -z "$prjson" || "$prjson" == "[]" ]]; then
    # no pr. three cases, and they are NOT one case — a tree with zero
    # commits but a dirty worktree is a mechanic mid-route, not an idle
    # branch. to render both as "no work" would be true of the COMMITS
    # and false of the TREE, which is the reader-inference trap
    # (term=false-report._.choice._.md, cause = scope)
    #
    # .why the ref below joins on `@` and the pr refs join on `#`
    #   these four rows name a BRANCH; the pr rows further down name a PR
    #   NUMBER. both read `%s/%s#%s` until 2026-08-30, so ONE separator carried
    #   two senses in ONE column, told apart only by whether the right side
    #   happens to be an integer. that is `rule.forbid.term.addition.ambiguous`
    #   at the punctuation layer.
    #
    #   and the branch form was the false one. `owner/repo#N` is github's OWN
    #   notation for an issue or pr — it is what our own tone rules mandate for
    #   citing one — so `ehmpathy/rhachet#beav/feat-x` reads as a pr reference
    #   and there is no pr. a reader (or a renderer, or a paste into a github
    #   comment) resolves it to naught.
    #
    #   `@` is the honest join: `repo@branch` reads "repo AT branch", matches
    #   `pkg@version`, and matches git's own rev syntax (`main@{upstream}` sits
    #   ten lines below). so `#` is left to mean exactly one thing.
    if [[ "$commits" == "0" ]]; then
      if [[ -n "$dirty" ]]; then
        printf '%s\t✋\tin flight\twork uncommitted, no commit yet\t%s/%s@%s\n' \
          "$tree" "$org" "$repo" "$branch"
      else
        printf '%s\t🫧\tno work\tno commits, worktree clean\t%s/%s@%s\n' \
          "$tree" "$org" "$repo" "$branch"
      fi
      return 0
    fi
    if git -C "$dir" rev-parse --abbrev-ref '@{upstream}' >/dev/null 2>&1; then
      printf '%s\t✋\tno pr\t%s commit(s) pushed, no pr opened%s\t%s/%s@%s\n' \
        "$tree" "$commits" "$dirty" "$org" "$repo" "$branch"
    else
      printf '%s\t✋\tunpushed\t%s local commit(s), no remote branch%s\t%s/%s@%s\n' \
        "$tree" "$commits" "$dirty" "$org" "$repo" "$branch"
    fi
    return 0
  fi

  local num state draft merge checks
  num="$(printf '%s' "$prjson" | jq -r '.[0].number')"
  state="$(printf '%s' "$prjson" | jq -r '.[0].state')"
  draft="$(printf '%s' "$prjson" | jq -r '.[0].isDraft')"
  merge="$(printf '%s' "$prjson" | jq -r '.[0].mergeStateStatus // "UNKNOWN"')"

  # roll the check runs up to one word. a FAILURE anywhere outranks a
  # unsettled run: a red check is actionable now, an unsettled one is not
  checks="$(printf '%s' "$prjson" | jq -r '
    ( .[0].statusCheckRollup // [] ) as $c
    | if   ($c | length) == 0 then "none"
      elif ($c | map(.conclusion // "") | any(. == "FAILURE" or . == "TIMED_OUT" or . == "CANCELLED" or . == "STARTUP_FAILURE")) then "failed"
      elif ($c | map(.status // "COMPLETED") | any(. != "COMPLETED")) then "awaited"
      else "pass" end')"

  if [[ "$state" == "MERGED" ]]; then
    printf '%s\t👌\tmerged\tpr #%s landed — fell it%s\t%s/%s#%s\n' "$tree" "$num" "$dirty" "$org" "$repo" "$num"
    return 0
  fi
  if [[ "$state" == "CLOSED" ]]; then
    printf '%s\t✋\tclosed\tpr #%s closed unmerged\t%s/%s#%s\n' "$tree" "$num" "$org" "$repo" "$num"
    return 0
  fi
  if [[ "$draft" == "true" ]]; then
    printf '%s\t✋\tdraft\tpr #%s is a draft, checks %s\t%s/%s#%s\n' "$tree" "$num" "$checks" "$org" "$repo" "$num"
    return 0
  fi

  case "$checks" in
    failed)  glyph="✋"; verdict="failed";  detail="pr #$num — ci failed" ;;
    awaited) glyph="✋"; verdict="awaited"; detail="pr #$num — ci still runs" ;;
    *)
      case "$merge" in
        BEHIND|DIRTY) glyph="✋"; verdict="behind";  detail="pr #$num — needs a rebase ($merge)" ;;
        BLOCKED)      glyph="✋"; verdict="blocked"; detail="pr #$num — ci pass, a gate holds it" ;;
        *)            glyph="✋"; verdict="green";   detail="pr #$num — ci pass, mergeable" ;;
      esac
      ;;
  esac

  printf '%s\t%s\t%s\t%s\t%s/%s#%s\n' "$tree" "$glyph" "$verdict" "$detail" "$org" "$repo" "$num"
}

######################################################################
# read every tree at once
######################################################################

######################################################################
# __poll_read_trees — read every tree at once, one subshell per tree
######################################################################
#
# .note = the body is the poll's own top-level code, moved VERBATIM and left
#         unindented, so `git diff --color-moved` and `git blame -C` trace
#         every line to its origin. a `declare` here carries `-g`: at top
#         level it was global, and a stage that shares its maps with the
#         stages after it must keep them so.
__poll_read_trees() {
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

for tree in "${TREES[@]}"; do
  (
    slot="$WORK/$(printf '%s' "$tree" | tr '/' '_').row"
    # the host rides in as arg 2. CREW_HOST is keyed on the canon form, and
    # it is '' for a local crew — so the subshell learns which box the tree
    # lives on, and can decline to judge one it cannot read.
    tree_host="${CREW_HOST[$(__crew_canon "$tree")]:-}"
    # 🔴 __poll_tree_facts_on_grove rides in the declare list, and
    #    CREWWORK_GIT_ROOT_REMOTE beside it. a helper absent from this line is
    #    UNDEFINED at its call site, so the grove read fails and every grove
    #    tree declines exactly as it did before the cure — green in source,
    #    inert in production. clamped at work.surface [case38][t2].
    if ! timeout "$TIMEOUT" bash -c "$(declare -f __poll_one_tree __crew_tree_dir __poll_tree_facts_on_grove __crew_dirt_read __crew_dirt_is_tool_state); CREWWORK_GIT_ROOT='$CREWWORK_GIT_ROOT'; CREWWORK_GIT_ROOT_REMOTE='$CREWWORK_GIT_ROOT_REMOTE'; __poll_one_tree '$tree' '$tree_host'" > "$slot" 2>/dev/null
    then
      printf '%s\t⏳\ttimeout\tno answer within %ss\t-\n' "$tree" "$TIMEOUT" > "$slot"
    fi
  ) &
done
wait
}
