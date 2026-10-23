## what

ships `phone.text` + `phone.contacts` in the bhuild dispatcher (#491): a crew and its director
exchange plain directed text, both ways, with no pane keystroke. folds the address shape from
#490; #490's synchronous call stays a dream.

| verb | does |
|---|---|
| `rhx phone.text set --to <address> [--to ...] --what <text\|@stdin> [--re <uuid>]` | one QUEUED text per peer; the tree's daemon delivers it over `rhx clone say` |
| `rhx phone.text get [--text <uuid>]` | this clone's thread, in and out, with status and reason |
| `rhx phone.text del --text <uuid>` | withdraw a QUEUED text |
| `rhx phone.contacts get \| set \| del --address <address>` | this seat's contacts; `--address` repeats |
| `rhx phone.contacts.uses get \| allow \| block` | the tree meter on self-managed contacts (human only to change) |
| `rhx phone.daemon get \| set \| del` | the tree's delivery daemon |

address: `phone://grove=<grove>/tree=<tree>/clone=<clone>`, or `@:<clone>` for the own tree.
every text is a file under `.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.text/`, keyed
by seat (the slug, or the serial where a clone has none), so a revived clone keeps its thread and
its contacts (F24, ruled by the director).

## not in this delivery — said plainly

- **contacts at boot are not wired.** out of the box the phone is mute across trees: the meter is
  blocked and contacts are empty. to open a crew to its director, a human runs, from any shell in
  the crew tree, `rhx phone.contacts.uses allow`; then each clone runs
  `rhx phone.contacts set --address <director address>` (F4, dream
  `2026_10_21.phone-contacts-grant-in-crew-boot`)
- **every phone test sits on a fake or stub rhachet boundary.** the in-process tests fake the
  `clone list` / `clone say` sdk; the acceptance journeys drive the built cli against a stub
  rhachet bin. the live two-clone delivery is a byhand playtest, owed by a human (F19)
- **the grove leg** (texts across groves) is refused loud; it rides a later delivery (F13)
- **nine extant `describe.skip` suites outside the phone** (brain + gh.issues lanes, untouched
  since main) stay skipped; to un-skip them needs ci credentials and an llm cost bound across
  three roles (F26, dream `2026_10_22.unskip-extant-brain-and-ghissues-suites`). the phone's own
  suites carry zero skips

## fulcrums ruled by the director

vision-level calls. this route has no blueprint stone, so the director ruled them (2026-10-23):
the lean stands on each. on record for review, not open questions.

- **F5 — at-most-once.** a say rhachet cannot confirm settles FAULTED, a notice goes to the
  sender, never auto-resent. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F5-faulted-at-most-once.md`
- **F6 — the `in` copy.** each delivery writes an `in` copy into the peer tree's mailbox. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F6-in-copy-in-peer-tree.md`
- **F7 — reply admission.** a clone may reply to any clone that texted it, contact or not. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F7-reply-admission.md`
- **F12 — daemon and meter scope.** one daemon and one `phone.contacts.uses` meter per tree;
  texts and contacts per seat. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F12-per-clone-scope.md`
- **F13 — across groves.** refused loud at send; the grove leg rides a later delivery. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F13-grove-leg-deferred.md`
- **F18 — group send.** every peer admitted or none, then one record per peer; a crash mid-write
  may leave part of the group QUEUED. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F18-group-write-per-peer.md`
- **F21 — send vs daemon stop.** a send that races `phone.daemon del` waits for the next send;
  the wake fix is a dream. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F21-daemon-stop-race-deferred.md`
- **F22 — the deferred set.** notice retry, one wedged say, per-tick cost, `get` unbounded, the
  stale flag, layer placement, daemon upgrade + env allowlist: deferred to a dream. `.behavior/v2026_10_21.feat-phone-text/.fulcrums/inventory.of=fulcrums.case=F22-scale-and-retry-deferred.md`

## changes outside the phone (F23)

- `getCliArgs` takes `valueRawKeys`, so `--what ''` and `--what '--x'` read as text
- both vision guards (light + heavy) carry the `has-rendered-stdout` self-review slug, so a new
  vision must render its stdout
- `pnpm-workspace.yaml` patches `rhachet-roles-bhrain@0.42.1`. **tracked follow-up:** pnpm 10
  fails install on a patch that matches no installed version, so the bump past 0.42.1 goes red
  on its own branch until this patch is retired (main stays green on its lockfile)
- blackbox test infra: a stub rhachet bin (`genRhachetStubBin`) with per-clone say verdicts
- the regenerated `.agent/.actors/.../settings.of.repo.json` is left out of this pr, per the
  director

## verified

- types, lint, format, build
- unit, integration, acceptance: see the 5.3 verification yield in
  `.behavior/v2026_10_21.feat-phone-text/`
- the route: `.behavior/v2026_10_21.feat-phone-text/` (vision, experience catalog, fulcrums,
  reviews)
