# pr draft

## title

fix(roles): clamp each director-seat boot to a budget; supervisor and prioritizer under 10k

## body

### before / after — `npx rhachet roles cost --all`

every row compares what a seat is handed, before and after: behaver as a linked seat renders it,
the rest as the build ships them (`dist/`, which `src/` now equals).

| boot spec | before (shipped) | after (shipped) | budget |
|---|---|---|---|
| behaver (linked) | 2,601 | **2,105** (−19%) | 2,200 |
| supervisor | 32,482 | **9,865** (−70%) | 10,000 |
| prioritizer | 7,728 | **5,397** (−30%) | 5,500 |
| decomposer | 426 | 426 (roster only; no seat-visible change) | 500 |
| dispatcher | 365 | 365 | — (inert; listed) |
| dreamer | 244 | 244 | — (inert; listed) |

**why not ≤ 1.5k for behaver:** the wish's 1.5k was a proposal "to settle with evidence"; the
boot that keeps both cues word for word measures 2,105 linked. a measured ~1,700 variant swaps 21
stage-curated `ref` entries for one brace-compressed catalog line each; it is still over 1.5k, and
only a cut of the cue itself reaches 1.5k, the one lever the wish forbids. the choice between
2,105 and ~1,700 is open for the council (F1).

`roles cost --all` on main read the src rows higher (supervisor 33,973 · prioritizer 7,825 ·
decomposer 681), because src then held tests and logs the build never ships; the `not:` entries
make src read what a seat is handed.

each budget is the boot's shipped cost, rounded up to the next 100. the 10k cap on supervisor and
prioritizer is not in `0.wish.md`: the commander ordered it mid-route ("superviser should take no
more than 10k tokens; same with prioritizer"), and it widened this pr from behaver alone to a
rewrite of those two boots. supervisor's linked render sits at ~99.9% of it, so the next brief it
says needs a cut or a raise.

### what changed

- `behaver/boot.yml` declares `budget: tokens: 2_200` (2,105 measured, linked).
- `rule.require.experience-catalog-evolution` keeps its cue at `say`; its argument moves to the
  adjacent `rule.require.experience-catalog-evolution.reason.md`, booted at `ref`. no rule deleted,
  no sense changed.
- `supervisor` boots under 10k:
  - each of its 23 said briefs boots as a `.md.min` cue; the full `.md` stays beside it;
  - every unsaid brief leaves the roster via a `not:` per directory, and
    `briefs/catalog.of=supervisor.briefs.md` names each one;
  - the skills roster leaves the boot; the readme names every verb family, and the
    `git.crew.send` flag contract now rides in the entool cue;
  - the readme fixture census moved to `briefs/tools/ref.fixture-corpus-census.md`.
- `prioritizer` boots its three said rules as `.md.min` cues, and drops its tests and library from
  the roster.
- `decomposer` drops its tests and fixture repos from the roster, so `roles cost` on src reads
  what a seat is handed.
- `dispatcher` and `dreamer` boot no director seat today; the clamp lists them as inert and
  asserts they ship no briefs.
- clamp, `roleArtifacts.integration.test.ts`:
  - [case5] every booted role declares a budget; each src boot and each linked copy, filtered to
    what the build ships, exits 0 under it; each role's manifest and full said payload are
    snapped, so a cut or a reword of any cue shows as a changed line; a copy forced over budget
    halts with exit 2 and names a repro the author can run;
  - [case6] every budget shape, fix, drift arm, the ship filter, and a boot the harness killed, on
    its own;
  - [case5] every said entry renders as a said brief (a `not:` glob that swallows a cue turns it
    red), and the supervisor and prioritizer boots still say each claim a `.md.min` condense must
    keep; a role that halts over budget goes red on the exit check alone;
  - [case4] every glob entry keeps its base dir, and each name a `!(…)` exclusion lists is still on
    disk;
  - [case7] the supervisor catalog names every unsaid brief on disk, and no other;
  - [case8] the supervisor readme's verb counts match `skills/*.sh`.
  - each full `.md` whose `.md.min` boots carries a banner: an edit there changes no boot until
    the `.min` carries it too.
  - run it locally: `rhx git.repo.test --what integration --scope path://roleArtifacts --mode apply`
    — a brief or boot.yml edit imports no module, so `--changedSince` alone skips it.
- `supervisor/skills/work/work.harness.ts`: a bash driver the harness timeout killed came back as
  `exit 1`, the shape of a real ductwork fault — 4 reds in `ductwork.verbs` under a full-suite
  load. a kill now throws a `MalfunctionError` that names the signal, the bound, and both streams;
  the bound is 60s, under the 90s hook. clamped in the new `work.harness.integration.test.ts`
  (red with the old `?? 1`, green with the fix); the `suitesPorted` census moves 23 → 24.
- `.depcheckrc.yml` ignores the tracked `.claude` symlink, which reached the actor cache past the
  `.agent` ignore.
- `rhachet-roles-ehmpathy` 1.39.5 → 1.39.7 (routine bump).
- `rhachet` → `github:ehmpathy/rhachet#1d747fd` (main, rhachet#636: a work clone may spawn at any
  depth), pinned by sha, so the l3 enroll lanes on the execution guard can run. **this git pin
  retires when rhachet v1.50.1 releases** — swap it for that version then. the re-lock also moved
  `with-simple-cache` 0.15.1 → 0.17.3 (a transitive of rhachet main).

### fulcrums — best-guessed, clean rework

| case | call | confidence |
|---|---|---|
| F1 | behaver budget 2,200, not ≤ 1.5k: the dense cut lands at 2,105 without a cue cut | 70% |
| F2 | argument in an adjacent `.reason.md` at ref | 80% |
| F3 | clamp boots src + a temp linked copy, each filtered to what the build ships | 75% |
| F4 | director-seat roles = the three with a boot; dispatcher + dreamer inert | 80% |
| F5 | a clamp test is in scope though the wish names none | 85% |
| F6 | three experience-coverage findings disputed as misreads | 95% |
| F7 | `rhachet` git pin until v1.50.1, by the efficiency seat's order | 90% |
| F8 | supervisor + prioritizer under 10k via `.md.min`, `not:`, a catalog; the glossary `never` column left the boot | 80% |
| F9 | the depcheck `.claude` ignore and the routine ehmpathy bump ride in this pr | 85% |
| F10 | the clamp stays one test file | 80% |
| F11 | the pre-extant skipped suites stay as they are on main — **ruled out of scope by the director** (see known gap below) | 75% |
| F12 | the `work.harness` timeout fix rides in this pr, with its clamp | 85% |

### known gap — F11, out of scope

9 test files skip on main, so their external contracts have no real-call test that runs: the gh
issues api × 2 (`BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN` is absent from the keyrack) and the real
`claude` binary × 7 (5 `skill.review.*` acceptance suites, 2 brain integration suites; ci does not
install the binary). they were skipped before this pr, and this pr touches none of them. two 5.3
reviewers graded them blockers under `rule.require.external-contract-integration-tests`; the
director ruled them out of this pr's scope — no waiver, no vision edit. a skipped main is still a
defect, so the cure is caught for its own tree:
`.dream/v2026_10_22.fix-unskip-external-contract-suites-on-main.md`.

one concession graded `urgent`: a said cue that a `not:` glob swallowed boots nowhere, with no
error (behavioral harm) — fixed and clamped in [case5]. all others graded `better`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
