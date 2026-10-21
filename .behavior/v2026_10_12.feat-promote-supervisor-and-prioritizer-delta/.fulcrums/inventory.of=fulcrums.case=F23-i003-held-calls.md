# F23 — the small calls i003 holds rather than repairs

each section is one peer concern of round i003 that this tree answers with a held call, not a
code change. each names the fork, the call taken, and why.

## .a — positional args in the crewwork lib (r016 b1, n1)

- **fork:** convert every `__crew_*` helper to named args, or convert only the risky ones
- **taken:** convert the two the reviewer singled out — `__crew_resume_seat` (six args, two
  callers, now `--tree --grove --who --uri --mode --await`) and the grove test's `probe` (now a
  named input). the rest stay positional
- **why:** the rest are short internal helpers in one sourced lib, each with one call site; the
  lib's convention is positional `__crew_*` internals. a lib-wide conversion is a sweep across
  files this change does not otherwise open — dirty, per `rule.always.fix-forward-under-scouts-honor`
- **rework:** clean, per helper

## .b — wet-over-dry on single-caller helpers (r016 n1)

- **taken:** keep `__crew_read_local_seat_hint`, `__crew_cap_grove_spread`, `__crew_node_guard`
- **why:** each names a decode the orchestrator would otherwise inline, which
  `rule.forbid.inline-decode-friction` (blocker) forbids. a named transformer with one caller is
  the cure for that rule, not a premature abstraction

## .c — `crew.send` knows the grant verbs (r020 b1)

- **taken:** the human-grant predicate lives once, in the transport (`__duct_is_human_grant_payload`,
  `ductwork.io.sh`). `crew.send`, `duct.send` and `git.grove.send` all consult it
- **why:** only the transport can see that the "terminal" is a pane a clone drives. the owning
  verbs' tty guards read their own caller, and a pane has a tty, so they cannot refuse it. the
  predicate is a deny-list on what the crew's own transport carries, a tripwire (F11), not a
  second owner of the verbs

## .d — the node-migrate roster is hard-coded (r020 n1, r038 §6)

- **taken:** held as the source draws it
- **why:** the roster mirrors `ehmpathy/declapract-typescript-ehmpathy`, which offers no runtime
  read. a stale entry fails loud at the `&&` chain. a shared artifact is a cross-repo change →
  ported-debts dream

## .e — the sponsor record keys on the caller's repo (r028 n1, r038 §1)

- **taken:** the record stays the operator's, keyed on the repo the supervisor runs in, and that is
  now documented at `__crew_sponsor_meter`. the `CREWWORK_SPONSOR_METER` env seam stays
- **why:** the sponsor is the human who runs the supervisor, not a property of each crew's repo.
  the env seam lets tests point at a temp record without a write into the real repo's `.meter/`;
  it changes the path only, never the behavior

## .f — `__sat_nvim_cue` is one function (r014 n1)

- **taken:** kept whole; it now takes named args
- **why:** it is one render branch built from one census line. a split adds a function and no
  clarity. its verdict is clamped through the census fixture (sat [case19])

## .g — two "owes `--fruit-why`" predicates (r038 §5)

- **taken:** both held, as designed
- **why:** the board flag is advisory and rank-based (`rule.require.lowfruit-before-topfruit`
  lines 13, 63). the `set` refusal fires on a sponsor act alone (line 97, "an order, not a ban").
  one shared predicate would either refuse plain `--fruit top` writes or silence the board.
  residual (the refusal ignores rank) → ported-debts dream

## .h — `AWS_ACCOUNT_ID_FAKE` / `EC2_HOSTNAME_FAKE` (r033 n1)

- **taken:** kept
- **why:** every constant in this repo is SCREAMING_SNAKE (`TERMS_FORBIDDEN`, `DIR_ROLES`,
  `KEYRACK_YML_CONTENT`). an upper-case word inside a constant name is the constant convention,
  not a shouted acronym in prose

## .i — `crew.commit.sponsor` has no `--help` (r036 b1)

- **taken:** a false positive. the wrapper `git.crew.commit.sponsor.sh:90` already answers
  `--help` anywhere in the args, including `set --help`. the lib help was added anyway and snapped

## .j — `svc-reservations` / `svc-forecast` / `svc-reminders` (r003 b1)

- **taken:** kept, as surf-school names
- **why:** they match `rule.forbid.private-business-in-published-roles`'s own demo work (lesson
  reservations, forecasts, reminders). `sandpine/svc-reservations` is already on main in
  `asRadioPushOutput.test.ts`. no ehmpathy repo has these names. `sdk-aws-lambda`, `sdk-config`
  and `declastruct-aws` are public ehmpathy repos (private=false). the private names
  (protools, storefronts, salesladder, simonson, camp-git-backup, dev-env-setup, marketplace-lead)
  are scrubbed and added to `TERMS_FORBIDDEN`

## .k — `git.tree.list` searches one layout (r037)

- **taken:** held (F17)
- **why:** `$HOME/git/*/_worktrees` is the supervisor's ported worktree layout, and the render is
  held as the source draws it

## .l — the size refusal is not reordered (r037 divergence 1)

- **taken:** text fixed (both human paths, the governing rule, no stale grant clause); order kept
- **why:** the `--size-why` gate needs no repo, so it stays first; a held-grant read moved earlier
  so the refusal can say what is still owed

## .m — the 💥 header class is cured where the peer named it, not repo-wide (i004 r008)

- **fork:** qualify all 132 unqualified `💥` lines across both roles' skills, or the sites raised
- **taken:** every crewwork site r008 named, plus the `crew.show`-failed tab line it missed. the
  rest → ported-debts dream row 32, with the census script as the shape
- **why:** most of the 132 were ported verbatim (termwork, grove.auth, grove.keyrack, syncwork,
  ductwork.life) and about 40 snapshots across suites this round never opened pin them. a sweep
  is the smuggled corpus rewrite `rule.prefer.wickup-touched-prose` forbids — dirty
- **rework:** clean, per file

## .n — `__crew_has_ducts` / `__crew_duct_has_role` keep their two-state read (i004 r006)

- **taken:** `git.tree.del`'s probe is cured ([case9]); the two crewwork predicates are held →
  dream row 33
- **why:** both return yes/no and every caller reads that code. a third "host unread" state
  changes the contract of heal, refresh, reboot and show at once — dirty

## .confidence — 80%

## .verdict

open — for the council.
