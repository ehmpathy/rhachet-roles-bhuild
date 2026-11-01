import * as fs from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { asRadioUpstreamReason } from '@src/domain.operations/radio/record/asRadioUpstreamReason';

import { daoRadioTaskViaGhIssues } from './daoRadioTaskViaGhIssues';
import { runGhCommand } from './runGhCommand';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a stalled gh, and the exact argv gh receives, cannot be provoked or observed
 *         against real github; the stub logs each argv entry on its own line, and sleeps
 *         on demand
 * .real = daoRadioTaskViaGhIssues.integration.test.ts runs the dao against real github
 */
const STUB_GH = `#!/usr/bin/env bash
printf '%s\\n' "---" "$@" >> "$STUB_GH_DIR/argv.log"
if [ -f "$STUB_GH_DIR/sleep" ]; then exec sleep "$(cat "$STUB_GH_DIR/sleep")"; fi
case "$1 $2" in
  "issue list") echo "[]" ;;
  "issue create") echo "https://github.com/stub/stub/issues/7" ;;
  *) echo "stub gh: unexpected call: $*" >&2; exit 1 ;;
esac
`;

/**
 * .what = every argv entry the stub gh received, one per line, calls split by `---`
 * .why = assert what reached gh, byte for byte
 */
const getArgvLog = (input: { dir: string }): string[] => {
  const file = path.join(input.dir, 'argv.log');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
};

describe('daoRadioTaskViaGhIssues — shell safety and send timeout', () => {
  const dir = genTempDir({ slug: 'gh-dao-shell-stub' });
  const pathPrior = process.env.PATH;
  const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });
  const context = {
    github: { auth: { token: 'ghp_stubToken000', role: 'as-robot' as const } },
    git: { repo },
  };

  // put the stub gh first on PATH
  beforeAll(() => {
    fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = dir;
    process.env.PATH = `${dir}:${pathPrior}`;
  });

  // each act starts with a clean argv log and no sleep
  const resetStub = (): void => {
    fs.rmSync(path.join(dir, 'argv.log'), { force: true });
    fs.rmSync(path.join(dir, 'sleep'), { force: true });
  };
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  given('[case1] a gh call that stalls past its timeout', () => {
    when('[t0] the call runs under a short timeout', () => {
      const result = useThen('it fails', async () => {
        resetStub();
        fs.writeFileSync(path.join(dir, 'sleep'), '20');
        const startedMs = Date.now();
        const error = await getError(
          runGhCommand(
            { args: ['issue', 'list'], timeout: { milliseconds: 300 } },
            context,
          ),
        );
        return {
          isMalfunction: error instanceof MalfunctionError,
          message: error.message,
          elapsedMs: Date.now() - startedMs,
          calls: getArgvLog({ dir }).filter((line) => line === '---').length,
        };
      });

      then('it fails loud as a malfunction, never hangs', () => {
        expect(result.isMalfunction).toEqual(true);
        expect(result.elapsedMs).toBeLessThan(5_000);
      });

      then(
        'its text reads as upstream:transient, so the drain halts and the record stays held',
        () => {
          expect(asRadioUpstreamReason({ message: result.message })).toEqual(
            'upstream:transient',
          );
        },
      );

      then('gh was called once, never retried', () => {
        expect(result.calls).toEqual(1);
      });
    });
  });

  given('[case2] a task title that holds shell syntax', () => {
    const title = `pwn $(touch ${dir}/pwned-sub) and \`touch ${dir}/pwned-tick\` "q" 'q'`;
    const task = new RadioTask({
      exid: '',
      title,
      description: 'shell syntax must stay text',
      status: RadioTaskStatus.QUEUED,
      repo,
      pushedBy: 'tester',
      pushedAt: '2026-10-26' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    when('[t0] the task is findserted', () => {
      const result = useThen('it is created', async () => {
        resetStub();
        const created = await daoRadioTaskViaGhIssues.set.findsert(
          { task },
          context,
        );
        return { exid: created.exid, argv: getArgvLog({ dir }) };
      });

      then('the title reaches gh as one literal argv entry', () => {
        const index = result.argv.indexOf('--title');
        expect(result.argv[index + 1]).toEqual(`🎙️ task - ${title}`);
      });

      then('no command in the title ran', () => {
        expect(fs.existsSync(path.join(dir, 'pwned-sub'))).toEqual(false);
        expect(fs.existsSync(path.join(dir, 'pwned-tick'))).toEqual(false);
      });

      then('the issue is created', () => {
        expect(result.exid).toEqual('7');
      });
    });
  });

  given('[case3] an exid that is not an issue number', () => {
    const exid = `7; touch ${dir}/pwned-exid`;

    when('[t0] the task is read by that exid', () => {
      const result = useThen('it is refused', async () => {
        resetStub();
        const error = await getError(
          daoRadioTaskViaGhIssues.get.one.byPrimary({ exid }, context),
        );
        return {
          isConstraint: error instanceof ConstraintError,
          argv: getArgvLog({ dir }),
        };
      });

      then('it is refused as a constraint, before any gh call', () => {
        expect(result.isConstraint).toEqual(true);
        expect(result.argv).toEqual([]);
      });
    });

    when('[t1] the task is closed by that exid', () => {
      const result = useThen('it is refused', async () => {
        resetStub();
        const error = await getError(
          daoRadioTaskViaGhIssues.del({ exid }, context),
        );
        return {
          isConstraint: error instanceof ConstraintError,
          argv: getArgvLog({ dir }),
          pwned: fs.existsSync(path.join(dir, 'pwned-exid')),
        };
      });

      then('it is refused as a constraint, before any gh call', () => {
        expect(result.isConstraint).toEqual(true);
        expect(result.argv).toEqual([]);
        expect(result.pwned).toEqual(false);
      });
    });
  });
});
