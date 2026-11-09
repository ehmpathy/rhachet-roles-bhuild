#!/usr/bin/env bash
######################################################################
# .what = the depth lane of the 1.vision guard: check a vision yield's
#         `## .the root purpose` section is present and 3 layers deep
#
# .why  = a vision must say why it is wanted, a why under a why under
#         a why. depth is a count, so a deterministic lane holds it;
#         whether each layer is a motive is the brain lane's judgment
#         (rule.require.vision-root-purpose)
#
# .how  = thin dispatcher to TypeScript implementation
#
# .args:
#   --vision <path>   (required) the vision yield, inside cwd
#   --help, -h        print usage and exit 0
#
# .examples:
#   rhx review.vision.root-purpose --vision '.behavior/v2026_11_08.sandpine-lesson-reminders/1.vision.yield.md'
#
# .output:
#   - treestruct verdict, each blocker and nitpick with its fix
#   - always ends in `N blockers` and `N nitpicks`, the counts the guard tallies
#   - a nitpick names whys in another form (`* why:`, `1. why`) beside real layers
#
# .layers:
#   - each layer is a `- why:` bullet, nested one indent under the last
#   - flat bullets at one indent are one layer
#   - a layer that holds only a `<…>` scaffold placeholder is no layer
#
# .exit codes:
#   - 0: a verdict was printed (blockers or none)
#   - 2: bad input (--vision absent, outside cwd, no such file, not a
#        file, or unreadable)
######################################################################

set -euo pipefail

# print usage on --help or -h, before any dispatch
for arg in "$@"; do
  if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
    cat <<'USAGE'
🦫 review.vision.root-purpose — check a vision yield's root purpose is present and 3 layers deep
   ├─ usage: rhx review.vision.root-purpose --vision <path>
   ├─ inputs
   │  └─ --vision (required) the vision yield, inside cwd
   ├─ example
   │  └─ rhx review.vision.root-purpose --vision '.behavior/v2026_11_08.sandpine-lesson-reminders/1.vision.yield.md'
   └─ exit codes
      ├─ 0: a verdict was printed (blockers or none); the counts sit in the summary
      └─ 2: bad input (--vision absent, outside cwd, no such file, not a file, or unreadable)
USAGE
    exit 0
  fi
done

exec node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.reviewVisionRootPurpose())" -- "$@"
