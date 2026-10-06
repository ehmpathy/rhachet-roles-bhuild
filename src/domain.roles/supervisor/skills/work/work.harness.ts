/**
 * .what = the test harness for the `*work` shell libs
 *
 * .why  = these libs are bash, and the two things worth a clamp sit at two
 *         very different grains:
 *
 *           crewwork  — owns an ORDER and a set of ARGS. it calls duct.* and
 *                       term.* and does naught else. so it is clamped with
 *                       FAKES: no tmux, no kitty, no display. pure and fast.
 *
 *           ductwork  — owns the tmux mechanism itself. a fake would prove
 *                       only the fake, so it is clamped against REAL tmux —
 *                       on a PRIVATE server, so a test can never reach the
 *                       live fleet (see DUCTWORK_TMUX_SOCKET).
 *
 * .how  = each helper writes a bash driver to a temp dir, runs it, and hands
 *         back stdout + exit code. the crew driver additionally redefines the
 *         lower verbs as RECORDERS that append one line per call to a log
 *         file, so a test can assert what was called, with which args, and —
 *         the part that matters most — in which ORDER.
 *
 * .note = the recorders MUST be defined AFTER crewwork.sh is sourced. crewwork
 *         sources its peers at source-time and unconditionally (on purpose —
 *         see __crew_load_peers), so a fake defined first would be overwritten
 *         by the real one.
 *
 * .note = the log is a FILE, not a variable, because crewwork pipes each call
 *         into sed. a pipe puts the function in a subshell, so a variable set
 *         there would never reach the parent. a file append crosses that line.
 */
import { execFileSync, spawnSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// 🔴 the role-NEUTRAL half of this harness, lifted to the common ancestor at
//    i003. a temp dir is not supervisor vocabulary, and while it lived here a
//    prioritizer suite had to reach into this module to get one — a scope leak
//    across the very seam this lift exists to draw
//    (rule.prefer.most-common-denominator)
import { tempDirs } from '../../../.test/tempDirs';

export const DIR_WORK = __dirname;
export const PATH_CREWWORK = join(DIR_WORK, 'crewwork.sh');
export const PATH_DUCTWORK = join(DIR_WORK, 'ductwork.sh');
export const PATH_TERMWORK = join(DIR_WORK, 'termwork.sh');

// ---------------------------------------------------------------------------
// the failure allowlists — what a step may swallow, and naught else
// ---------------------------------------------------------------------------
//
// 🔴 .why = every teardown and probe below converges on a declared state, so
//    each has exactly one failure that means "already there". a bare `catch {}`
//    swallows that one AND every real fault beside it, which is the defect
//    `rule.forbid.failhide` names: the real error reaches no one and costs
//    debug hours instead.
//
//    two of these probes are the sharpest case, and they refute themselves in
//    their own doc comments. `getTmuxSessions` and `getPaneText` each cite
//    term=false-report._.choice._.md as the whole reason they exist — an
//    independent witness, so a clamp never asks one instrument about itself.
//    yet a bare catch made an ABSENT tmux binary report "no sessions" and "no
//    text": a truthful answer about the wrong subject, which is that brief's
//    exact defect class, inside the function written to prevent it.
//
// .note = the idiom is not new here. `isPidAlive` already discriminates on
//    `error.code` to tell "exited" from "alive, not ours to signal". this
//    lifts that one local habit to every site that owes it.

/** .what = the error an ALREADY-ABSENT path throws — and only that one */
const isErrPathAbsent = (error: unknown): boolean =>
  (error as { code?: string } | null)?.code === 'ENOENT';

/**
 * .what = the error a process that is gone, or never ours, throws
 * .why  = ESRCH says it exited. EPERM says it is alive under another uid, which
 *         a prefix-matched reap can legitimately meet after a pid recycle.
 *         both leave the goal state reached; every other code is a real fault.
 */
const isErrProcAbsent = (error: unknown): boolean =>
  ['ESRCH', 'EPERM'].includes((error as { code?: string } | null)?.code ?? '');

/**
 * .what = the error /proc throws for a pid that cannot be read
 * .why  = a scan walks a directory that mutates under it, so ENOENT/ESRCH mean
 *         "it exited mid-scan" and EACCES means "not ours to read". on each,
 *         the scan stays correct when it skips that one entry.
 */
const isErrProcUnreadable = (error: unknown): boolean =>
  ['ENOENT', 'ESRCH', 'EACCES'].includes(
    (error as { code?: string } | null)?.code ?? '',
  );

/**
 * .what = did the child RUN and exit non-zero, rather than fail to spawn?
 * .why  = 🔴 the discriminator this file most needs. `tmux list-sessions` exits
 *         1 when no server is up — a truthful "none", safe to read as empty.
 *         an ABSENT tmux binary never runs at all: it fails to spawn, with
 *         `status === null` and `code === 'ENOENT'`. to read THAT as "no
 *         sessions" is the false report above. a numeric `status` is the one
 *         signal that separates them.
 */
const isErrChildExited = (error: unknown): boolean =>
  typeof (error as { status?: unknown } | null)?.status === 'number';

/**
 * .what = the outcome of one bash driver run
 */
export interface RunResult {
  stdout: string;
  stderr: string;
  exit: number;
  /** one entry per faked call, in the order they happened */
  calls: string[];
}

const runDriver = (input: {
  body: string;
  dir: string;
  env: Record<string, string>;
  pathLog: string | null;
}): RunResult => {
  const pathDriver = join(input.dir, 'driver.sh');
  writeFileSync(pathDriver, input.body, { mode: 0o755 });

  // .why spawnSync, not execFileSync: execFileSync returns ONLY stdout on the
  //      success path and hands stderr back solely via the thrown error. our
  //      driver always exits 0 (it echoes an exit sentinel), so every run took
  //      the success path and stderr came back EMPTY — which is exactly the
  //      shape of a duct with nothing on stderr. the harness reported an
  //      absent stream as an empty one, in its ordinary success format: a
  //      false report, in the instrument built to catch them
  //      (term=false-report._.choice._.md). spawnSync always returns both.
  const spawned = spawnSync('bash', [pathDriver], {
    encoding: 'utf8',
    env: { ...process.env, ...input.env },
    timeout: 30_000,
  });

  const stdout = spawned.stdout ?? '';
  const stderr = spawned.stderr ?? '';
  const exit = spawned.status ?? 1;

  const calls =
    input.pathLog && existsSync(input.pathLog)
      ? readFileSync(input.pathLog, 'utf8').split('\n').filter(Boolean)
      : [];

  return { stdout, stderr, exit, calls };
};

/**
 * .what = run a crewwork verb with every lower verb FAKED
 *
 * .why  = crewwork's whole job is the ORDER and the ARGS. a fake records both
 *         perfectly and needs no substrate, so these clamps run anywhere — no
 *         tmux, no kitty, no display, no live fleet within reach.
 *
 * @param input.command   the crewwork call to make, e.g. `crew.boot --tree t`
 * @param input.gitRoot   what CREWWORK_GIT_ROOT points at
 * @param input.sessions  what __duct_list_host_sessions reports
 * @param input.rcs       force a non-zero rc out of a named fake
 * @param input.groveTreeDir  what the grove reports as the tree's dir; absent
 *                            means the grove holds no such tree (or is down),
 *                            which is the arm that must refuse rather than
 *                            open a duct in the ssh login dir
 */
export const runCrew = (input: {
  command: string;
  gitRoot?: string;
  sessions?: string[];
  groveTreeDir?: string;
  paneText?: string;
  /**
   * .what = ledger rows to seed, before the command runs
   * .why  = the ledger is what a crew verb reads to learn WHICH BOX a tree
   *         sits on, so an arm that derives its grove is unclampable without
   *         a way to state that row. keyed by canonical (dotted) tree name,
   *         exactly as __crew_ledger_set writes it.
   */
  ledger?: { tree: string; grove: string }[];
  /**
   * .what = duct-registry rows to seed, before the command runs
   * .why  = the registry is the ONLY per-seat, per-HOST record in the fleet.
   *         the ledger holds one grove for a whole tree, so a crew that spans
   *         two boxes — a grove tree with LOCAL reviewer seats, per
   *         define.usecase.review-a-grove-tree-locally — is invisible to every
   *         ledger-derived teardown. an arm that sweeps that residue is
   *         unclampable without a way to state those rows.
   *
   *   .note the file layout mirrors __duct_register_duct exactly:
   *         $DUCTWORK_DIR/ducts/<tree>/<role>.json, `.host` empty for local.
   */
  ducts?: { tree: string; role: string; host: string }[];
  /**
   * .what = what the grove says it is FOR — `work` (default) or `lab`
   * .why  = a boot onto a grove is gated on the grove's purpose: a `lab` grove
   *         is tagged deletable in ec2, so a worktree booted there is thrown
   *         away with the box. the real read is an ssh to the grove's own
   *         `~/.grove/purpose` marker, which a fabricated `grove-1` cannot
   *         answer — so the harness declares it instead.
   *
   *         defaulted to `work` so every extant cloud clamp keeps its subject;
   *         set it to `lab` to clamp the REFUSAL.
   */
  grovePurpose?: string;
  rcs?: Partial<{
    ductOpen: number;
    ductStop: number;
    ductRead: number;
    termOpen: number;
    termStop: number;
  }>;
}): RunResult => {
  const dir = tempDirs.genOne({ slug: 'crew' });
  const pathLog = join(dir, 'calls.log');

  // .what = a PRIVATE ledger, seeded per run
  //
  // .why  = crewwork defaults CREWWORK_DIR to $HOME/.crewwork, so a verb that
  //         reads the ledger reaches the OPERATOR'S real crews unless this seam
  //         is set. that is ambient state inside a hermetic test, and it cuts
  //         both ways: a real row could steer a clamp, and a clamp could write
  //         over a live crew's row (rule.require.hermetic-tests).
  //
  //   .note it is set unconditionally, never only when `ledger` is given — an
  //         empty dir is itself the assertion that no row exists, and a seam
  //         wired only for the tests that opt in leaves every other test still
  //         pointed at $HOME.
  const dirCrewwork = join(dir, 'crewwork');
  const dirLedger = join(dirCrewwork, 'crews');
  mkdirSync(dirLedger, { recursive: true });
  for (const row of input.ledger ?? []) {
    writeFileSync(
      join(dirLedger, `${row.tree}.json`),
      JSON.stringify({
        tree: row.tree,
        grove: row.grove,
        roles: 'mechanic,foreman',
        bootedFirst: 0,
        bootedLast: 0,
      }),
    );
  }

  // .what = a PRIVATE duct registry, seeded per run
  //
  // .why  = same seam, same hazard as the ledger one above, one layer over:
  //         ductwork defaults DUCTWORK_DIR to $HOME/.ductwork, so a crew verb
  //         that enumerates registered seats reaches the OPERATOR'S live ducts.
  //         a clamp would then read a fleet it did not build, and — worse — a
  //         sweep arm would try to tear those real seats down.
  //
  //   .note set unconditionally, for the reason the ledger's note already
  //         gives: an empty dir IS the assertion that no seat is registered,
  //         and a seam wired only for the tests that opt in leaves every other
  //         test still pointed at $HOME.
  const dirDuctwork = join(dir, 'ductwork');
  mkdirSync(join(dirDuctwork, 'ducts'), { recursive: true });
  for (const row of input.ducts ?? []) {
    const dirSeat = join(dirDuctwork, 'ducts', row.tree);
    mkdirSync(dirSeat, { recursive: true });
    writeFileSync(
      join(dirSeat, `${row.role}.json`),
      JSON.stringify({ host: row.host, createdAt: 0 }),
    );
  }

  // .note = the recorders come AFTER the source, on purpose. see the file header.
  const body = [
    'set -uo pipefail',
    `source '${PATH_CREWWORK}'`,
    '',
    '__rec() { printf "%s\\n" "$*" >> "$CREW_TEST_LOG"; }',
    '',
    'duct.open() { __rec "duct.open $*"; echo "(fake duct.open)"; return ${RC_DUCT_OPEN:-0}; }',
    // .why this fake UNREGISTERS, where every peer merely records: the real
    //      duct.stop drops the registry row, and an arm that VERIFIES its own
    //      teardown reads that registry back. a fake that only records leaves
    //      residue in place forever, so the clean-sweep verdict is unreachable
    //      and the only clampable arm is the failure one — which would clamp
    //      the tool into a permanent leftover report.
    //
    //      the uri shapes are `duct://<host>/<tree>/<role>` and
    //      `duct:///<tree>/<role>`; one `#*/` after the scheme yields
    //      `<tree>/<role>` from both.
    'duct.stop() { __rec "duct.stop $*"; ' +
      'echo "(fake duct.stop)"; ' +
      'local __rc=${RC_DUCT_STOP:-0}; [[ $__rc -eq 0 ]] || return $__rc; ' +
      'local __u="${2:-}"; local __s="${__u#duct://}"; __s="${__s#*/}"; ' +
      '[[ -n "$__s" ]] && rm -f "$DUCTWORK_DIR/ducts/$__s.json" 2>/dev/null; ' +
      'return 0; }',
    'duct.send() { __rec "duct.send $*"; echo "(fake duct.send)"; return 0; }',
    // .why FAKED with a settable BODY and a settable RC: the resume arm reads
    //      a pane to learn whether claude drew its session picker, and its
    //      three verdicts (picker drew · no picker · could not look) are told
    //      apart ONLY by that body and that rc. a fake with a fixed body makes
    //      two of the three unreachable, and a fake that always succeeds makes
    //      the could-not-look arm unclampable — which is the arm that exists
    //      because a swallowed read error once read as "no picker".
    'duct.read() { __rec "duct.read $*"; ' +
      'return_rc=${RC_DUCT_READ:-0}; [[ $return_rc -eq 0 ]] || return $return_rc; ' +
      'printf "%s\\n" "$FAKE_PANE_TEXT"; }',
    'term.open() { __rec "term.open $*"; echo "(fake term.open)"; return ${RC_TERM_OPEN:-0}; }',
    'term.stop() { __rec "term.stop $*"; echo "(fake term.stop)"; return ${RC_TERM_STOP:-0}; }',
    // .why RECORDED, not merely faked: the real one runs `ssh $host tmux ls`,
    //      so the HOST it is handed is the whole of what the caller owes. a
    //      fake that swallows that arg makes the cloud arm unclampable — the
    //      verdict reads identical whether crewwork asked the grove or asked
    //      this box, which is exactly the local-check-on-a-remote-subject
    //      family this suite exists to catch.
    '__duct_list_host_sessions() { __rec "__duct_list_host_sessions $*"; ' +
      'local s; for s in $FAKE_SESSIONS; do printf "%s\\n" "$s"; done; }',
    // .why FAKED, like every other lower verb: the real one runs `ssh $host`.
    //      left real, a `--grove cloud://grove-1` clamp opens a NETWORK
    //      connection to whatever that alias means on the operator's box — so
    //      it fails on a laptop with no such alias, and on one that HAS a
    //      grove-1 it would reach a live machine. either way the verdict is a
    //      property of the operator's ssh config rather than of crewwork
    //      (rule.require.hermetic-tests, rule.forbid.bare-host-deps).
    //
    //      it is recorded like the rest, so a clamp can assert crewwork asked
    //      the right host for the right slug — which is the whole of what this
    //      layer owes. whether ssh itself carries `-n` is [case21]'s subject,
    //      read from source, and needs no live socket either.
    '__crew_tree_dir_on_grove() { __rec "__crew_tree_dir_on_grove $*"; ' +
      '[[ -n "${FAKE_GROVE_TREE_DIR:-}" ]] || return 1; ' +
      'printf "%s\\n" "$FAKE_GROVE_TREE_DIR"; }',
    '',
    input.command,
    'echo "__EXIT__=$?"',
  ].join('\n');

  const result = runDriver({
    body,
    dir,
    pathLog,
    env: {
      CREW_TEST_LOG: pathLog,
      CREWWORK_DIR: dirCrewwork,
      DUCTWORK_DIR: dirDuctwork,
      CREWWORK_GIT_ROOT: input.gitRoot ?? join(dir, 'no-such-root'),
      FAKE_SESSIONS: (input.sessions ?? []).join(' '),
      FAKE_GROVE_TREE_DIR: input.groveTreeDir ?? '',
      CREWWORK_GROVE_PURPOSE: input.grovePurpose ?? 'work',
      // .why '': hermetic — a list exported in the caller's shell must not
      //      leak into the refusal text a clamp reads
      CREWWORK_GROVES_BOOTABLE: '',
      FAKE_PANE_TEXT: input.paneText ?? '(fake pane, no picker)',
      // .why 0: the resume arm polls 6× at 1s. left real, every resume clamp
      //      pays ~6s of dead sleep — most of this suite's runtime, and a wait
      //      no assertion here depends on (rule.require.fast-tests).
      CREW_RESUME_POLL_SECS: '0',
      RC_DUCT_OPEN: String(input.rcs?.ductOpen ?? 0),
      RC_DUCT_READ: String(input.rcs?.ductRead ?? 0),
      RC_DUCT_STOP: String(input.rcs?.ductStop ?? 0),
      RC_TERM_OPEN: String(input.rcs?.termOpen ?? 0),
      RC_TERM_STOP: String(input.rcs?.termStop ?? 0),
    },
  });

  // the verb runs inside the driver, so its exit rides out in a sentinel
  const marker = result.stdout.match(/__EXIT__=(\d+)/);
  return { ...result, exit: marker ? Number(marker[1]) : result.exit };
};

/**
 * .what = run raw ductwork against a PRIVATE tmux server and a temp registry
 *
 * .why  = ductwork owns the tmux mechanism, so a fake would prove only the
 *         fake. these clamps use real tmux — and the two seams below are what
 *         make that safe:
 *
 *           DUCTWORK_TMUX_SOCKET  — a private server, its own session namespace
 *           DUCTWORK_DIR          — a temp registry, no live rows in reach
 *
 *         without both, a test that created `main/mechanic` would collide with
 *         a real duct of that name, and its teardown would end real work.
 */
export const runDuct = (input: {
  body: string;
  socket: string;
  ductworkDir: string;
}): RunResult => {
  const dir = tempDirs.genOne({ slug: 'duct' });
  const body = [
    'set -uo pipefail',
    // ⚠️ the pane must NOT run the operator's interactive rc.
    //
    // .why = a duct's pane inherits DUCTWORK_TMUX_SOCKET, so whatever its
    //        shell does at startup happens INSIDE this test's private server.
    //        the operator's own rc auto-opens a duct, and it did exactly that
    //        here: a `pt5prove/mechanic` session appeared on a test socket
    //        AFTER its teardown had provably emptied it. the argv named the
    //        culprit outright —
    //          tmux -S .../ductwork-test-send-… new-session -d -s pt5prove/mechanic
    //
    //        that is ambient state inside a hermetic test, and it would have
    //        read as a ductwork defect forever (rule.require.hermetic-tests).
    //        `sh` reads no ~/.bashrc, so the pane starts from a clean slate.
    "export SHELL='/bin/sh'",
    `export DUCTWORK_DIR='${input.ductworkDir}'`,
    `export DUCTWORK_TMUX_SOCKET='${input.socket}'`,
    `source '${PATH_DUCTWORK}'`,
    '',
    input.body,
  ].join('\n');
  return runDriver({ body, dir, pathLog: null, env: {} });
};

/**
 * .what = where tmux keeps the socket for a `-L <name>` server
 * .why  = teardown has to unlink the socket FILE, and tmux derives that path
 *         rather than take it: $TMUX_TMPDIR (or /tmp) + /tmux-<uid>/<name>
 */
export const getSocketPath = (input: { socket: string }): string =>
  join(
    process.env.TMUX_TMPDIR || '/tmp',
    `tmux-${typeof process.getuid === 'function' ? process.getuid() : 0}`,
    input.socket,
  );

/**
 * .what = does a tmux SERVER answer on this socket, right now?
 *
 * .why  = the subject of a teardown is the SERVER, never its socket file. the
 *         file is a proxy — tmux unlinks it EARLY in shutdown, so an absent
 *         file is compatible with a server that is very much still up.
 *
 * .note = a bare exit code cannot answer this, and a draft that read one got
 *         it backwards. `list-sessions` exits non-zero in TWO different
 *         worlds: "no server answers here" and "a server is up here, with
 *         zero sessions". only the second means up, so the DEFAULT is down
 *         and only tmux's own `no sessions` wording overrides it. that way an
 *         unfamiliar connect-failure message reads as down, which is the safe
 *         side: at worst we sleep a beat longer than needed.
 */
export const hasTmuxServer = (input: { socket: string }): boolean => {
  const probe = spawnSync(
    'tmux',
    ['-L', input.socket, 'list-sessions', '-F', '#{session_name}'],
    { encoding: 'utf8', timeout: 10_000 },
  );
  if (probe.status === 0) return true; // it answered, with sessions
  return /no sessions/i.test(probe.stderr || ''); // up, but empty
};

/**
 * .what = tear down a private tmux server AND unlink its socket file
 *
 * .why  = a kill-server ends the server, and on an abrupt exit tmux can leave
 *         the socket file behind. one stale file per case per run adds up
 *         fast — 6 runs of this suite left 43 of them in a shared /tmp. a
 *         test suite that litters a shared directory is a test suite nobody
 *         wants to run often.
 *
 * .note = it only ever touches a path it was handed, and every caller derives
 *         that from genSocket (prefixed, pid-scoped, random-suffixed). the
 *         default server has no such name, so it is unreachable from here.
 */
export const delTmuxServer = (input: { socket: string }): void => {
  try {
    execFileSync('tmux', ['-L', input.socket, 'kill-server'], {
      stdio: 'ignore',
      timeout: 10_000,
    });
  } catch (error) {
    // already down — tmux exits non-zero on a kill-server with no server, and
    // that IS the goal state. an absent tmux binary is not, and surfaces.
    if (!isErrChildExited(error)) throw error;
  }

  // .why we poll the SERVER, never the socket FILE:
  //      kill-server returns the moment the server ACKNOWLEDGES it, not once
  //      it is down. an earlier draft polled `existsSync(path)` and left its
  //      loop on the first turn — because tmux unlinks the socket EARLY in
  //      shutdown, well before the server exits. so that draft removed no
  //      file at all and gave up its poll while the server still ran, and the
  //      socket then reappeared after the jest process itself had exited.
  //
  //      the file is a PROXY for the server. to grade the server from its
  //      file is exactly the category error term=false-report._.choice._.md
  //      names. so ask the SERVER — through the one predicate the clamps use
  //      too, so a teardown and its clamp can never disagree on what "up"
  //      means.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!hasTmuxServer({ socket: input.socket })) break;
    // .note = no catch. a `sleep 0.05` that fails, or that trips a 5s timeout,
    //         has no expected failure to allowlist — it says the machine is in
    //         a state this harness cannot reason about, and the loop is bounded
    //         at 40 turns, so a swallow buys no safety and only hides that.
    execFileSync('sleep', ['0.05'], { stdio: 'ignore', timeout: 5_000 });
  }

  // ⚠️ ONLY unlink once the server is proven down.
  //
  // .why = an unconditional rmSync here is a LIE-MAKER. tmux reaches a server
  //        through its socket path, so to unlink the path of a LIVE server
  //        does not stop it — it hides it. the process keeps its sessions and
  //        its pane children, and no caller can reach it again, not even to
  //        kill it. the directory then reads clean while the machine carries
  //        an orphan.
  //
  //        that is a false report we would have MANUFACTURED ourselves: an
  //        instrument (`hasTmuxServer`) that reads reachability, fed by a
  //        teardown that destroys reachability. proven live: with kill-server
  //        neutered, every clamp still passed — because the unlink had made
  //        the surviving servers unreachable, and unreachable reads as down.
  //
  // .note = a polite kill does NOT always take, so we CONVERGE on the process
  //         table rather than trust one kill. the send case reproducibly left
  //         TWO live processes behind whose socket had ALREADY gone
  //         unreachable — `up: false`, `pids: [529038, 529042]`.
  //
  //         that pair is why this reap is unconditional rather than gated on
  //         `hasTmuxServer`. an earlier draft gated it, and the gate read the
  //         one instrument that had already been shown to lie in exactly this
  //         state: reachability. an unreachable server is not a dead one, so
  //         a teardown that stops at "unreachable" leaves an orphan it cannot
  //         even see. the process table is the ground truth here; ask it.
  //
  //         safe by construction — the reap matches on this socket's own
  //         name, which carries a prefix the default server can never have.
  delStaleTestServers({ socket: input.socket });

  // .note = `force: true` absorbs an absent path on its own, so the catch that
  //         stood here could only swallow a real fault. see the allowlists.
  rmSync(getSocketPath({ socket: input.socket }), { force: true });
};

/**
 * .what = kill any tmux server left over from a test socket, by PROCESS
 *
 * .why  = a socket sweep cannot see an orphan whose socket is already gone,
 *         and that is exactly the orphan worth reaping: unreachable by tmux,
 *         invisible in the socket dir, alive with a shell in its pane.
 *
 *         so this reads /proc rather than the socket dir — the process table
 *         is the one witness that survives an unlinked socket.
 *
 * .note = it kills ONLY a process whose argv carries PREFIX_TEST_SOCKET. the
 *         live fleet runs on tmux's DEFAULT socket, whose argv carries no -L
 *         at all, so it is unreachable from here by construction.
 */
export const getTestServerPids = (input?: { socket?: string }): number[] => {
  // the narrowest match that still cannot reach the default server: a caller
  // may aim at ONE socket, and absent that we take every test socket.
  const needle = input?.socket ?? PREFIX_TEST_SOCKET;
  if (!needle.startsWith(PREFIX_TEST_SOCKET))
    throw new Error(
      `the test-server scan refuses a socket outside the test prefix: ${needle}`,
    );

  const pids: number[] = [];
  for (const entry of readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    let argv = '';
    try {
      argv = readFileSync(`/proc/${entry}/cmdline`, 'utf8');
    } catch (error) {
      // it exited mid-scan, or is not ours to read — skip that one entry
      if (!isErrProcUnreadable(error)) throw error;
      continue;
    }
    if (argv.includes(needle)) pids.push(Number(entry));
  }
  return pids;
};

/**
 * .what = the same scan, with each process's ARGV alongside its pid
 *
 * .why  = a pid names a survivor; an argv names its CREATOR. when a server
 *         turned up on a socket that a teardown had provably emptied, a bare
 *         pid could only say "one is here" — the argv is what can say which
 *         command spawned it, and so where to aim the repair.
 */
export const getTestServerProcs = (input?: {
  socket?: string;
}): { pid: number; argv: string }[] =>
  getTestServerPids(input).map((pid) => {
    try {
      return {
        pid,
        argv: readFileSync(`/proc/${pid}/cmdline`, 'utf8')
          .split('\0')
          .join(' '),
      };
    } catch (error) {
      if (!isErrProcUnreadable(error)) throw error;
      return { pid, argv: '(exited mid-scan)' };
    }
  });

/**
 * .what = the pid of the run that OWNS a test server, read off its argv
 *
 * .why  = every test socket embeds the pid that made it
 *         (`ductwork-test-<slug>-<pid>-<rand>`), so the process table can say
 *         whose server this is — the same read delStaleTestSockets makes of a
 *         socket file's name. null when the argv names no such socket.
 */
const getTestServerOwnerPid = (input: { argv: string }): number | null => {
  const found = /ductwork-test-[^\0\s/]*-(\d+)-[a-z0-9]+/.exec(input.argv);
  return found ? Number(found[1]) : null;
};

/**
 * .what = SIGKILL test tmux servers — one socket's, or every STALE one
 *
 * .why  = aimed at one socket, this is a teardown: the caller owns that server
 *         and wants it gone, live owner or not.
 *
 *         unaimed, it is a litter sweep, and a litter sweep must spare a live
 *         run's servers. 🔴 it once killed every test server on the box,
 *         whoever owned it — harmless while one suite held every tmux case,
 *         and a mid-case kill the moment that suite was cut into parts that
 *         jest runs in parallel: each part's beforeAll reaped its peers' live
 *         servers, and a send read back an empty pane. so it spares a server
 *         whose owner pid still runs, exactly as delStaleTestSockets spares a
 *         live socket.
 */
export const delStaleTestServers = (input?: { socket?: string }): number => {
  let reaped = 0;
  const pids = getTestServerProcs(input)
    .filter((proc) => {
      // aimed at one socket = a teardown; the caller owns it, so it goes
      if (input?.socket) return true;

      // unaimed = a litter sweep; a server whose owner still runs is not litter
      const owner = getTestServerOwnerPid({ argv: proc.argv });
      return owner === null || !isPidAlive(owner);
    })
    .map((proc) => proc.pid);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
      reaped += 1;
    } catch (error) {
      // ESRCH = gone already · EPERM = alive, not ours to signal. both leave
      // the goal state reached; every other code is a real fault.
      if (!isErrProcAbsent(error)) throw error;
    }
  }
  return reaped;
};

/** the one prefix every test socket carries, and the only one we ever remove */
export const PREFIX_TEST_SOCKET = 'ductwork-test-';

/** .what = is this pid a live process? */
const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: any) {
    return error?.code === 'EPERM'; // alive, just not ours to signal
  }
};

/**
 * .what = sweep test sockets left behind by a run that did not tear down
 *
 * .why  = a crashed or killed run leaves its socket file in a SHARED /tmp,
 *         and they accumulate — 6 runs of this suite once left 43. a suite
 *         that litters a shared directory is one nobody wants to run often.
 *
 * .the safety, which is the whole design:
 *   - it only ever considers files under the tmux socket dir whose name
 *     starts with `ductwork-test-`. the default server is named `default`,
 *     so it is not merely unlikely to be hit — it is unreachable.
 *   - every test socket embeds the pid that made it. a socket whose pid is
 *     STILL ALIVE belongs to a run in flight, possibly a parallel jest
 *     worker, so it is left alone.
 */
export const delStaleTestSockets = (): void => {
  const dir = join(
    process.env.TMUX_TMPDIR || '/tmp',
    `tmux-${typeof process.getuid === 'function' ? process.getuid() : 0}`,
  );
  if (!existsSync(dir)) return;

  for (const name of readdirSync(dir)) {
    if (!name.startsWith(PREFIX_TEST_SOCKET)) continue;

    // ductwork-test-<slug>-<pid>-<rand>
    const parts = name.split('-');
    const pid = Number(parts[parts.length - 2]);
    if (Number.isFinite(pid) && isPidAlive(pid)) continue;

    try {
      execFileSync('tmux', ['-L', name, 'kill-server'], {
        stdio: 'ignore',
        timeout: 5_000,
      });
    } catch (error) {
      // no server behind it — the file is all that was left
      if (!isErrChildExited(error)) throw error;
    }
    // .note = `force: true` already absorbs an absent path, so a catch here
    //         could only ever swallow a REAL fault (EPERM, EBUSY) — each of
    //         which says the file is still THERE, the opposite of the goal.
    rmSync(join(dir, name), { force: true });
  }
};

/**
 * .what = list the sessions a named tmux server holds, from OUTSIDE ductwork
 * .why  = a clamp on hermeticity must not ask ductwork whether ductwork was
 *         hermetic. that is one instrument asked about itself. this reads
 *         tmux directly, so the two sources are independent
 *         (term=false-report._.choice._.md)
 */
export const getTmuxSessions = (input: { socket: string | null }): string[] => {
  const args = input.socket
    ? ['-L', input.socket, 'list-sessions', '-F', '#{session_name}']
    : ['list-sessions', '-F', '#{session_name}'];
  try {
    const out = execFileSync('tmux', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10_000,
    });
    return out.split('\n').filter(Boolean);
  } catch (error) {
    // tmux exits 1 with no server, which reads as a truthful "no sessions".
    // 🔴 a FAILURE TO SPAWN does not — an absent tmux read as "no sessions" is
    //    the false report this function's own .why exists to refuse.
    if (!isErrChildExited(error)) throw error;
    return [];
  }
};

/**
 * .what = read a pane's visible text, from OUTSIDE ductwork
 *
 * .why  = a clamp on "did the payload LAND?" must not ask the sender whether
 *         the send arrived. `duct.send` reports on the CALL, and the defect
 *         class that has now surfaced three times (#20, #32, #91 — three arms,
 *         one shape) is a truthful report about the wrong subject. so the
 *         read-back has to come from a second, independent source, exactly as
 *         `getTmuxSessions` argues for hermeticity
 *         (term=false-report._.choice._.md).
 *
 * .note = `-J` joins a wrapped line back together. without it a payload that
 *         wraps at the pane's width arrives split by a newline, and a
 *         `toContain` on the whole string goes red for a reason that has
 *         naught to do with the defect.
 */
export const getPaneText = (input: {
  socket: string;
  session: string;
}): string => {
  try {
    return execFileSync(
      'tmux',
      [
        '-L',
        input.socket,
        'capture-pane',
        '-t',
        input.session,
        '-p',
        '-J',
        '-S',
        '-200',
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 10_000,
      },
    );
  } catch (error) {
    // an absent session exits non-zero, and reads as no text — the caller
    // asserts on content. 🔴 an absent tmux BINARY does not get that grace;
    // empty text it never read is the same false report as above.
    if (!isErrChildExited(error)) throw error;
    return '';
  }
};

/**
 * .what = is tmux on this machine at all?
 * .why  = the tier-2 clamps need it. absent, they must FAIL LOUD rather than
 *         skip — an absent resource is a blocker, never a silent pass
 *         (rule.require.failfast).
 */
export const hasTmux = (): boolean => {
  try {
    execFileSync('tmux', ['-V'], { stdio: 'ignore', timeout: 5_000 });
    return true;
  } catch (error) {
    // ENOENT — it failed to spawn, so tmux is genuinely not on this machine,
    // which is the one answer `false` may mean. a tmux that RUNS and fails
    // `-V` is broken rather than absent, and a caller told "absent" would
    // chase the wrong repair, so that surfaces.
    if (!isErrPathAbsent(error)) throw error;
    return false;
  }
};

// ---------------------------------------------------------------------------
// termwork — the kitty half
// ---------------------------------------------------------------------------

/** the one prefix every test term socket dir carries */
export const PREFIX_TEST_TERM = 'termwork-test-';

/**
 * .what = a private socket dir for kitty to bind its listen sockets in
 *
 * .why  = this is TERMWORK's half of the seam, and it is the kitty analogue of
 *         DUCTWORK_TMUX_SOCKET. without it a test binds into the SHARED /tmp
 *         beside the operator's own windows — so a test whose slug happened to
 *         match a live tree would find, focus, and eventually CLOSE a real
 *         terminal a human was mid-work in.
 *
 * .note = the seam is the DIR, not the socket name, because kitty appends its
 *         own pid to `listen_on`. the final filename is unknowable before the
 *         spawn, so a unique name cannot be guaranteed — but the directory it
 *         lands in can be owned outright. a container, where tmux needed only
 *         a label.
 */
export const genTermSocketDir = (input: { slug: string }): string =>
  mkdtempSync(join(tmpdir(), `${PREFIX_TEST_TERM}${input.slug}-`));

/**
 * .what = run raw termwork against a PRIVATE registry and a PRIVATE socket dir
 *
 * .why  = termwork owns the kitty mechanism, so a fake proves only the fake.
 *         these clamps drive the real lib — and the two seams keep that safe:
 *
 *           TERMWORK_DIR        — a temp registry, no live rows in reach
 *           TERMWORK_SOCKET_DIR — a temp socket dir, no live windows in reach
 *
 *         a body that never spawns kitty needs no display at all — and no body
 *         in the termwork suite does. that is the whole tier, not the first of
 *         two: a term is HEADED by definition, so there is no spawn to clamp
 *         without a human in front of it.
 */
export const runTerm = (input: {
  body: string;
  termworkDir: string;
  socketDir: string;
}): RunResult => {
  const dir = tempDirs.genOne({ slug: 'term' });
  const body = [
    'set -uo pipefail',
    `export TERMWORK_DIR='${input.termworkDir}'`,
    `export TERMWORK_SOCKET_DIR='${input.socketDir}'`,
    // ⚠️ the same hazard the duct pane had: a kitty tab runs a shell, and the
    //    operator's rc opens ducts from it. `sh` reads no ~/.bashrc.
    "export SHELL='/bin/sh'",
    `source '${PATH_TERMWORK}'`,
    '',
    input.body,
  ].join('\n');
  return runDriver({ body, dir, pathLog: null, env: {} });
};

// .note = `hasKitty` and `hasHeadlessDisplay` were declared here, to gate a
//         termwork "spawn tier" against kitty and xvfb. both were consumed by
//         one case, which asserted their presence and did no more — and no
//         body in that suite ever spawns kitty, so the substrate they demanded
//         served no coverage.
//
//         removed on the DOMAIN argument rather than the usage count: a DUCT is
//         headless by nature (an addressable keyboard, no human required) and a
//         TERM is headed by nature (it exists so a human can look at it). so a
//         headless kitty is a contradiction, and a spawn onto a fake screen
//         would prove only that the spawn works on a fake screen.
//
//         if a term spawn ever does need coverage, it needs a HUMAN, not an
//         xvfb — which makes it an acceptance concern, never a clamp here.

/**
 * .what = the pids of any kitty bound into a TEST socket dir
 *
 * .why  = the same lesson the tmux teardown paid for: a socket file is a proxy
 *         for a live process, and the two come apart. an unlinked socket hides
 *         a kitty rather than ends it, so the sweep reads the process table
 *         (term=false-report._.choice._.md).
 *
 * .note = it matches on PREFIX_TEST_TERM, which only a mkdtemp'd test dir ever
 *         carries. the operator's own kitty binds under /tmp directly, so it
 *         is unreachable from here by construction.
 */
export const getTestTermPids = (input?: { socketDir?: string }): number[] => {
  const needle = input?.socketDir ?? PREFIX_TEST_TERM;
  if (!needle.includes(PREFIX_TEST_TERM))
    throw new Error(
      `the test-term scan refuses a socket dir outside the test prefix: ${needle}`,
    );

  const pids: number[] = [];
  for (const entry of readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    let argv = '';
    try {
      argv = readFileSync(`/proc/${entry}/cmdline`, 'utf8');
    } catch (error) {
      // exited mid-scan, or not ours to read — skip that one entry
      if (!isErrProcUnreadable(error)) throw error;
      continue;
    }
    if (argv.includes(needle)) pids.push(Number(entry));
  }
  return pids;
};

/** .what = the same scan, with argv — a pid names a survivor, argv names its creator */
export const getTestTermProcs = (input?: {
  socketDir?: string;
}): { pid: number; argv: string }[] =>
  getTestTermPids(input).map((pid) => {
    try {
      return {
        pid,
        argv: readFileSync(`/proc/${pid}/cmdline`, 'utf8')
          .split('\0')
          .join(' '),
      };
    } catch (error) {
      if (!isErrProcUnreadable(error)) throw error;
      return { pid, argv: '(exited mid-scan)' };
    }
  });

/**
 * .what = reap every kitty bound into a test socket dir, then drop the dir
 *
 * .why  = converge on the PROCESS TABLE, never on reachability. this is the
 *         exact teardown shape delTmuxServer arrived at the hard way, applied
 *         here before the same defect can be re-earned.
 */
export const delTestTerms = (input?: { socketDir?: string }): number => {
  let reaped = 0;
  for (const pid of getTestTermPids(input)) {
    try {
      process.kill(pid, 'SIGKILL');
      reaped += 1;
    } catch (error) {
      // ESRCH = gone already · EPERM = alive, not ours to signal. both leave
      // the goal state reached; every other code is a real fault.
      if (!isErrProcAbsent(error)) throw error;
    }
  }
  // .note = `force: true` absorbs an absent dir, so a catch could only swallow
  //         a real fault. see the allowlists at the head of this file.
  if (input?.socketDir)
    rmSync(input.socketDir, { recursive: true, force: true });
  return reaped;
};

/**
 * .what = drop every test socket dir and temp dir a PRIOR run abandoned
 *
 * .why  = a run killed before its teardown leaves both behind, and the next
 *         run's own sweep only knows the dirs IT made — so the orphans accrue
 *         forever. this is the ductwork `delStaleTestSockets` move, which
 *         termwork lacked until a teeth-injection left one behind and there
 *         was no sanctioned way to reap it.
 *
 * .note = STALE is bound by AGE, and the bound is load-bearing. jest runs each
 *         suite in its own worker, in parallel, so at the instant termwork
 *         sweeps, ductwork holds live dirs that termwork's own DIRS_TEMP knows
 *         naught about — reap those and a peer run dies mid-flight
 *         (rule.require.hermetic-tests). an argv check does not cover it
 *         either: a driver dir has no process that names it.
 *
 *         age separates the two cleanly. a peer's live dir is seconds old; a
 *         crashed run's litter is minutes or hours old. so the window is the
 *         discriminator, never the guess.
 */
export const MS_STALE_TEST_DIR = 30 * 60 * 1000; // 30 min

export const delStaleTestDirs = (input?: {
  staleAfterMs?: number;
}): string[] => {
  const staleAfterMs = input?.staleAfterMs ?? MS_STALE_TEST_DIR;
  const cutoff = Date.now() - staleAfterMs;
  const live = getTestTermProcs().map((proc) => proc.argv);

  const dropped: string[] = [];
  for (const entry of readdirSync(tmpdir())) {
    const isOurs =
      entry.startsWith(PREFIX_TEST_TERM) || entry.startsWith(tempDirs.prefix);
    if (!isOurs) continue;

    const path = join(tmpdir(), entry);
    if (tempDirs.getAll().includes(path)) continue; // this run's own; its afterAll owns it
    if (live.some((argv) => argv.includes(path))) continue; // a peer's, still live

    try {
      if (statSync(path).mtimeMs > cutoff) continue; // too fresh to be a corpse
      rmSync(path, { recursive: true, force: true });
      dropped.push(path);
    } catch (error) {
      // 🔴 the `statSync` is a real race: readdirSync listed the entry, and a
      //    peer's teardown can unlink it before the stat lands. ENOENT there is
      //    "gone mid-sweep" and the sweep stays correct without it.
      //
      //    the `rmSync` carries `force: true`, so it contributes no ENOENT of
      //    its own — which means an EPERM or EBUSY reaching here says a corpse
      //    is still on disk and could not be removed. that is the litter this
      //    function exists to report, so it surfaces rather than accrues.
      if (!isErrPathAbsent(error)) throw error;
    }
  }
  return dropped;
};
