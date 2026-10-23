import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { getBranchBehaviorBind } from '@src/domain.operations/behavior/bind/getBranchBehaviorBind';
import { shx } from '@src/infra/shell/shx';

import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { getOneRadioTaskRecordHome } from './getOneRadioTaskRecordHome';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .what = a temp git repo + a temp home, isolated per scene
 * .why = the record dirs live in the repo; the radio.uses meters live in the home
 */
const genScene = (input: { slug: string }) => {
  const cwd = genTempDir({ slug: input.slug, git: true });
  const homeDir = genTempDir({ slug: `${input.slug}-home` });
  return { cwd, homeDir };
};

/**
 * .what = set the local radio.uses state of a scene repo
 * .why = open or shut the gate the way a human would
 */
const setLocalGate = (input: { cwd: string; state: 'allowed' | 'blocked' }) => {
  fs.mkdirSync(path.join(input.cwd, '.meter'), { recursive: true });
  fs.writeFileSync(
    path.join(input.cwd, '.meter', 'radio.uses.jsonc'),
    JSON.stringify({ state: input.state }),
  );
};

/**
 * .what = set the org radio.uses state in a scene home
 * .why = shut one org while another stays open (C20)
 */
const setOrgGate = (input: {
  homeDir: string;
  orgs: Record<string, 'allowed' | 'blocked'>;
}) => {
  const dir = path.join(
    input.homeDir,
    '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
  );
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'radio.uses.org.jsonc'),
    JSON.stringify({ orgs: input.orgs }),
  );
};

/**
 * .what = transcribe a push then dispatch it, as the cli does
 * .why = each when() drives one push through the recorder
 */
const pushViaRecorder = async (input: {
  cwd: string;
  homeDir: string;
  repo: RadioTaskRepo;
  via?: RadioChannel;
  auth?: string | null;
  title?: string | null;
  exid?: string | null;
  status?: RadioTaskStatus | null;
  env?: NodeJS.ProcessEnv;
}) => {
  const context = {
    cwd: input.cwd,
    homeDir: input.homeDir,
    env: { ...process.env, ...input.env },
    shx,
  };
  const bind = getBranchBehaviorBind({}, { cwd: input.cwd }); // as the cli composes it
  const home = getOneRadioTaskRecordHome({ bind }, context);
  const { record } = setRadioTaskRecordFromPush(
    {
      push: {
        repo: input.repo,
        via: input.via ?? RadioChannel.OS_FILEOPS,
        auth: input.auth ?? null,
        idem: null,
        title: input.title ?? null,
        description: input.title ? `details for ${input.title}` : null,
        exid: input.exid ?? null,
        status: input.status ?? null,
      },
    },
    { dir: home.dir, cwd: input.cwd },
  );
  const dispatched = await setRadioTaskRecordsDrainedByPush(
    { record, dir: home.dir },
    context,
  );
  return { home, ...dispatched };
};

/**
 * .what = every record file in a scene repo
 * .why = assert no push is doubled and none is lost
 */
const getAllRecords = (input: { cwd: string }) =>
  daoRadioTaskRecord.get.all({
    dirs: getAllRadioTaskRecordDirs({}, { cwd: input.cwd }),
  });

/**
 * .what = every task file the os.fileops store holds for a target
 * .why = assert what landed upstream, independent of the local records
 */
const getAllTasksUpstream = (repo: RadioTaskRepo): string[] => {
  const dir = path.join(os.homedir(), 'git', '.radio', repo.owner, repo.name);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('._.md'));
};

/**
 * .what = every untracked file git would let a human stage in a scene repo, with its bytes
 * .why = the radio's writes must be safe to commit as-is; gitignored files are exempt
 */
const getAllFilesStageable = (input: {
  cwd: string;
}): { rel: string; content: string }[] =>
  execSync('git ls-files --others --exclude-standard', { cwd: input.cwd })
    .toString('utf-8')
    .split('\n')
    .filter((rel) => rel.length > 0)
    .sort()
    .map((rel) => ({
      rel,
      content: fs.readFileSync(path.join(input.cwd, rel), 'utf-8'),
    }));

/**
 * .what = stage every file in a scene repo, then run this repo's real timestamp check on it
 * .why = the clamp grades the radio's writes with the commit gate itself, never a copy of its
 *        rule; a second copy drifts from the first (as ecowork.commit [case46] does for the store)
 */
const getOneHookVerdictOnStaged = (input: {
  cwd: string;
}): { status: number | null; out: string } => {
  execSync('git add -A', { cwd: input.cwd });
  const run = spawnSync(
    'bash',
    [
      path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '.husky',
        'check.timestamps.sh',
      ),
    ],
    { cwd: input.cwd },
  );
  return {
    status: run.status,
    out: `${run.stdout.toString('utf-8')}${run.stderr.toString('utf-8')}`.trim(),
  };
};

/**
 * .what = copy a target's os.fileops task files into a scratch git repo, staged, then grade them
 * .why = the os.fileops store lives outside any repo; a consumer that tracks its tasks would
 *        commit them, so they face the same gate
 */
const getOneHookVerdictOnTasksUpstream = (input: {
  repo: RadioTaskRepo;
}): { tasks: string[]; status: number | null; out: string } => {
  const dirStore = path.join(
    os.homedir(),
    'git',
    '.radio',
    input.repo.owner,
    input.repo.name,
  );
  const dirScratch = genTempDir({ slug: 'recorder-clock-tasks', git: true });
  const tasks = getAllTasksUpstream(input.repo);
  tasks.forEach((rel) =>
    fs.copyFileSync(path.join(dirStore, rel), path.join(dirScratch, rel)),
  );
  return { tasks, ...getOneHookVerdictOnStaged({ cwd: dirScratch }) };
};

describe('setRadioTaskRecordsDrainedByPush', () => {
  // unique os.fileops targets per run; the os.fileops store lives under the real home
  const runId = Date.now();
  const repoOpen = new RadioTaskRepo({
    owner: 'recorder-open',
    name: `repo-${runId}`,
  });
  const repoShut = new RadioTaskRepo({
    owner: 'recorder-shut',
    name: `repo-${runId}`,
  });
  const repoRetype = new RadioTaskRepo({
    owner: 'recorder-retype',
    name: `repo-${runId}`,
  });
  const repoFault = new RadioTaskRepo({
    owner: 'recorder-fault',
    name: `repo-${runId}`,
  });
  const repoFirst = new RadioTaskRepo({
    owner: 'recorder-first',
    name: `repo-${runId}`,
  });
  const repoSweep = new RadioTaskRepo({
    owner: 'recorder-sweep',
    name: `repo-${runId}`,
  });
  const repoRace = new RadioTaskRepo({
    owner: 'recorder-race',
    name: `repo-${runId}`,
  });
  const repoClock = new RadioTaskRepo({
    owner: 'recorder-clock',
    name: `repo-${runId}`,
  });
  const repoLegacy = new RadioTaskRepo({
    owner: 'recorder-legacy',
    name: `repo-${runId}`,
  });
  const repoGhDemo = new RadioTaskRepo({
    owner: 'ehmpathy',
    name: 'rhachet-roles-bhuild-demo',
  });
  afterAll(() => {
    [
      repoOpen,
      repoShut,
      repoRetype,
      repoFault,
      repoFirst,
      repoSweep,
      repoRace,
      repoClock,
      repoLegacy,
    ].forEach((repo) =>
      fs.rmSync(path.join(os.homedir(), 'git', '.radio', repo.owner), {
        recursive: true,
        force: true,
      }),
    );
  });

  given(
    '[case1] an unbound repo; the radio starts shut (C7, C10, C11, C4, C9, R2)',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ slug: 'recorder-case1' }),
      );

      when('[t0] a push meets the shut gate', () => {
        const result = useThen('it is dispatched', async () =>
          pushViaRecorder({ ...scene, repo: repoOpen, title: 'task a' }),
        );

        then('the push is held, with the block as reason', () => {
          expect(result.pushed.fate).toEqual('held');
          expect(result.pushed.record.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
          expect(result.pushed.record.reason).toEqual(
            'radio.uses:blocked — default',
          );
        });

        then('it is recorded in .behavior/.radio/', () => {
          expect(result.home.place).toEqual('unbound');
          expect(result.home.dir).toEqual(
            path.join(scene.cwd, '.behavior', '.radio'),
          );
          expect(getAllRecords(scene)).toHaveLength(1);
        });
      });

      when(
        '[t1] the same push is repeated, then a second task is pushed',
        () => {
          const result = useThen('both are dispatched', async () => {
            await pushViaRecorder({
              ...scene,
              repo: repoOpen,
              title: 'task a',
            });
            return pushViaRecorder({
              ...scene,
              repo: repoOpen,
              title: 'task b',
            });
          });

          then(
            'the repeat lands on its extant record — two records, not three',
            () => {
              expect(result.pushed.fate).toEqual('held');
              expect(getAllRecords(scene)).toHaveLength(2);
              expect(getAllRadioTaskRecordsHeld({}, scene)).toHaveLength(2);
            },
          );
        },
      );

      when('[t2] the human opens the radio and a third task is pushed', () => {
        const result = useThen('it is dispatched', async () => {
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          return pushViaRecorder({ ...scene, repo: repoOpen, title: 'task c' });
        });

        then('the backlog drains oldest first, then this push', () => {
          expect(
            result.others.map((fate) => [fate.fate, fate.record.title]),
          ).toEqual([
            ['delivered', 'task a'],
            ['delivered', 'task b'],
          ]);
          expect(result.pushed.fate).toEqual('delivered');
        });

        then(
          'every record is DELIVERED with its exid, and the backlog is empty',
          () => {
            const records = getAllRecords(scene).map(({ record }) => record);
            expect(
              records.every(
                (r) => r.recordStatus === RadioTaskRecordStatus.DELIVERED,
              ),
            ).toBe(true);
            expect(records.every((r) => r.deliveredExid !== null)).toBe(true);
            expect(getAllRadioTaskRecordsHeld({}, scene)).toHaveLength(0);
          },
        );
      });

      when(
        '[t3] a delivered task is re-pushed while the gate is shut again',
        () => {
          const result = useThen('it is dispatched', async () => {
            setLocalGate({ cwd: scene.cwd, state: 'blocked' });
            return pushViaRecorder({
              ...scene,
              repo: repoOpen,
              title: 'task a',
            });
          });

          then('it reads as already landed; naught is held', () => {
            expect(result.pushed.fate).toEqual('landed');
            expect(getAllRadioTaskRecordsHeld({}, scene)).toHaveLength(0);
          });
        },
      );

      when(
        '[t4] a delivered task is re-pushed through an open gate (C3)',
        () => {
          const result = useThen('it is dispatched', async () => {
            setLocalGate({ cwd: scene.cwd, state: 'allowed' });
            const pushed = await pushViaRecorder({
              ...scene,
              repo: repoOpen,
              title: 'task a',
            });
            return { ...pushed, tasksUpstream: getAllTasksUpstream(repoOpen) };
          });

          then(
            'the local mark answers: it reads as landed, with naught sent',
            () => {
              expect(result.pushed.fate).toEqual('landed');
              expect(result.others).toEqual([]);
            },
          );

          then('upstream still holds three tasks — no second one', () => {
            expect(result.tasksUpstream).toHaveLength(3);
          });
        },
      );

      when(
        '[t5] a record lost its DELIVERED mark, then a new task is pushed (case=4 t0)',
        () => {
          const result = useThen('it is dispatched', async () => {
            const [lost] = getAllRecords(scene).filter(
              ({ record }) => record.title === 'task a',
            );
            if (!lost)
              throw new MalfunctionError('record of task a absent', {
                hint: 'the prior push must have recorded task a before this step',
              });
            daoRadioTaskRecord.set.upsert({
              dir: lost.dir,
              record: new RadioTaskRecord({
                ...lost.record,
                recordStatus: RadioTaskRecordStatus.QUEUED,
                deliveredExid: null,
              }),
            });
            const pushed = await pushViaRecorder({
              ...scene,
              repo: repoOpen,
              title: 'task d',
            });
            return { ...pushed, tasksUpstream: getAllTasksUpstream(repoOpen) };
          });

          then(
            'the findsert finds the issue upstream and marks it delivered',
            () => {
              expect(
                result.others.map((fate) => [
                  fate.fate,
                  fate.record.title,
                  fate.fate === 'delivered' ? fate.outcome : null,
                ]),
              ).toEqual([['delivered', 'task a', 'found']]);
            },
          );

          then(
            'upstream holds four tasks — task d, and no second task a',
            () => {
              expect(result.tasksUpstream).toHaveLength(4);
            },
          );
        },
      );
    },
  );

  given('[case2] a held record whose target org stays shut (C20, X1)', () => {
    const scene = useBeforeAll(async () => {
      const paths = genScene({ slug: 'recorder-case2' });
      setOrgGate({
        homeDir: paths.homeDir,
        orgs: { [repoShut.owner]: 'blocked' },
      });
      return paths;
    });

    when(
      '[t0] a push to the shut org is held, then a push to an open org drains',
      () => {
        const result = useThen('both are dispatched', async () => {
          await pushViaRecorder({
            ...scene,
            repo: repoShut,
            title: 'task shut',
          });
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          return pushViaRecorder({
            ...scene,
            repo: repoOpen,
            title: 'task open',
          });
        });

        then('the open push is delivered', () => {
          expect(result.pushed.fate).toEqual('delivered');
        });

        then('the shut org task stays held, with who lifts its gate', () => {
          expect(result.others).toEqual([
            expect.objectContaining({
              fate: 'held',
              lift: `rhx radio.uses --org ${repoShut.owner} allow`,
            }),
          ]);
          expect(getAllRadioTaskRecordsHeld({}, scene)).toHaveLength(1);
        });
      },
    );
  });

  given('[case3] a held record whose own auth cannot be derived (C22)', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'recorder-case3' }),
    );

    when(
      '[t0] a gh push with an unset env token is held, then an os.fileops push drains',
      () => {
        const result = useThen('both are dispatched', async () => {
          await pushViaRecorder({
            ...scene,
            repo: repoOpen,
            via: RadioChannel.GH_ISSUES,
            auth: 'as-robot:env(RADIO_RECORDER_TEST_TOKEN_ABSENT)',
            title: 'task gh',
          });
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          return pushViaRecorder({
            ...scene,
            repo: repoOpen,
            title: 'task fileops',
          });
        });

        then(
          'the gh record stays held as upstream:auth; it never borrows the push context',
          () => {
            expect(result.others).toHaveLength(1);
            expect(result.others[0]?.fate).toEqual('held');
            expect(result.others[0]?.record.reason).toEqual('upstream:auth');
          },
        );

        then('the os.fileops push is still delivered', () => {
          expect(result.pushed.fate).toEqual('delivered');
        });
      },
    );
  });

  given('[case4] an update that upstream refuses (U3)', () => {
    const scene = useBeforeAll(async () => {
      const paths = genScene({ slug: 'recorder-case4' });
      setLocalGate({ cwd: paths.cwd, state: 'allowed' });
      return paths;
    });

    when('[t0] a claim targets a task upstream does not hold', () => {
      const result = useThen('it is dispatched', async () =>
        pushViaRecorder({
          ...scene,
          repo: repoOpen,
          exid: 'absent-999',
          status: RadioTaskStatus.CLAIMED,
        }),
      );

      then('the record closes as REFUSED, with the reason', () => {
        expect(result.pushed.fate).toEqual('refused');
        expect(result.pushed.record.recordStatus).toEqual(
          RadioTaskRecordStatus.REFUSED,
        );
        expect(result.pushed.record.reason).toContain('task not found');
      });
    });

    when('[t1] a later push drains', () => {
      const result = useThen('it is dispatched', async () =>
        pushViaRecorder({
          ...scene,
          repo: repoOpen,
          title: 'task after refusal',
        }),
      );

      then('the refused record is never retried', () => {
        expect(result.others).toHaveLength(0);
        expect(result.pushed.fate).toEqual('delivered');
      });
    });
  });

  given('[case5] a branch bound to one route (R1)', () => {
    const scene = useBeforeAll(async () => {
      const paths = genScene({ slug: 'recorder-case5' });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: paths.cwd,
      })
        .toString()
        .trim();
      const bindDir = path.join(
        paths.cwd,
        '.behavior',
        'v2026_01_01.demo',
        '.bind',
      );
      fs.mkdirSync(bindDir, { recursive: true });
      fs.writeFileSync(path.join(bindDir, `${branch}.flag`), '');
      return paths;
    });

    when('[t0] a push meets the shut gate', () => {
      const result = useThen('it is dispatched', async () =>
        pushViaRecorder({ ...scene, repo: repoOpen, title: 'task routed' }),
      );

      then('it is recorded in the route .radio/', () => {
        expect(result.home.place).toEqual('route');
        expect(result.home.dir).toEqual(
          path.join(scene.cwd, '.behavior', 'v2026_01_01.demo', '.radio'),
        );
        expect(getAllRadioTaskRecordsHeld({}, scene)).toHaveLength(1);
      });
    });
  });

  given('[case5.1] a branch bound to two routes (R3)', () => {
    const routes = ['v2026_01_01.alpha', 'v2026_01_02.beta'];
    const scene = useBeforeAll(async () => {
      const paths = genScene({ slug: 'recorder-case5-multibound' });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: paths.cwd,
      })
        .toString()
        .trim();
      routes.forEach((route) => {
        const bindDir = path.join(paths.cwd, '.behavior', route, '.bind');
        fs.mkdirSync(bindDir, { recursive: true });
        fs.writeFileSync(path.join(bindDir, `${branch}.flag`), '');
      });
      return paths;
    });

    when('[t0] a push meets the shut gate', () => {
      const result = useThen('it is dispatched', async () =>
        pushViaRecorder({ ...scene, repo: repoOpen, title: 'task multibound' }),
      );

      then('it is held beside the routes, in .behavior/.radio/', () => {
        expect(result.pushed.fate).toEqual('held');
        expect(result.home.place).toEqual('multibound');
        expect(result.home.dir).toEqual(
          path.join(scene.cwd, '.behavior', '.radio'),
        );
      });

      then('both binds are named', () => {
        expect([...result.home.binds].sort()).toEqual(
          routes.map((route) => path.join('.behavior', route)),
        );
      });

      then('no route .radio/ holds it', () => {
        routes.forEach((route) =>
          expect(
            fs.existsSync(path.join(scene.cwd, '.behavior', route, '.radio')),
          ).toBe(false),
        );
        expect(getAllRadioTaskRecordsHeld({}, scene)).toHaveLength(1);
      });
    });
  });

  given('[case6] a held task re-typed through an open gate (C5)', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'recorder-case6' }),
    );

    when('[t0] the held task is pushed again once the radio opens', () => {
      const result = useThen('both pushes run', async () => {
        await pushViaRecorder({ ...scene, repo: repoRetype, title: 'task x' });
        setLocalGate({ cwd: scene.cwd, state: 'allowed' });
        const pushed = await pushViaRecorder({
          ...scene,
          repo: repoRetype,
          title: 'task x',
        });
        return { ...pushed, tasksUpstream: getAllTasksUpstream(repoRetype) };
      });

      then('the push lands on its held record and delivers it once', () => {
        expect(result.pushed.fate).toEqual('delivered');
        expect(result.others).toEqual([]);
        expect(getAllRecords(scene)).toHaveLength(1);
      });

      then('upstream holds one task', () => {
        expect(result.tasksUpstream).toHaveLength(1);
      });
    });
  });

  given(
    '[case7] a drain whose first record meets an upstream fault (C13, C16)',
    () => {
      // .note = a robot env token github rejects yields a real 401, the same way the gh
      //         acceptance suite provokes one; the demo repo is the sanctioned target
      const scene = useBeforeAll(async () =>
        genScene({ slug: 'recorder-case7' }),
      );
      const envTokenRejected = {
        RADIO_RECORDER_TEST_TOKEN_REJECTED:
          'ghp_radioRecorderTestTokenRejected0000',
      };

      when(
        '[t0] a gh record and a file record are held, then a third push opens the gate',
        () => {
          const result = useThen('all three pushes run', async () => {
            await pushViaRecorder({
              ...scene,
              repo: repoGhDemo,
              via: RadioChannel.GH_ISSUES,
              auth: 'as-robot:env(RADIO_RECORDER_TEST_TOKEN_REJECTED)',
              title: 'task gh',
              env: envTokenRejected,
            });
            await pushViaRecorder({
              ...scene,
              repo: repoFault,
              title: 'task after',
              env: envTokenRejected,
            });
            setLocalGate({ cwd: scene.cwd, state: 'allowed' });
            const pushed = await pushViaRecorder({
              ...scene,
              repo: repoFault,
              title: 'task probe',
              env: envTokenRejected,
            });
            return {
              ...pushed,
              tasksUpstream: getAllTasksUpstream(repoFault),
              heldStored: getAllRadioTaskRecordsHeld({}, scene),
            };
          });

          then(
            'the gh record is held as upstream:401 and halts the drain',
            () => {
              expect(result.others[0]).toMatchObject({
                fate: 'held',
                halt: true,
                record: expect.objectContaining({
                  title: 'task gh',
                  reason: 'upstream:401',
                }),
              });
            },
          );

          then(
            'the records behind it stay held, in order, and are never sent',
            () => {
              expect(
                [...result.others, result.pushed].map((fate) => [
                  fate.fate,
                  fate.record.title,
                ]),
              ).toEqual([
                ['held', 'task gh'],
                ['held', 'task after'],
                ['held', 'task probe'],
              ]);
              expect(result.tasksUpstream).toEqual([]);
            },
          );

          then(
            'the store holds the halter reason for each record behind it, as the drain printed',
            () => {
              const reasonsStored = result.heldStored.map(({ record }) => [
                record.title,
                record.reason,
              ]);
              expect(reasonsStored).toEqual([
                ['task gh', 'upstream:401'],
                ['task after', 'upstream:401'],
                ['task probe', 'upstream:401'],
              ]);
            },
          );

          then('every record is still QUEUED on disk', () => {
            expect(result.heldStored).toHaveLength(3);
          });
        },
      );

      when(
        '[t1] a held task is re-pushed while upstream still faults (C17)',
        () => {
          const result = useThen('it is dispatched', async () => {
            const pushed = await pushViaRecorder({
              ...scene,
              repo: repoFault,
              title: 'task after',
              env: envTokenRejected,
            });
            return {
              ...pushed,
              tasksUpstream: getAllTasksUpstream(repoFault),
              recordsStored: getAllRecords(scene),
              heldStored: getAllRadioTaskRecordsHeld({}, scene),
            };
          });

          then(
            'the re-push lands on its held record — no second record',
            () => {
              expect(result.recordsStored).toHaveLength(3);
              expect(
                result.recordsStored.filter(
                  ({ record }) => record.title === 'task after',
                ),
              ).toHaveLength(1);
            },
          );

          then(
            'it stays held behind the halter, with the upstream reason',
            () => {
              expect(result.pushed.fate).toEqual('held');
              expect(result.pushed.record.reason).toEqual('upstream:401');
              expect(
                result.heldStored.map(({ record }) => record.title),
              ).toEqual(['task gh', 'task after', 'task probe']);
            },
          );

          then('naught is sent upstream', () => {
            expect(result.tasksUpstream).toEqual([]);
          });
        },
      );
    },
  );

  given(
    '[case7.1] a drain that delivers one record, then halts on the next (C16)',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ slug: 'recorder-case7-1' }),
      );
      const envTokenRejected = {
        RADIO_RECORDER_TEST_TOKEN_REJECTED:
          'ghp_radioRecorderTestTokenRejected0000',
      };

      when(
        '[t0] a file record, then a gh record, are held; a third push opens the gate',
        () => {
          const result = useThen('all three pushes run', async () => {
            await pushViaRecorder({
              ...scene,
              repo: repoFirst,
              title: 'task first',
              env: envTokenRejected,
            });
            await pushViaRecorder({
              ...scene,
              repo: repoGhDemo,
              via: RadioChannel.GH_ISSUES,
              auth: 'as-robot:env(RADIO_RECORDER_TEST_TOKEN_REJECTED)',
              title: 'task gh',
              env: envTokenRejected,
            });
            setLocalGate({ cwd: scene.cwd, state: 'allowed' });
            const pushed = await pushViaRecorder({
              ...scene,
              repo: repoFirst,
              title: 'task probe',
              env: envTokenRejected,
            });
            return { ...pushed, tasksUpstream: getAllTasksUpstream(repoFirst) };
          });

          then(
            'the first delivers, the second halts, the probe waits behind it — in order',
            () => {
              expect(
                [...result.others, result.pushed].map((fate) => [
                  fate.fate,
                  fate.record.title,
                ]),
              ).toEqual([
                ['delivered', 'task first'],
                ['held', 'task gh'],
                ['held', 'task probe'],
              ]);
            },
          );

          then('the first stays DELIVERED on disk, upstream once', () => {
            const recordFirst = getAllRecords(scene).find(
              ({ record }) => record.title === 'task first',
            );
            expect(recordFirst?.record.recordStatus).toEqual(
              RadioTaskRecordStatus.DELIVERED,
            );
            expect(result.tasksUpstream).toHaveLength(1);
          });

          then('the rest are still QUEUED with the halter reason', () => {
            expect(
              getAllRadioTaskRecordsHeld({}, scene).map(({ record }) => [
                record.title,
                record.reason,
              ]),
            ).toEqual([
              ['task gh', 'upstream:401'],
              ['task probe', 'upstream:401'],
            ]);
          });
        },
      );
    },
  );

  given(
    '[case8] a record held unbound, then a route is bound (F4 sweep, R2 → R1)',
    () => {
      const route = 'v2026_01_03.sweep';
      const scene = useBeforeAll(async () =>
        genScene({ slug: 'recorder-case8' }),
      );

      when(
        '[t0] a push is held in .behavior/.radio/, a route is bound, then a push from the route gets through',
        () => {
          const result = useThen('both pushes run', async () => {
            const pushedUnbound = await pushViaRecorder({
              ...scene,
              repo: repoSweep,
              title: 'task unbound',
            });
            const branch = execSync('git rev-parse --abbrev-ref HEAD', {
              cwd: scene.cwd,
            })
              .toString()
              .trim();
            const bindDir = path.join(scene.cwd, '.behavior', route, '.bind');
            fs.mkdirSync(bindDir, { recursive: true });
            fs.writeFileSync(path.join(bindDir, `${branch}.flag`), '');
            setLocalGate({ cwd: scene.cwd, state: 'allowed' });
            const pushedRouted = await pushViaRecorder({
              ...scene,
              repo: repoSweep,
              title: 'task routed',
            });
            return {
              pushedUnbound,
              pushedRouted,
              tasksUpstream: getAllTasksUpstream(repoSweep),
            };
          });

          then('the first push was held beside the routes, unbound', () => {
            expect(result.pushedUnbound.home.place).toEqual('unbound');
            expect(result.pushedUnbound.pushed.fate).toEqual('held');
          });

          then('the routed push lands in the route .radio/', () => {
            expect(result.pushedRouted.home.place).toEqual('route');
            expect(result.pushedRouted.home.dir).toEqual(
              path.join(scene.cwd, '.behavior', route, '.radio'),
            );
          });

          then(
            'the drain reaches across dirs: the unbound record is delivered too',
            () => {
              expect(
                result.pushedRouted.others.map((fate) => [
                  fate.fate,
                  fate.record.title,
                ]),
              ).toEqual([['delivered', 'task unbound']]);
              expect(result.pushedRouted.pushed.fate).toEqual('delivered');
              expect(result.tasksUpstream).toHaveLength(2);
              expect(getAllRadioTaskRecordsHeld({}, scene)).toEqual([]);
            },
          );

          then('the sweep walks both record dirs', () => {
            expect(
              [...getAllRadioTaskRecordDirs({}, { cwd: scene.cwd })].sort(),
            ).toEqual(
              [
                path.join(scene.cwd, '.behavior', '.radio'),
                path.join(scene.cwd, '.behavior', route, '.radio'),
              ].sort(),
            );
          });
        },
      );
    },
  );

  given('[case9] two drains race over one backlog (C19, X2)', () => {
    const scene = useBeforeAll(async () =>
      genScene({ slug: 'recorder-case9' }),
    );

    when(
      '[t0] two tasks are held, the radio opens, then two pushes drain at once',
      () => {
        const result = useThen('both pushes run concurrently', async () => {
          await pushViaRecorder({ ...scene, repo: repoRace, title: 'task a' });
          await pushViaRecorder({ ...scene, repo: repoRace, title: 'task b' });
          setLocalGate({ cwd: scene.cwd, state: 'allowed' });
          const pushes = await Promise.all([
            pushViaRecorder({ ...scene, repo: repoRace, title: 'task c' }),
            pushViaRecorder({ ...scene, repo: repoRace, title: 'task d' }),
          ]);
          return { pushes, tasksUpstream: getAllTasksUpstream(repoRace) };
        });

        then('each push is delivered', () => {
          expect(
            result.pushes.map(({ pushed }) => [
              pushed.fate,
              pushed.record.reason,
              'detail' in pushed ? pushed.detail : null,
            ]),
          ).toEqual([
            ['delivered', null, null],
            ['delivered', null, null],
          ]);
        });

        then(
          'upstream holds each task once — no duplicate from the race',
          () => {
            expect(result.tasksUpstream).toHaveLength(4);
          },
        );

        then('naught stays held', () => {
          expect(getAllRadioTaskRecordsHeld({}, scene)).toEqual([]);
        });
      },
    );
  });

  given(
    '[case10] a push held, then delivered to os.fileops (rule.forbid.timestamps-in-tracked-files)',
    () => {
      const scene = useBeforeAll(async () =>
        genScene({ slug: 'recorder-clock-scan' }),
      );

      when(
        '[t0] the push is held, the gate opened, a second push sent, and a claim refused',
        () => {
          const result = useThen('all three are dispatched', async () => {
            await pushViaRecorder({
              ...scene,
              repo: repoClock,
              title: 'task a',
            });
            setLocalGate({ cwd: scene.cwd, state: 'allowed' });
            const pushed = await pushViaRecorder({
              ...scene,
              repo: repoClock,
              title: 'task b',
            });
            // a claim upstream cannot hold settles through the refused write path
            const refused = await pushViaRecorder({
              ...scene,
              repo: repoClock,
              exid: 'absent-999',
              status: RadioTaskStatus.CLAIMED,
            });
            // list what git could stage before the verdict stages it
            const filesStageable = getAllFilesStageable({ cwd: scene.cwd });
            return {
              pushed,
              refused,
              filesStageable,
              verdictRepo: getOneHookVerdictOnStaged({ cwd: scene.cwd }),
              verdictTasks: getOneHookVerdictOnTasksUpstream({
                repo: repoClock,
              }),
            };
          });

          then('both tasks are delivered upstream', () => {
            expect(result.verdictTasks.tasks).toHaveLength(2);
          });

          then('the claim settles as refused', () => {
            expect(result.refused.pushed.fate).toEqual('refused');
          });

          then('the commit gate passes every file the radio wrote', () => {
            // guard: all three records (two delivered, one refused) must be among the staged files, else the gate grades naught
            expect(
              result.filesStageable
                .map(({ rel }) => rel)
                .filter((rel) => rel.includes('record.')),
            ).toHaveLength(3);
            expect(result.verdictRepo).toEqual({ status: 0, out: '' });
          });

          then('the drain lock leaves no file git could stage', () => {
            expect(
              result.filesStageable.filter(({ rel }) => rel.includes('.locks')),
            ).toEqual([]);
          });

          then('the commit gate passes every dispatched task file', () => {
            expect([
              result.verdictTasks.status,
              result.verdictTasks.out,
            ]).toEqual([0, '']);
          });
        },
      );
    },
  );

  given('[case11] the same pushes, rerun a day apart', () => {
    /**
     * .what = the record files a human could stage, with the upstream exid masked
     * .why = the os.fileops store is shared by both runs, so day two finds the task day one
     *        created; its exid is not a fact of the record's own bytes
     */
    const getAllRecordsStageable = (input: { cwd: string }) =>
      getAllFilesStageable({ cwd: input.cwd })
        .filter(({ rel }) => rel.includes('record.'))
        .map(({ rel, content }) => ({
          rel,
          content: content.replace(/("deliveredExid": )"[^"]*"/, '$1"<exid>"'),
        }));

    const asRun = async (input: { slug: string; now: string }) => {
      // build the scene on the real clock. genTempDir names each dir by the clock, and a
      // peer jest worker's prune deletes a dir whose name reads past its window, so a
      // scene built under the pinned day was deleted mid-setup on a loaded box
      const scene = genScene({ slug: input.slug });

      // .note = fake only Date, so the clock reads the pinned day while timers still run
      jest.useFakeTimers({
        now: new Date(input.now),
        doNotFake: [
          'hrtime',
          'nextTick',
          'performance',
          'queueMicrotask',
          'requestAnimationFrame',
          'cancelAnimationFrame',
          'requestIdleCallback',
          'cancelIdleCallback',
          'setImmediate',
          'clearImmediate',
          'setInterval',
          'clearInterval',
          'setTimeout',
          'clearTimeout',
        ],
      });
      try {
        // hold one push unbound, bind a route, then hold one in the route: two record dirs
        await pushViaRecorder({ ...scene, repo: repoShut, title: 'task a' });
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: scene.cwd,
        })
          .toString()
          .trim();
        const bindDir = path.join(
          scene.cwd,
          '.behavior',
          'v2026_01_04.rerun',
          '.bind',
        );
        fs.mkdirSync(bindDir, { recursive: true });
        fs.writeFileSync(path.join(bindDir, `${branch}.flag`), '');
        await pushViaRecorder({ ...scene, repo: repoShut, title: 'task b' });

        // open one org, then push a claim upstream refuses: a settle write, beside the holds
        setOrgGate({
          homeDir: scene.homeDir,
          orgs: { [repoShut.owner]: 'blocked', [repoOpen.owner]: 'allowed' },
        });
        await pushViaRecorder({
          ...scene,
          repo: repoOpen,
          exid: 'absent-999',
          status: RadioTaskStatus.CLAIMED,
        });

        // deliver one push through the open gate, then push it again verbatim: the deliver write
        // and the repeat-push write, each of which must carry no clock (not even an epoch)
        // note: each write is captured on its own, since the repeat push re-transcribes the record
        //       and would hide a clock the deliver write left
        await pushViaRecorder({ ...scene, repo: repoOpen, title: 'task c' });
        const recordsAfterDeliver = getAllRecordsStageable({ cwd: scene.cwd });
        await pushViaRecorder({ ...scene, repo: repoOpen, title: 'task c' });
        return {
          records: getAllRecordsStageable({ cwd: scene.cwd }),
          recordsAfterDeliver,
          sceneDirName: path.basename(scene.cwd),
        };
      } finally {
        jest.useRealTimers();
      }
    };

    when(
      '[t0] each run holds two pushes in two dirs behind the shut gate, refuses a claim, delivers a push, and repeats it',
      () => {
        const result = useThen('both runs are dispatched', async () => ({
          dayOne: await asRun({
            slug: 'recorder-clock-day-one',
            now: '2026-10-07',
          }),
          dayTwo: await asRun({
            slug: 'recorder-clock-day-two',
            now: '2026-10-08',
          }),
        }));

        then(
          '🔴 each run built its scene on the real clock, never the pinned day',
          () => {
            // a scene dir named by the pinned day reads stale to a peer worker's prune
            expect(result.dayOne.sceneDirName.startsWith('2026-10-07')).toEqual(
              false,
            );
            expect(result.dayTwo.sceneDirName.startsWith('2026-10-08')).toEqual(
              false,
            );
          },
        );

        then('each run wrote one record unbound and three in the route', () => {
          expect(
            result.dayOne.records.map(({ rel }) => path.dirname(rel)),
          ).toEqual([
            '.behavior/.radio',
            '.behavior/v2026_01_04.rerun/.radio',
            '.behavior/v2026_01_04.rerun/.radio',
            '.behavior/v2026_01_04.rerun/.radio',
          ]);
        });

        then(
          'the place in line spans both dirs; the repeat push kept its seq',
          () => {
            expect(
              result.dayOne.records
                .map(({ content }) => JSON.parse(content).heldSeq)
                .sort(),
            ).toEqual([1, 2, 3, 4]);
          },
        );

        then(
          'two records stay held, one settled refused, one delivered',
          () => {
            expect(
              result.dayOne.records
                .map(({ content }) => JSON.parse(content).recordStatus)
                .sort(),
            ).toEqual([
              RadioTaskRecordStatus.DELIVERED,
              RadioTaskRecordStatus.QUEUED,
              RadioTaskRecordStatus.QUEUED,
              RadioTaskRecordStatus.REFUSED,
            ]);
          },
        );

        then(
          'the bytes of each record are pinned, upstream exid masked',
          () => {
            // the record json is the artifact the wish changes; a stray key or reorder shows here
            expect(
              // mask the key and the per-run repo name (it carries the suite's runId); list in
              // heldSeq order, since the file order follows the key hash, which the runId varies
              [...result.dayOne.records]
                .sort(
                  (a, b) =>
                    JSON.parse(a.content).heldSeq -
                    JSON.parse(b.content).heldSeq,
                )
                .map(({ content }) =>
                  content
                    .replace(/"key": "[^"]*"/, '"key": "<key>"')
                    .replace(/"name": "repo-[0-9]+"/, '"name": "repo-<runId>"'),
                ),
            ).toMatchSnapshot();
          },
        );

        then('the two runs wrote byte-identical records', () => {
          expect(result.dayTwo.records).toEqual(result.dayOne.records);
        });

        then(
          'the deliver write alone is byte-identical too, before the repeat push',
          () => {
            expect(result.dayTwo.recordsAfterDeliver).toEqual(
              result.dayOne.recordsAfterDeliver,
            );
          },
        );
      },
    );
  });

  given(
    '[case12] two legacy records with clock fields, in two dirs, tied on heldSeq',
    () => {
      const scene = useBeforeAll(async () => {
        const paths = genScene({ slug: 'recorder-legacy' });
        setLocalGate({ cwd: paths.cwd, state: 'allowed' });

        // a prior version wrote these: each holds heldAt and settledAt, and both took seq 1
        const asLegacy = (input: { key: string; title: string }) =>
          JSON.stringify({
            ...new RadioTaskRecord({
              key: input.key,
              kind: 'create',
              repo: repoLegacy,
              via: RadioChannel.OS_FILEOPS,
              auth: null,
              idem: null,
              title: input.title,
              description: `details for ${input.title}`,
              exid: null,
              status: null,
              recordStatus: RadioTaskRecordStatus.QUEUED,
              reason: 'radio.uses blocked',
              heldSeq: 1,
              deliveredExid: null,
            }),
            heldAt: '2026-01-01T00:00:00Z', // note: a pinned stamp never drifts, and the gate exempts .ts files
            settledAt: null,
          });
        const dirUnbound = path.join(paths.cwd, '.behavior', '.radio');
        const dirRoute = path.join(
          paths.cwd,
          '.behavior',
          'v2026_01_01.legacy',
          '.radio',
        );
        fs.mkdirSync(dirUnbound, { recursive: true });
        fs.mkdirSync(dirRoute, { recursive: true });
        fs.writeFileSync(
          path.join(dirUnbound, 'record.legacy-a.json'),
          asLegacy({ key: 'legacy-a', title: 'legacy task a' }),
        );
        fs.writeFileSync(
          path.join(dirRoute, 'record.legacy-b.json'),
          asLegacy({ key: 'legacy-b', title: 'legacy task b' }),
        );

        // a prior version also settled this one: DELIVERED, so the line never walks it
        fs.writeFileSync(
          path.join(dirRoute, 'record.legacy-c.json'),
          JSON.stringify({
            ...JSON.parse(
              asLegacy({ key: 'legacy-c', title: 'legacy task c' }),
            ),
            recordStatus: RadioTaskRecordStatus.DELIVERED,
            reason: null,
            deliveredExid: 'exid-legacy-c',
            settledAt: '2026-01-01T00:05:00Z',
          }),
        );
        return paths;
      });

      when('[t0] a new push opens the drain', () => {
        const result = useThen('it is dispatched', async () => {
          const pushed = await pushViaRecorder({
            ...scene,
            repo: repoLegacy,
            title: 'task after the upgrade',
          });
          return {
            ...pushed,
            records: getAllFilesStageable({ cwd: scene.cwd }).filter(
              ({ rel }) => rel.includes('record.'),
            ),
            tasksUpstream: getAllTasksUpstream(repoLegacy),
          };
        });

        then('the new push mints past the tie', () => {
          expect(result.pushed.record.heldSeq).toEqual(2);
        });

        then('both legacy records drain first, each once', () => {
          expect(
            result.others.map((fate) => [fate.fate, fate.record.key]).sort(),
          ).toEqual([
            ['delivered', 'legacy-a'],
            ['delivered', 'legacy-b'],
          ]);
          expect(result.pushed.fate).toEqual('delivered');
          expect(result.tasksUpstream).toHaveLength(3);
        });

        then(
          'every record is written back delivered, with no clock key',
          () => {
            expect(result.records).toHaveLength(4);
            result.records.forEach(({ content }) => {
              const json = JSON.parse(content);
              expect(json.recordStatus).toEqual(
                RadioTaskRecordStatus.DELIVERED,
              );
              expect(Object.keys(json)).not.toContain('heldAt');
              expect(Object.keys(json)).not.toContain('settledAt');
            });
          },
        );

        then(
          'the record a prior version already delivered is shed of its clock, never re-sent',
          () => {
            const settled = result.records.find(({ rel }) =>
              rel.endsWith('record.legacy-c.json'),
            );
            expect(JSON.parse(settled!.content).deliveredExid).toEqual(
              'exid-legacy-c',
            );
            expect(result.others.map((fate) => fate.record.key)).not.toContain(
              'legacy-c',
            );
          },
        );
      });
    },
  );
});
