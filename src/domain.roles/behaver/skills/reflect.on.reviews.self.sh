#!/usr/bin/env bash
######################################################################
# .what = reflect on init.behavior self-reviews across claude transcripts
#
# .why  = deterministically diagnose which self-reviews earn their keep and
#         which are noise, so the guard templates can be tuned with evidence
#         - reads every transcript in every project on the machine by default
#         - reconstructs each self-review window from the transcript
#         - extracts deterministic signals (edits, read, bash, articulation)
#         - (apply mode) asks a cheap brain for a utility verdict
#
# usage:
#   reflect.on.reviews.self.sh                                  # plan, machine-wide
#   reflect.on.reviews.self.sh --mode apply                     # + cheap-brain verdicts
#   reflect.on.reviews.self.sh --route .behavior/my-feature     # narrow to one route
#   reflect.on.reviews.self.sh --project ehmpathy               # narrow to one project
#   reflect.on.reviews.self.sh --stone 1.vision --mode apply    # narrow to one stone
#   reflect.on.reviews.self.sh --brain fireworks/deepseek/v4-flash --mode apply
#   reflect.on.reviews.self.sh --help                           # show the usage guide
#
# options:
#   --mode     plan (deterministic only) | apply (+ brain verdicts); default plan
#   --route    filter to windows of one route dir (absent = all routes)
#   --project  filter to one project's transcripts (absent = all projects)
#   --stone    filter to one stone (absent = all stones)
#   --brain    cheap brain choice slug; default fireworks/deepseek/v4-flash
#   --into     report output path; default ~/.rhachet/reflect (or into --route dir)
#   --help     show the usage guide and exit (no sweep)
#
# guarantee:
#   - plan mode needs no brain and no credentials
#   - apply mode needs FIREWORKS_API_KEY (keyrack: owner ehmpath)
#   - a corrupt or unreadable transcript is skipped, never fatal
######################################################################

set -euo pipefail

exec node -e "import('rhachet-roles-bhuild').then(m => m.cli.reflectOnReviewsSelf())" -- "$@"
