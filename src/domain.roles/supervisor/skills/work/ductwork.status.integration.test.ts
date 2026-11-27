/**
 * .what = clamps on the duct STATUS BAR — each duct owns its own bar
 *
 * .why  = the bar reads two pane options a shell hook may rewrite from any cwd.
 *         a seat shell that wandered into another repo relabeled its duct, and
 *         a seat raised by a path that never stamped drew a blank bar. the cure
 *         pins each duct's session bar to options only the duct writes, derived
 *         from the duct's home anchor rather than its live cwd.
 *
 * .note = a PART of the `ductwork` suite. shared fixtures and the account of
 *         the private tmux server live in ductwork.harness.ts.
 */
import { readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { tempDirs } from '../../../.test/tempDirs';
import { genSocket, SOCKETS_MADE, TREE } from './ductwork.harness';
import {
  delStaleTestServers,
  delStaleTestSockets,
  delTmuxServer,
  hasTmux,
  PATH_CREWWORK,
  runDuct,
} from './work.harness';

beforeAll(() => {
  if (!hasTmux())
    throw new ConstraintError('tmux is required for the ductwork clamps', {
      hint: 'sudo apt install tmux',
    });
  delStaleTestServers();
  delStaleTestSockets();
});

afterAll(() => {
  for (const socket of SOCKETS_MADE) delTmuxServer({ socket });
  tempDirs.delAll();
});

const URI = `duct:///${TREE}/mechanic`;
const SESSION = `${TREE}/mechanic`;

/**
 * .what = a shell line that makes a git worktree dir in the crew's shape:
 *         `<repo>.<branch, dots for slashes>`, on that branch, one commit deep
 */
const genRepoLine = (input: { dir: string; branch: string }): string =>
  [
    `mkdir -p '${input.dir}'`,
    `git init -q -b '${input.branch}' '${input.dir}'`,
    `git -C '${input.dir}' -c user.name=test -c user.email=test@example.com commit -q --allow-empty -m init`,
  ].join(' && ');

/** .what = a shell line that prints the bar's left and right as drawn */
const SHOWN_LINE = `echo "SHOWN=$(__duct_tmux display-message -p -t '${SESSION}' '#{E:status-left}|#{E:status-right}')"`;

/** .what = pull the last SHOWN= line from a run's stdout */
const asShown = (stdout: string): string[] =>
  stdout
    .split('\n')
    .filter((line) => line.startsWith('SHOWN='))
    .map((line) => line.slice('SHOWN='.length));

/**
 * .what = mask each temp dir this suite made, so a render snaps the same on every run
 * .why  = an mkdtemp name carries a random tail; the snapshot grades the render, never the tail
 */
const asMaskedOut = (out: string): string =>
  out
    .split(join(tmpdir(), tempDirs.prefix))
    .join('$TMP/')
    .replace(/\$TMP\/[^/\s'"]+/g, '$TMP');

describe('ductwork.status', () => {
  given('[case1] a duct opened in a crew worktree', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('bar');
      const root = tempDirs.genOne({ slug: 'bar' });
      const repo = `${root}/svc-lessons.feat.book-a-lesson`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
          `duct.open --on '${URI}' --cwd '${repo}'`,
          SHOWN_LINE,
          `echo "PIN=$(__duct_tmux show-options -t '${SESSION}' -v status-left)"`,
          // a shell hook writes the option the bar USED to read
          `__duct_tmux set-option -p -t '${SESSION}' @repo 'elsewhere'`,
          `__duct_tmux set-option -p -t '${SESSION}' @branch 'nope'`,
          SHOWN_LINE,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      return { socket, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.open creates it', () => {
      then('it succeeds', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('it says the bar was stamped, with repo and branch', () => {
        expect(scene.result.stdout).toContain(
          '🏷️  status box — svc-lessons · feat/book-a-lesson (pinned to the duct)',
        );
      });

      then('the session bar is pinned to the duct-owned option', () => {
        expect(scene.result.stdout).toContain('PIN= #{@duct_repo} ');
      });

      then('the bar draws the repo and branch', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });

      then('the render matches the snapshot', () => {
        expect(asMaskedOut(scene.result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] a shell hook rewrites @repo and @branch', () => {
      then('the bar still draws the duct own tree', () => {
        // .why = the defect itself: the bar drew whatever the last hook wrote
        expect(asShown(scene.result.stdout)[1]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });

      then('the bars drawn match the snapshot', () => {
        expect(asShown(scene.result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] a duct whose home anchor is corrected', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('anchor');
      const root = tempDirs.genOne({ slug: 'anchor' });
      const wrong = `${root}/svc-lessons.feat.wrong`;
      const right = `${root}/svc-lessons.feat.right`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: wrong, branch: 'feat/wrong' }),
          genRepoLine({ dir: right, branch: 'feat/right' }),
          `duct.open --on '${URI}' --cwd '${wrong}'`,
          `echo "--- refresh home"`,
          `duct.refresh --on '${URI}' --home '${right}'; echo "RC1=$?"`,
          SHOWN_LINE,
          `echo "--- refresh again"`,
          `duct.refresh --on '${URI}' --home '${right}'; echo "RC2=$?"`,
          `echo "--- refresh bare"`,
          `duct.refresh --on '${URI}'; echo "RC3=$?"`,
          SHOWN_LINE,
          `echo "--- reopen"`,
          `duct.open --on '${URI}' --cwd '${wrong}'`,
          SHOWN_LINE,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const sections = result.stdout.split('--- ');
      return { socket, result, right, wrong, sections };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.refresh --home names a different tree', () => {
      then('it succeeds', () => {
        expect(scene.result.stdout).toContain('RC1=0');
      });

      then('it says the anchor was CORRECTED, with both paths', () => {
        const said = scene.sections[1] ?? '';
        expect(said).toContain('🏠 home anchor CORRECTED');
        expect(said).toContain(`was: ${scene.wrong}`);
        expect(said).toContain(`now: ${scene.right}`);
      });

      then('the bar now draws the corrected tree', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/right ',
        );
      });

      then('the render matches the snapshot', () => {
        expect(asMaskedOut(scene.sections[1] ?? '')).toMatchSnapshot();
      });
    });

    when('[t1] duct.refresh --home names the same tree again', () => {
      then('it says naught of the anchor — it already holds', () => {
        expect(scene.result.stdout).toContain('RC2=0');
        expect(scene.sections[2] ?? '').not.toContain('🏠');
      });
    });

    when('[t2] a bare duct.refresh, then a found duct.open', () => {
      then('neither moves the anchor back to the birth cwd', () => {
        // .why = the anchor is the authority; a found duct keeps it (findsert)
        expect(scene.result.stdout).toContain('RC3=0');
        const shown = asShown(scene.result.stdout);
        expect(shown[1]).toEqual(' svc-lessons | feat/right ');
        expect(shown[2]).toEqual(' svc-lessons | feat/right ');
      });

      then('the bars drawn match the snapshot', () => {
        expect(asShown(scene.result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] a duct opened outside any repo', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('norepo');
      const cwd = tempDirs.genOne({ slug: 'norepo' });
      const result = runDuct({
        body: `duct.open --on '${URI}' --cwd '${cwd}'`,
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      return { socket, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.open creates it', () => {
      then('it still succeeds — the bar is cosmetic', () => {
        expect(scene.result.exit).toEqual(0);
      });

      then('it says the bar holds no repo, rather than a guess', () => {
        expect(scene.result.stdout).toContain(
          '🏷️  status box — (no repo) · (no branch) (pinned to the duct)',
        );
      });

      then('the render matches the snapshot', () => {
        expect(asMaskedOut(scene.result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case5] a duct opened before the pin, then rebooted', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('reboot');
      const root = tempDirs.genOne({ slug: 'reboot' });
      const repo = `${root}/svc-lessons.feat.book-a-lesson`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
          `duct.open --on '${URI}' --cwd '${repo}'`,
          // the bar as a duct from before the pin held it: unpinned, drawn from the hook's options
          `__duct_tmux set-option -t '${SESSION}' status-left ' #{@repo} '`,
          `__duct_tmux set-option -u -t '${SESSION}' @duct_repo`,
          `__duct_tmux set-option -u -t '${SESSION}' @duct_branch`,
          `__duct_tmux set-option -p -t '${SESSION}' @repo 'elsewhere'`,
          `__duct_tmux set-option -p -t '${SESSION}' @branch 'nope'`,
          `echo "--- reboot"`,
          `duct.reboot --on '${URI}'; echo "RC=$?"`,
          SHOWN_LINE,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const said = result.stdout.split('--- ')[1] ?? '';
      return { socket, result, said };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.reboot respawns it', () => {
      then('it succeeds', () => {
        expect(scene.result.stdout).toContain('RC=0');
      });

      then('it says the bar was stamped, with repo and branch', () => {
        expect(scene.said).toContain(
          '🏷️  status box — svc-lessons · feat/book-a-lesson (pinned to the duct)',
        );
      });

      then('the bar draws the duct own tree, not the hook options', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });

      then('the render matches the snapshot', () => {
        expect(asMaskedOut(scene.said)).toMatchSnapshot();
      });
    });
  });

  given('[case6] a stamp or an anchor that tmux cannot read or write', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('failhide');
      const root = tempDirs.genOne({ slug: 'failhide' });
      const repo = `${root}/svc-lessons.feat.book-a-lesson`;
      const other = `${root}/svc-lessons.feat.other`;
      const URI_FRESH = `duct:///${TREE}/foreman`;
      /**
       * .mock = `__duct_status_box_probe`, `__duct_stamp_options_set`, `__duct_home_anchor_write`,
       *         `__duct_home_anchor_read`, each redefined in a subshell to fail
       * .why  = a live tmux server on a private socket does not fail a read or a write on demand;
       *         the failhide paths (a stamp or an anchor tmux would not take) are reached only so
       * .real = each runs for real against the private socket in case1 [t0], case2 [t0], case5
       */
      const stampAs = (fake: string): string =>
        `( ${fake}; __duct_parse_uri '${URI}' && __duct_stamp_status_box '' ); echo "RC=$?"`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
          genRepoLine({ dir: other, branch: 'feat/other' }),
          `duct.open --on '${URI}' --cwd '${repo}' >/dev/null`,
          `echo "--- probe fails"`,
          stampAs('__duct_status_box_probe() { return 3; }'),
          SHOWN_LINE,
          `echo "--- probe sees no session"`,
          stampAs('__duct_status_box_probe() { return 0; }'),
          SHOWN_LINE,
          `echo "--- write refused"`,
          stampAs('__duct_stamp_options_set() { return 1; }'),
          `echo "--- upsert write refused"`,
          `( __duct_home_anchor_write() { echo "no such pane"; return 1; }; duct.refresh --on '${URI}' --home '${other}' 2>&1 ); echo "RC=$?"`,
          `echo "--- upsert read fails"`,
          `( __duct_home_anchor_read() { return 1; }; duct.refresh --on '${URI}' --home '${other}' 2>&1 ); echo "RC=$?"`,
          `echo "--- birth read fails"`,
          `( __duct_home_anchor_read() { return 1; }; duct.open --on '${URI_FRESH}' --cwd '${repo}' ); echo "RC=$?"`,
          `echo "--- birth write refused"`,
          `( __duct_home_anchor_write() { echo "no such pane"; return 1; }; duct.open --on 'duct:///${TREE}/reflector' --cwd '${repo}' ); echo "RC=$?"`,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const sections = result.stdout.split('--- ');
      const said = (slug: string): string =>
        sections.find((s) => s.startsWith(slug)) ?? '';
      return { socket, result, said, root };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] the probe fails', () => {
      then('it says the bar was NOT stamped, with the rc', () => {
        expect(scene.said('probe fails')).toContain(
          '🟡 status box NOT stamped — the probe could not read this grove (rc 3)',
        );
        expect(scene.said('probe fails')).toContain('RC=0');
      });

      then('the good bar is left as it was, never wiped to (no repo)', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });
    });

    when('[t1] the probe ran but saw no such session', () => {
      then('it says so, and leaves the bar as it was', () => {
        expect(scene.said('probe sees no session')).toContain(
          '🟡 status box NOT stamped — the probe found no session',
        );
        expect(asShown(scene.result.stdout)[1]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });
    });

    when('[t2] tmux refuses the pane option', () => {
      then('it says the bar was NOT stamped, and the caller goes on', () => {
        expect(scene.said('write refused')).toContain(
          '🟡 status box NOT stamped — tmux refused the pane option (rc 1)',
        );
        expect(scene.said('write refused')).toContain('RC=0');
      });
    });

    when('[t3] duct.refresh --home cannot write the anchor', () => {
      then(
        'it fails loud as a malfunction, with what tmux said and a fix',
        () => {
          const said = scene.said('upsert write refused');
          expect(said).toContain(
            '💥 MalfunctionError: could not set the home anchor',
          );
          expect(said).toContain('tmux said: no such pane');
          expect(said).toContain('fix: check the duct is live');
          expect(said).toContain('RC=1');
        },
      );
    });

    when('[t4] duct.refresh --home cannot read the anchor', () => {
      then(
        'it fails loud, and never reads the failure as an unset anchor',
        () => {
          const said = scene.said('upsert read fails');
          expect(said).toContain(
            '💥 MalfunctionError: could not read the home anchor',
          );
          expect(said).not.toContain('🏠 home anchor set');
          expect(said).toContain('RC=1');
        },
      );
    });

    when('[t5] duct.open cannot read the anchor at birth', () => {
      then('it says the anchor was not checked, and still opens', () => {
        const said = scene.said('birth read fails');
        expect(said).toContain('🟡 home anchor NOT checked');
        expect(said).toContain('RC=0');
      });
    });

    when('[t6] duct.open cannot write the anchor at birth', () => {
      then('it says the anchor was not set, with what tmux said', () => {
        const said = scene.said('birth write refused');
        expect(said).toContain(
          '🟡 home anchor NOT set — tmux refused it (rc 1): no such pane',
        );
        expect(said).toContain('RC=0');
      });
    });

    when('[t7] the renders, whole', () => {
      then('they match the snapshot', () => {
        const masked = scene.result.stdout
          .split(scene.root)
          .join('$ROOT')
          .split('\n')
          .filter((line) => /🟡|💥|🏷️|├─|└─|RC=/.test(line));
        expect(masked).toMatchSnapshot();
      });
    });
  });

  given(
    '[case7] duct.bar.probe audits a pinned bar, an unpinned one, and a dead server',
    () => {
      // the shipped skill, so the verb the move names is the one a consumer can run
      const PATH_PROBE = join(__dirname, '..', 'duct.bar.probe.sh');
      const scene = useBeforeAll(async () => {
        const socket = genSocket('probe');
        const root = tempDirs.genOne({ slug: 'probe' });
        const repo = `${root}/svc-lessons.feat.book-a-lesson`;
        // a private socket dir: the probe sees this suite's server, and one stale socket, and no real server
        const sockdir = tempDirs.genOne({ slug: 'probe-sockdir' });
        // no dots: tmux casts a dot in a session name to an underscore
        const UNPINNED = 'svc-lessons-feat-x/foreman';
        const result = runDuct({
          body: [
            genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
            `duct.open --on '${URI}' --cwd '${repo}' >/dev/null`,
            // a session from before the pin: its bar reads the hook's option
            `__duct_tmux new-session -d -s '${UNPINNED}'`,
            `__duct_tmux set-option -t '${UNPINNED}' status-left ' #{@repo} '`,
            `mine="${'$'}{TMUX_TMPDIR:-/tmp}/tmux-$(id -u)/${socket}"`,
            // tmux -L refuses a socket dir that is not 0700, so the dir takes tmux's own mode
            `mkdir -m 700 -p '${sockdir}/tmux-'"$(id -u)"`,
            `ln -s "$mine" '${sockdir}/tmux-'"$(id -u)/live"`,
            // a server killed with SIGKILL leaves its socket: that server is unread
            `stale='${sockdir}/tmux-'"$(id -u)/stale"`,
            `tmux -S "$stale" -f /dev/null new-session -d -s a/b`,
            `kill -9 "$(tmux -S "$stale" display-message -p '#{pid}')"`,
            // converge on the server gone, never on a wall-clock guess: at most 40 turns of 50ms, then fail loud
            `turns=0; while tmux -S "$stale" list-sessions >/dev/null 2>&1; do turns=$((turns + 1)); [ "$turns" -lt 40 ] || { echo "the killed server still answers"; exit 1; }; sleep 0.05; done`,
            `echo "--- probe"`,
            `TMUX_TMPDIR='${sockdir}' bash '${PATH_PROBE}'; echo "RC=$?"`,
          ].join('\n'),
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        });
        const said = result.stdout.split('--- probe')[1] ?? '';
        return { socket, result, said, sockdir, UNPINNED };
      });

      afterAll(() => delTmuxServer({ socket: scene.socket }));

      when('[t0] the probe runs over the private socket dir', () => {
        then('it exits 0: findings are reported, never an error', () => {
          expect(scene.said).toContain('RC=0');
        });

        then(
          'the duct opened by duct.open reads pinned, and draws its own tree',
          () => {
            const row =
              scene.said.split(`├─ ${SESSION} (server live)`)[1] ?? '';
            expect(row).toContain(
              'shown: [ svc-lessons | feat/book-a-lesson ]',
            );
            expect(row.split('pinned to duct: ')[1]?.startsWith('yes')).toEqual(
              true,
            );
          },
        );

        then('the session from before the pin reads unpinned', () => {
          const row =
            scene.said.split(`├─ ${scene.UNPINNED} (server live)`)[1] ?? '';
          expect(row.split('pinned to duct: ')[1]?.startsWith('no')).toEqual(
            true,
          );
        });

        then(
          'the dead server is named unread, never skipped in silence',
          () => {
            expect(scene.said).toContain(
              '🟡 server stale did not answer: its sessions are unread',
            );
            expect(scene.said).toContain('done: 2 sessions, 1 server unread');
          },
        );

        then('the render matches the snapshot', () => {
          const masked = scene.said
            .split(scene.sockdir)
            .join('$SOCKDIR')
            .replace(/tmux-\d+/g, 'tmux-<uid>');
          expect(masked).toMatchSnapshot();
        });
      });

      when('[t1] the caller asks how to use the probe', () => {
        const help = useBeforeAll(async () =>
          runDuct({
            body: `bash '${PATH_PROBE}' --help; echo "RC=$?"`,
            socket: scene.socket,
            ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          }),
        );

        then('it exits 0 and says what it reads', () => {
          expect(help.stdout).toContain('RC=0');
          expect(help.stdout).toContain('.what');
        });

        then('the help render matches the snapshot', () => {
          expect(`${help.stdout}${help.stderr}`).toMatchSnapshot();
        });
      });

      when('[t2] the caller mistypes an arg', () => {
        const slip = useBeforeAll(async () =>
          runDuct({
            body: `bash '${PATH_PROBE}' --sesion x; echo "RC=$?"`,
            socket: scene.socket,
            ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          }),
        );

        then('🔴 it exits 2 and names every valid arg, not only --help', () => {
          expect(slip.stdout).toContain('RC=2');
          expect(slip.stderr).toContain("unknown arg '--sesion'");
          expect(slip.stderr).toContain('--session <tree>/<role>');
          expect(slip.stderr).toContain('--help');
        });

        then('the refusal render matches the snapshot', () => {
          expect(`${slip.stdout}${slip.stderr}`).toMatchSnapshot();
        });
      });

      when('[t3] the caller names one session with --session', () => {
        const probeOne = (input: { session: string }) =>
          runDuct({
            body: `TMUX_TMPDIR='${scene.sockdir}' bash '${PATH_PROBE}' --session '${input.session}'; echo "RC=$?"`,
            socket: scene.socket,
            ductworkDir: tempDirs.genOne({ slug: 'registry' }),
          });
        const asMasked = (said: string) =>
          said
            .split(scene.sockdir)
            .join('$SOCKDIR')
            .replace(/tmux-\d+/g, 'tmux-<uid>');
        const present = useBeforeAll(async () =>
          probeOne({ session: SESSION }),
        );
        const absent = useBeforeAll(async () =>
          probeOne({ session: 'svc-absent/mechanic' }),
        );

        then('a present session: exit 0, that one row alone, pinned', () => {
          expect(present.stdout).toContain('RC=0');
          expect(present.stdout).toContain(
            `duct.bar.probe --session ${SESSION}`,
          );
          expect(present.stdout).toContain(`├─ ${SESSION} (server live)`);
          expect(present.stdout).not.toContain(scene.UNPINNED);
          expect(present.stdout).toContain('pinned to duct: yes');
          expect(present.stdout).toContain('done: 1 session, 1 server unread');
        });

        then('an absent session: exit 0, no row, and a count of zero', () => {
          expect(absent.stdout).toContain('RC=0');
          expect(absent.stdout).not.toContain('(server live)');
          expect(absent.stdout).toContain('done: 0 sessions, 1 server unread');
        });

        then('both renders match the snapshot', () => {
          expect(asMasked(present.stdout)).toMatchSnapshot();
          expect(asMasked(absent.stdout)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case8] a duct on a grove, stamped over ssh', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('grove');
      const root = tempDirs.genOne({ slug: 'grove' });
      const wrong = `${root}/svc-lessons.feat.wrong`;
      const right = `${root}/svc-lessons.feat.right`;
      const sshLog = `${root}/ssh.log`;
      const URI_GROVE = `duct://grove-h/${TREE}/mechanic`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: wrong, branch: 'feat/wrong' }),
          genRepoLine({ dir: right, branch: 'feat/right' }),
          // the session lives on the private socket; the grove is this box, reached through the fake ssh
          `duct.open --on '${URI}' --cwd '${wrong}' >/dev/null`,
          // .mock = `ssh`, which runs the remote command on this box and logs its argv
          // .why = the fake ssh runs the remote command string as the grove's login shell would, so each grove-side string (base64 probe, anchor read + write, chained set-option) runs for real
          // .real = the real ssh client carries a move's argv in git.crew.move case70 [t1r]; the hetzner walk reads the stamp over the tailnet
          `ssh() { printf 'SSH %s\\n' "$*" >> '${sshLog}'; bash -c "${'$'}{@: -1}"; }`,
          `echo "--- refresh grove"`,
          `duct.refresh --on '${URI_GROVE}' --home '${right}'; echo "RC=$?"`,
          SHOWN_LINE,
          `echo "PIN=$(__duct_tmux show-options -t '${SESSION}' -v status-left)"`,
          `echo "HOME=$(__duct_tmux show-options -q -t '${SESSION}' -v @home_cwd)"`,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const said = result.stdout.split('--- refresh grove')[1] ?? '';
      const ssh = readFileSync(sshLog, 'utf-8');
      return { socket, result, said, ssh, root, right };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.refresh --home runs on the grove duct', () => {
      then('it succeeds', () => {
        expect(scene.said).toContain('RC=0');
      });

      then(
        'every bar and anchor call went over ssh to the grove, as base64',
        () => {
          const lines = scene.ssh.split('\n').filter((line) => line.length > 0);
          expect(lines.every((line) => line.includes('grove-h'))).toEqual(true);
          // the procedure runs as `bash -c` from the decoded text, never from stdin, and an empty decode exits 97 rather
          // than run naught as success (case9 [t5]); the ssh is bounded and never prompts
          const wire = lines.filter((line) => line.includes('base64 -d)'));
          expect(wire.length).toBeGreaterThan(0);
          for (const line of wire) {
            expect(line).toContain('p=$(printf');
            expect(line).toContain('[ -n "$p" ] || exit 97; bash -c "$p"');
            expect(line).toContain('-o BatchMode=yes');
            expect(line).toContain('-o ServerAliveInterval=15');
          }
          // .why = no stamp or anchor value rides the wire as text the remote shell would re-parse
          expect(scene.ssh).not.toContain('set-option');
          expect(scene.ssh).not.toContain('@home_cwd');
        },
      );

      then('the grove probe decoded and stamped the corrected tree', () => {
        expect(scene.said).toContain(
          '🏷️  status box — svc-lessons · feat/right (pinned to the duct)',
        );
      });

      then('the grove bar draws the tree, pinned to the duct', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/right ',
        );
        expect(scene.result.stdout).toContain('PIN= #{@duct_repo} ');
        expect(scene.result.stdout).toContain(`HOME=${scene.right}`);
      });

      then('the render matches the snapshot', () => {
        expect(scene.said.split(scene.root).join('$ROOT')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case9] a grove duct on a branch whose name holds shell syntax',
    () => {
      const scene = useBeforeAll(async () => {
        const socket = genSocket('inject');
        const root = tempDirs.genOne({ slug: 'inject' });
        const repo = `${root}/svc-lessons.feat.x`;
        const marker = `${root}/pwned`;
        // a legal git ref that closes a single quote, runs a command, and reopens one
        const BRANCH = `feat/x';touch\${IFS}${marker};'`;
        const sshLog = `${root}/ssh.log`;
        const markerCwd = `${root}/pwned-cwd`;
        const CWD_BAD = `${root}/at';touch\${IFS}${markerCwd};'`;
        const URI_GROVE = `duct://grove-h/${TREE}/mechanic`;
        const result = runDuct({
          body: [
            `mkdir -p '${repo}'`,
            `git init -q -b "$(printf '%s' ${JSON.stringify(BRANCH).replace(/\$/g, '\\$')})" '${repo}'`,
            `git -C '${repo}' -c user.name=test -c user.email=test@example.com commit -q --allow-empty -m init`,
            `duct.open --on '${URI}' --cwd '${repo}' >/dev/null`,
            // .mock = `ssh`, the same as case8: the remote string runs on this box, so a quote escape would run for real
            // .why = the subject is whether a hostile branch or slug breaks out of the grove-side string; no second host is needed to prove it
            // .real = the real ssh client carries a move's argv in git.crew.move case70 [t1r]
            `ssh() { printf 'SSH %s\\n' "$*" >> '${sshLog}'; bash -c "${'$'}{@: -1}"; }`,
            `echo "--- refresh grove"`,
            `duct.refresh --on '${URI_GROVE}' --home '${repo}'; echo "RC=$?"`,
            // what the bar draws on its right, the branch side
            `echo "BRANCH=$(__duct_tmux display-message -p -t '${SESSION}' '#{E:status-right}')"`,
            // a control: a `${` value set raw, with no %q. tmux draws a `\` before each `$`, so the stamp is judged against that
            `__duct_tmux set-option -t '${SESSION}' @control 'x\${IFS}y'`,
            `echo "CONTROL=$(__duct_tmux display-message -p -t '${SESSION}' '#{@control}')"`,
            `[ -e '${marker}' ] && echo "PWNED=yes" || echo "PWNED=no"`,
            `echo "--- open bad"`,
            `duct.open --on "duct://grove-h/x';touch\${IFS}${marker};'/mechanic" --cwd '${repo}'; echo "RC=$?"`,
            `[ -e '${marker}' ] && echo "PWNED=yes" || echo "PWNED=no"`,
            // a grove duct born in a dir whose name closes a single quote and runs a command
            `echo "--- open cwd"`,
            `cwdbad="$(printf '%s' ${JSON.stringify(CWD_BAD).replace(/\$/g, '\\$')})"; mkdir -p "$cwdbad"`,
            `duct.open --on 'duct://grove-h/${TREE}.cwdx/mechanic' --cwd "$cwdbad" >/dev/null; echo "RC=$?"`,
            `[ -e '${markerCwd}' ] && echo "PWNED_CWD=yes" || echo "PWNED_CWD=no"`,
            `__duct_tmux list-sessions -F 'BORN_IN=#{session_path}'`,
            // a branch may hold # ~ % ( — each legal in git, none able to close a single quote
            `echo "--- odd name"`,
            `duct.open --on 'duct://grove-h/feat#1~x%y(z)/mechanic' --cwd '${repo}' >/dev/null; echo "OPEN_RC=$?"`,
            `duct.read --on 'duct://grove-h/feat#1~x%y(z)/mechanic' --lines 5 >/dev/null; echo "READ_RC=$?"`,
            `duct.stop --on 'duct://grove-h/feat#1~x%y(z)/mechanic' >/dev/null; echo "CLOSE_RC=$?"`,
            `duct.read --on '${URI_GROVE}' --lines "5';touch\${IFS}${marker};'"; echo "LINES_RC=$?"`,
            `duct.send --on '${URI_GROVE}' --keys "Enter;touch\${IFS}${marker}"; echo "KEYS_RC=$?"`,
            `[ -e '${marker}' ] && echo "PWNED_ARGS=yes" || echo "PWNED_ARGS=no"`,
            // the crew's tree lookup sends a slug inside a double-quoted sh -c on the grove
            `source '${PATH_CREWWORK}'`,
            `__crew_tree_dir_on_grove grove-h "x\\$(touch\${IFS}${marker})"; echo "TREEDIR_RC=$?"`,
            `[ -e '${marker}' ] && echo "PWNED_TREE=yes" || echo "PWNED_TREE=no"`,
            // a slug that pairs off empty quotes and runs a redirect: it holds no `$`, backtick, `"`, `\`, or space
            `__crew_tree_dir_on_grove grove-h "a'';>${root}/pwned-tree;''"; echo "TREEDIR_QUOTE_RC=$?"`,
            `[ -e '${root}/pwned-tree' ] && echo "PWNED_TREE_QUOTE=yes" || echo "PWNED_TREE_QUOTE=no"`,
            // the poll's tree-facts read sends the same two names to the grove
            `source "$(dirname '${PATH_CREWWORK}')/pollwork.read.sh"`,
            `__poll_tree_facts_on_grove grove-h "a\\$(>${root}/pwned-poll)"; echo "POLL_RC=$?"`,
            `[ -e '${root}/pwned-poll' ] && echo "PWNED_POLL=yes" || echo "PWNED_POLL=no"`,
            // last, since it breaks the decode for all that follows: a grove whose `base64 -d` fails
            // .mock = `base64 -d` alone; every encode above runs the real binary
            // .why = no real grove lacks a decode on demand, and the refusal path is reached only so
            // .real = the real decode runs in every line above this one
            `base64() { if [[ "\${1:-}" == -d ]]; then return 1; fi; command base64 "$@"; }; export -f base64`,
            `__duct_bash_on_grove grove-h "touch '${root}/ran-undecoded'" 2>'${root}/undecoded.err'; echo "UNDECODED_RC=$?"`,
            `[ -e '${root}/ran-undecoded' ] && echo "RAN_UNDECODED=yes" || echo "RAN_UNDECODED=no"`,
            `echo "UNDECODED_ERR=$(head -1 '${root}/undecoded.err')"`,
          ].join('\n'),
          socket,
          ductworkDir: tempDirs.genOne({ slug: 'registry' }),
        });
        const sections = result.stdout.split('--- ');
        const said = sections[1] ?? '';
        const bad = `${sections[2] ?? ''}${result.stderr}`;
        const born = sections[3] ?? '';
        const odd = `${sections[4] ?? ''}`;
        return { socket, result, said, bad, born, odd, root, BRANCH, CWD_BAD };
      });

      afterAll(() => delTmuxServer({ socket: scene.socket }));

      when('[t0] the stamp writes the branch on the grove', () => {
        then('it succeeds', () => {
          expect(scene.said).toContain('RC=0');
        });

        then('the branch name ran naught on the grove', () => {
          expect(scene.said).toContain('PWNED=no');
        });

        then('the bar holds the branch name as a literal value', () => {
          expect(scene.said).toContain(
            `🏷️  status box — svc-lessons.feat.x · ${scene.BRANCH} (pinned to the duct)`,
          );
          // tmux escapes `$` as it draws, for a raw value too (the control); the stamp adds no escape of its own
          expect(scene.said).toContain('CONTROL=x\\${IFS}y');
          expect(scene.said).toContain(
            `BRANCH= ${scene.BRANCH.replace('$', '\\$')} `,
          );
        });

        then('the render matches the snapshot', () => {
          expect(scene.said.split(scene.root).join('$ROOT')).toMatchSnapshot();
        });
      });

      when('[t1] a duct uri itself holds shell syntax', () => {
        then('the parse refuses it, exit 2, before any grove call', () => {
          expect(scene.bad).toContain('RC=2');
          expect(scene.bad).toContain('PWNED=no');
          expect(scene.bad).toContain(
            'holds a single quote or a control char (shown as ?), which a duct name may not',
          );
        });

        then(
          'each refusal stays on one line: a control char echoes as ?',
          () => {
            const lines = scene.result.stderr.split('\n');
            const heads = lines.filter((line) => line.startsWith('✋'));
            expect(heads.length).toBeGreaterThan(0);
            for (const head of heads) expect(head).not.toContain('\t');
            // every line opens with a refusal head or a tree glyph; none is the tail of a split value
            for (const line of lines.filter((l) => l.length > 0))
              expect(line).toMatch(/^(✋| {3}[├└│])/);
          },
        );

        then('the refusal render matches the snapshot', () => {
          expect(
            scene.result.stderr.split(scene.root).join('$ROOT'),
          ).toMatchSnapshot();
        });
      });

      when(
        '[t2] a grove duct is born in a dir whose name holds shell syntax',
        () => {
          then('the dir name ran naught on the grove', () => {
            expect(scene.born).toContain('RC=0');
            expect(scene.born).toContain('PWNED_CWD=no');
          });

          then('the duct was born in that dir, its name intact', () => {
            // tmux draws a `\` before each `$` (case9 [t0] control); the dir name is otherwise whole
            expect(scene.born).toContain(
              `BORN_IN=${scene.CWD_BAD.replace('$', '\\$')}`,
            );
          });

          then('the render matches the snapshot', () => {
            expect(
              scene.born.split(scene.root).join('$ROOT'),
            ).toMatchSnapshot();
          });
        },
      );

      when(
        '[t3] a duct name holds # ~ % ( and a flag holds shell syntax',
        () => {
          then(
            'the odd name opens, reads, and stops — no duct is stranded',
            () => {
              expect(scene.odd).toContain('OPEN_RC=0');
              expect(scene.odd).toContain('READ_RC=0');
              expect(scene.odd).toContain('CLOSE_RC=0');
            },
          );

          then(
            'a --lines or --keys that holds shell syntax is refused, exit 2, and runs naught',
            () => {
              expect(scene.odd).toContain('LINES_RC=2');
              expect(scene.odd).toContain('KEYS_RC=2');
              expect(scene.odd).toContain('PWNED_ARGS=no');
            },
          );
        },
      );

      when(
        '[t4] the crew tree lookup is asked for a slug that holds shell syntax',
        () => {
          then(
            'a `$(…)` slug finds no tree, and naught runs on the grove',
            () => {
              expect(scene.odd).toContain('TREEDIR_RC=1');
              expect(scene.odd).toContain('PWNED_TREE=no');
            },
          );

          then(
            'a slug that pairs off quotes finds no tree, and naught runs on the grove',
            () => {
              expect(scene.odd).toContain('TREEDIR_QUOTE_RC=1');
              expect(scene.odd).toContain('PWNED_TREE_QUOTE=no');
            },
          );

          then(
            'the poll tree-facts read finds no tree, and naught runs on the grove',
            () => {
              expect(scene.odd).toContain('POLL_RC=1');
              expect(scene.odd).toContain('PWNED_POLL=no');
            },
          );
        },
      );

      when('[t5] the procedure sent to a grove does not decode there', () => {
        then(
          'it exits 97, runs naught, and says why — never an empty success',
          () => {
            expect(scene.odd).toContain('UNDECODED_RC=97');
            expect(scene.odd).toContain('RAN_UNDECODED=no');
            expect(scene.odd).toContain(
              "UNDECODED_ERR=💥 MalfunctionError: the procedure sent to 'grove-h' did not decode there, so naught ran (rc 97)",
            );
          },
        );
      });
    },
  );

  given('[case10] a duct split by a human, whose pane wandered off', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('split');
      const root = tempDirs.genOne({ slug: 'split' });
      const home = `${root}/svc-lessons.feat.book-a-lesson`;
      const away = `${root}/svc-other.feat.away`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: home, branch: 'feat/book-a-lesson' }),
          genRepoLine({ dir: away, branch: 'feat/away' }),
          `duct.open --on '${URI}' --cwd '${home}' >/dev/null`,
          // a seat from before the anchor: no @home_cwd at any scope
          `__duct_tmux set-option -u -t '${SESSION}' @home_cwd`,
          `__duct_tmux set-option -q -p -u -t '${SESSION}' @home_cwd`,
          // its shell wanders into another repo; converge on the pane path, bounded, then fail loud
          `__duct_tmux send-keys -t '${SESSION}' "cd '${away}'" Enter`,
          `turns=0; until [ "$(__duct_tmux display-message -p -t '${SESSION}' '#{pane_current_path}')" = '${away}' ]; do turns=$((turns + 1)); [ "$turns" -lt 60 ] || { echo "the pane never wandered"; exit 1; }; sleep 0.05; done`,
          `echo "--- refresh"`,
          `duct.refresh --on '${URI}'; echo "RC=$?"`,
          SHOWN_LINE,
          // a human splits the window; the new pane is the active one
          `__duct_tmux split-window -t '${SESSION}' -c '${away}'`,
          SHOWN_LINE,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const said = result.stdout.split('--- refresh')[1] ?? '';
      return { socket, result, said };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] a bare duct.refresh runs on the wandered seat', () => {
      then(
        'it stamps the tree the session was born in, never the live cwd',
        () => {
          expect(scene.said).toContain('RC=0');
          expect(scene.said).toContain(
            '🏷️  status box — svc-lessons · feat/book-a-lesson (pinned to the duct)',
          );
          expect(asShown(scene.result.stdout)[0]).toEqual(
            ' svc-lessons | feat/book-a-lesson ',
          );
        },
      );

      then('the render matches the snapshot', () => {
        expect(asMaskedOut(scene.said)).toMatchSnapshot();
      });
    });

    when('[t1] a human splits the window', () => {
      then('the new active pane still draws the duct own tree', () => {
        expect(asShown(scene.result.stdout)[1]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });

      then('the bars drawn match the snapshot', () => {
        expect(asShown(scene.result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case11] a duct whose home dir is gone', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('gone');
      const root = tempDirs.genOne({ slug: 'gone' });
      const repo = `${root}/svc-lessons.feat.book-a-lesson`;
      const gone = `${root}/svc-lessons.feat.dropped`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
          genRepoLine({ dir: gone, branch: 'feat/dropped' }),
          `duct.open --on '${URI}' --cwd '${repo}' >/dev/null`,
          // a --home that names a tree, which a dropped twin then removes
          `duct.refresh --on '${URI}' --home '${gone}' >/dev/null`,
          `rm -rf '${gone}'`,
          `echo "--- refresh"`,
          `duct.refresh --on '${URI}' | tee '${root}/refresh.out'; echo "RC=\${PIPESTATUS[0]}"`,
          SHOWN_LINE,
          // a resume: the found duct is opened again with its live tree as --cwd
          `echo "--- reopen"`,
          `duct.open --on '${URI}' --cwd '${repo}' | tee '${root}/reopen.out'; echo "RC=\${PIPESTATUS[0]}"`,
          SHOWN_LINE,
          // the boot nests each duct.open render under its `🔧 ducts` branch
          `source '${PATH_CREWWORK}'`,
          `echo "--- nested"`,
          `__crew_nest_duct_lines < '${root}/refresh.out'`,
          `__crew_nest_duct_lines < '${root}/reopen.out'`,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const sections = result.stdout.split('--- ');
      const said = sections[1] ?? '';
      const reopen = sections[2] ?? '';
      const nested = sections[3] ?? '';
      return { socket, result, said, reopen, nested, root, repo, gone };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] a bare duct.refresh stamps it', () => {
      then('the verb still succeeds — the bar is cosmetic', () => {
        expect(scene.said).toContain('RC=0');
      });

      then('it says NOT stamped, names the gone home, and the cure', () => {
        expect(scene.said).toContain(
          "🟡 status box NOT stamped — the duct's home",
        );
        expect(scene.said).toContain('svc-lessons.feat.dropped is gone');
        expect(scene.said).toContain(`rhx git.crew.refresh --tree ${TREE}`);
        expect(scene.said).not.toContain('(no repo)');
      });

      then('the bar keeps what it drew, never a blank stamped as cured', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/dropped ',
        );
      });

      then('the render matches the snapshot', () => {
        expect(scene.said.split(scene.root).join('$ROOT')).toMatchSnapshot();
      });
    });

    when('[t1] the found duct is opened again with its live tree', () => {
      then('the gone anchor yields to the --cwd, said with both paths', () => {
        expect(scene.reopen).toContain('RC=0');
        expect(scene.reopen).toContain(
          '🏠 home anchor CORRECTED — it named a dir that is gone',
        );
        expect(scene.reopen).toContain(`was: ${scene.gone}`);
        expect(scene.reopen).toContain(`now: ${scene.repo}`);
      });

      then('the bar is stamped from the live tree', () => {
        expect(scene.reopen).toContain(
          '🏷️  status box — svc-lessons · feat/book-a-lesson (pinned to the duct)',
        );
        expect(asShown(scene.result.stdout)[1]).toEqual(
          ' svc-lessons | feat/book-a-lesson ',
        );
      });

      then('the render matches the snapshot', () => {
        expect(scene.reopen.split(scene.root).join('$ROOT')).toMatchSnapshot();
      });
    });

    when('[t2] crew.boot nests both renders under its ducts branch', () => {
      then(
        'each child line steps one level deeper, never a second glyph',
        () => {
          expect(scene.nested).toContain('   │  ├─ 🏠 home anchor CORRECTED');
          expect(scene.nested).toContain(`   │  │  ├─ was: ${scene.gone}`);
          expect(scene.nested).toContain(`   │  │  └─ now: ${scene.repo}`);
          // the refresh render's fix is a child of its own `├─ 🟡 … NOT stamped` line, one level in
          expect(scene.nested).toContain(
            '   │  │  ├─ 🟡 status box NOT stamped',
          );
          expect(scene.nested).toContain('   │  │     └─ fix: repaint it');
          expect(scene.nested).not.toMatch(/├─ {4}[├└]─/);
        },
      );

      then('the nested render matches the snapshot', () => {
        expect(scene.nested.split(scene.root).join('$ROOT')).toMatchSnapshot();
      });
    });
  });

  given('[case13] the stamp output a move counts', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('count');
      const root = tempDirs.genOne({ slug: 'count' });
      const repo = `${root}/svc-lessons.feat.book-a-lesson`;
      const gone = `${root}/svc-lessons.feat.dropped`;
      const norepo = `${root}/scratch`;
      const cap = `${root}/boot.capture`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
          genRepoLine({ dir: gone, branch: 'feat/dropped' }),
          `mkdir -p '${norepo}'`,
          // one stamp that pins, one whose home is gone, one with no repo: the real lines
          `duct.open --on '${URI}' --cwd '${repo}' >> '${cap}'`,
          `duct.refresh --on '${URI}' --home '${gone}' >/dev/null`,
          `rm -rf '${gone}'`,
          `duct.refresh --on '${URI}' >> '${cap}'`,
          `duct.refresh --on '${URI}' --home '${norepo}' >> '${cap}'`,
          `echo "COUNT=$(__duct_stamp_misses_count '${cap}')"`,
          `__duct_stamp_misses_count '${root}/no-such.capture'; echo "UNREAD_RC=$?"`,
          // a heal cure reboots the seat: the reboot prints the same real stamp lines
          `head -1 '${cap}' > '${root}/good.capture'`,
          `source '${PATH_CREWWORK}'`,
          // .mock = `crew.reboot`, which replays the real stamp lines `duct.open` + `duct.refresh` wrote above
          // .why = the subject is the heal's count of misses over a reboot's words, not the reboot; a real reboot respawns a live claude seat
          // .real = the `duct.reboot` the crew verb calls runs for real in case5; a real `crew.reboot` on a live seat has no hermetic run here (the hetzner walk proves it; owed: `.dream/v2026_11_27.test.real-seat-boundaries-for-crew-move.md`)
          `crew.reboot() { cat "$FAKE_REBOOT_SAYS"; return "\${FAKE_REBOOT_RC:-0}"; }`,
          `echo "--- heal miss"`,
          `FAKE_REBOOT_SAYS='${cap}' __crew_heal_reboot svc-lessons.feat.x local mechanic '   ├─ '; echo "HEAL_RC=$?"`,
          `echo "--- heal good"`,
          `FAKE_REBOOT_SAYS='${root}/good.capture' __crew_heal_reboot svc-lessons.feat.x local mechanic '   ├─ '; echo "HEAL_RC=$?"`,
          `echo "--- heal fail"`,
          `FAKE_REBOOT_SAYS='${cap}' FAKE_REBOOT_RC=1 __crew_heal_reboot svc-lessons.feat.x local mechanic '   ├─ '; echo "HEAL_RC=$?"`,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const sections = result.stdout.split('--- heal ');
      return {
        socket,
        result,
        miss: sections[1] ?? '',
        good: sections[2] ?? '',
        fail: sections[3] ?? '',
      };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t1] a heal cure reboots a seat', () => {
      then('a bar the reboot could not stamp is said in one line', () => {
        expect(scene.miss).toContain('HEAL_RC=0');
        expect(scene.miss).toContain(
          '   ├─ 🟡 the seat bar is NOT stamped (the reboot said why); repaint it: rhx git.crew.refresh --tree svc-lessons.feat.x',
        );
        // the reboot's own lines stay off the heal render
        expect(scene.miss).not.toContain('status box');
      });

      then('the heal miss render matches the snapshot', () => {
        expect(scene.miss).toMatchSnapshot();
      });

      then('a bar the reboot stamped says naught', () => {
        expect(scene.good).toContain('HEAL_RC=0');
        expect(scene.good).not.toContain('seat bar');
      });

      then('a failed reboot fails the cure, with no bar line', () => {
        expect(scene.fail).toContain('HEAL_RC=1');
        expect(scene.fail).not.toContain('seat bar');
      });
    });

    when('[t0] the counter reads the real stamp lines', () => {
      then(
        'it counts the gone home and the no-repo pin, not the good pin',
        () => {
          // .why = the move's summary rides this count; a reword of a stamp line goes red here
          expect(scene.result.stdout).toContain('COUNT=2');
        },
      );

      then('a capture it cannot read is no count, rc 2', () => {
        expect(scene.result.stdout).toContain('UNREAD_RC=2');
      });
    });
  });

  given('[case12] a crew worktree whose branch is switched', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('switch');
      const root = tempDirs.genOne({ slug: 'switch' });
      const main = `${root}/svc-lessons`;
      const tree = `${root}/_worktrees/svc-lessons.beav.feat-old`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: main, branch: 'main' }),
          `git -C '${main}' worktree add -q -b feat/old '${tree}'`,
          `duct.open --on '${URI}' --cwd '${tree}' >/dev/null`,
          SHOWN_LINE,
          `git -C '${tree}' switch -q -c feat/new`,
          `duct.refresh --on '${URI}' >/dev/null`,
          SHOWN_LINE,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      return { socket, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] the duct opens on the worktree', () => {
      then('the bar names the repo by its main checkout', () => {
        expect(asShown(scene.result.stdout)[0]).toEqual(
          ' svc-lessons | feat/old ',
        );
      });

      then('the bar drawn matches the snapshot', () => {
        expect(asShown(scene.result.stdout)[0]).toMatchSnapshot();
      });
    });

    when('[t1] the branch is switched, then the duct refreshed', () => {
      then('the repo label holds, and the branch follows the switch', () => {
        // .why = the dir name still says feat-old; a strip of `.<branch>` would show the whole slug
        expect(asShown(scene.result.stdout)[1]).toEqual(
          ' svc-lessons | feat/new ',
        );
      });

      then('the bar drawn matches the snapshot', () => {
        expect(asShown(scene.result.stdout)[1]).toMatchSnapshot();
      });
    });
  });

  given('[case4] duct.refresh asked for --all and --home at once', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('allhome');
      const result = runDuct({
        body: `duct.refresh --all --home /tmp; echo "RC=$?"`,
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      return { socket, result };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] it runs', () => {
      then('it refuses, since one home cannot fit a fleet', () => {
        expect(scene.result.stdout).toContain('RC=2');
      });

      then('the refusal render matches the snapshot', () => {
        expect(
          `${scene.result.stdout}${scene.result.stderr}`,
        ).toMatchSnapshot();
      });
    });
  });

  given('[case14] a home named by a relative path', () => {
    const scene = useBeforeAll(async () => {
      const socket = genSocket('relhome');
      const root = tempDirs.genOne({ slug: 'relhome' });
      const repo = `${root}/svc-lessons.feat.book-a-lesson`;
      const result = runDuct({
        body: [
          genRepoLine({ dir: repo, branch: 'feat/book-a-lesson' }),
          `cd '${root}'`,
          `echo "--- open"`,
          `duct.open --on '${URI}' --cwd 'svc-lessons.feat.book-a-lesson'; echo "RC=$?"`,
          `echo "ANCHOR=$(__duct_tmux display-message -p -t '${SESSION}' '#{@home_cwd}')"`,
          `echo "--- refresh"`,
          `duct.refresh --on '${URI}' --home 'svc-lessons.feat.book-a-lesson'; echo "RC=$?"`,
        ].join('\n'),
        socket,
        ductworkDir: tempDirs.genOne({ slug: 'registry' }),
      });
      const sections = `${result.stdout}`.split('--- ');
      return {
        socket,
        result,
        open: sections[1] ?? '',
        refresh: `${sections[2] ?? ''}${result.stderr}`,
      };
    });

    afterAll(() => delTmuxServer({ socket: scene.socket }));

    when('[t0] duct.open is born with a relative --cwd', () => {
      then('it opens, says the anchor was not set, and anchors naught', () => {
        expect(scene.open).toContain('RC=0');
        expect(scene.open).toContain(
          "🟡 home anchor NOT set — --cwd 'svc-lessons.feat.book-a-lesson' is not an absolute path",
        );
        expect(scene.open).toContain('ANCHOR=\n');
      });

      then('the open render matches the snapshot', () => {
        expect(scene.open).toMatchSnapshot();
      });
    });

    when('[t1] duct.refresh is handed a relative --home', () => {
      then('it refuses, exit 2, and names the fix', () => {
        expect(scene.refresh).toContain('RC=2');
        expect(scene.refresh).toContain(
          "✋ ConstraintError: duct.refresh --home 'svc-lessons.feat.book-a-lesson' is not an absolute path",
        );
      });

      then('the refusal render matches the snapshot', () => {
        expect(scene.refresh).toMatchSnapshot();
      });
    });
  });
});
