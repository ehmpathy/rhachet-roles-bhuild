import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { DETAIL_UNREACHED_BY_BUDGET } from './asRadioFateUnreachedByBudget';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = the clamp must see whether a drain sends after its deadline; the stub logs each
 *         create to a file, so a late send is caught even after the drain call returned
 * .real = the gh dao itself in daoRadioTaskViaGhIssues.integration.test.ts
 */
const STUB_GH = `#!/usr/bin/env bash
args="$*"
case "$1 $2" in
  "api user") echo "stubbot"; exit 0 ;;
  "issue list") echo "[]" ;;
  "issue create")
    echo "$args" >> "$STUB_GH_DIR/creates.log"
    n="$(cat "$STUB_GH_DIR/seq" 2>/dev/null || echo 800)"; n=$((n + 1)); echo "$n" > "$STUB_GH_DIR/seq"
    echo "https://github.com/stub/stub/issues/$n" ;;
  *) echo "stub gh: unexpected call: $args" >&2; exit 1 ;;
esac
`;

const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });

/**
 * .what = a shell auth that stalls 3s, then prints a token
 * .why = a vault wait or a hardware prompt, past a 2s lease; `sleep` runs in a child of the
 *        shell, so a kill of the shell alone does not end it — the drain must still move on
 */
const authStalled =
  'as-robot:shx(sleep 3 && echo ghp_radioDeadlineTestTokenStub0000000)';

/**
 * .what = the lease the clamp runs under: 2s, so the drain deadline sits at 1.5s
 */
const lockLease = { milliseconds: 2_000 };

/**
 * .what = a temp git repo + a temp home, with the sandpine org gate open
 * .why = every record here meets an open gate, so only the auth derive can stall it
 */
const genScene = (input: { slug: string }) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const homeDir = genTempDir({ slug: `${input.slug}-home` });
  const dirMeter = path.join(
    homeDir,
    '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
  );
  fs.mkdirSync(dirMeter, { recursive: true });
  fs.writeFileSync(
    path.join(dirMeter, 'radio.uses.org.jsonc'),
    JSON.stringify({ orgs: { sandpine: 'allowed' } }),
  );
  return { cwd, homeDir };
};

/**
 * .what = transcribe one create into the queue, unsent
 */
const holdCreate = (input: { cwd: string; title: string }) =>
  setRadioTaskRecordFromPush(
    {
      push: {
        repo,
        via: RadioChannel.GH_ISSUES,
        auth: null,
        idem: null,
        title: input.title,
        description: `details for ${input.title}`,
        exid: null,
        status: null,
      },
    },
    { dir: path.join(input.cwd, '.behavior', '.radio'), cwd: input.cwd },
  ).record;

/**
 * .what = wait a span of real time
 * .why = a drain whose lease ran out would send once the stalled auth answers; the clamp
 *        waits past that moment before it reads the stub's create log
 */
const getAfterWait = (input: { milliseconds: number }) =>
  new Promise<void>((settle) => setTimeout(settle, input.milliseconds));

describe('setRadioTaskRecordsDrained — the drain deadline', () => {
  const pathPrior = process.env.PATH;

  // put the stub gh first on PATH
  beforeAll(() => {
    const dir = genTempDir({ slug: 'radio-deadline-stub-gh' });
    fs.writeFileSync(path.join(dir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = dir;
    process.env.PATH = `${dir}:${pathPrior}`;
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  given(
    '[case1] two held creates, and a typed shell auth that stalls past the lease',
    () => {
      const scene = useBeforeAll(async () => {
        const { cwd, homeDir } = genScene({ slug: 'radio-deadline-auth' });
        const first = holdCreate({ cwd, title: 'lesson reminders' });
        const second = holdCreate({ cwd, title: 'wetsuit sizes' });
        return { cwd, homeDir, first, second };
      });

      when('[t0] a drain runs under a 2s lease', () => {
        const result = useThen(
          'it returns, then the stall clears',
          async () => {
            // the drain, its error kept rather than thrown, so a lease overrun is visible
            const drained = await setRadioTaskRecordsDrained(
              {},
              {
                cwd: scene.cwd,
                homeDir: scene.homeDir,
                env: process.env,
                shx,
                authOverride: authStalled,
                lockLease,
              },
            ).then(
              (output) => ({ fates: output.fates, error: null }),
              (error: unknown) => ({ fates: null, error }),
            );

            // wait past the moment the stalled auth answers, then read what was sent
            await getAfterWait({ milliseconds: 3_000 });
            const logPath = path.join(
              process.env.STUB_GH_DIR ?? '',
              'creates.log',
            );
            const creates = fs.existsSync(logPath)
              ? fs.readFileSync(logPath, 'utf8')
              : '';
            const dir = path.join(scene.cwd, '.behavior', '.radio');
            const records = daoRadioTaskRecord.get
              .all({ dirs: [dir] })
              .map((entry) => entry.record);
            return { drained, creates, records };
          },
        );

        then('the drain returns its fates, inside its lease', () => {
          expect(result.drained.error).toEqual(null);
          expect(result.drained.fates).toHaveLength(2);
        });

        then('each record is left not reached', () => {
          for (const fate of result.drained.fates ?? []) {
            expect(fate.fate).toEqual('held');
            expect(fate.fate === 'held' ? fate.detail : null).toEqual(
              DETAIL_UNREACHED_BY_BUDGET,
            );
          }
        });

        then('the drain sends naught, even once the stall clears', () => {
          expect(result.creates).toEqual('');
        });

        then('each record stays queued on disk, with no fault written', () => {
          expect(result.records).toHaveLength(2);
          for (const record of result.records) {
            expect(record.recordStatus).toEqual(RadioTaskRecordStatus.QUEUED);
            expect(record.reason).toEqual(null);
          }
        });
      });
    },
  );
});
