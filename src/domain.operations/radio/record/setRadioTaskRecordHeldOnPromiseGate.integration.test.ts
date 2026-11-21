import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { genRadioDrainDeadline } from './genRadioDrainDeadline';
import { getOneRadioPromiseHold } from './getOneRadioPromiseHold';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordHeldOnPromiseGate } from './setRadioTaskRecordHeldOnPromiseGate';

const LITERAL = 'task-to-public-repo-is-anonymized';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a public, private, internal, unparsable, rejected, or rate-limited visibility read is a
 *         state a test cannot provoke on demand against real github; the stub answers per repo
 * .real = src/access/daos/daoRadioTask/getOneGhRepoVisibility.integration.test.ts reads the real
 *         demo repo, an absent repo, and a rejected token against github
 */
const STUB_GH = `#!/usr/bin/env bash
echo "$*" >> "$STUB_GH_DIR/calls.log"
if [ "$1 $2" != "repo view" ]; then echo "stub gh: unexpected call: $*" >&2; exit 1; fi
mode="$(cat "$STUB_GH_DIR/mode.$(printf '%s' "$3" | tr '/' '_')" 2>/dev/null || echo PRIVATE)"
case "$mode" in
  PUBLIC|PRIVATE|INTERNAL) echo "{\\"visibility\\":\\"$mode\\"}" ;;
  garbage) echo "not json" ;;
  rejected) echo "HTTP 401: Bad credentials (https://api.github.com/graphql)" >&2; exit 1 ;;
  rate-limit) echo "API rate limit exceeded for installation ID 1" >&2; exit 1 ;;
  econnreset) echo "read tcp: econnreset" >&2; exit 1 ;;
esac
`;

const drainDeadline = genRadioDrainDeadline({
  lease: { milliseconds: 5 * 60_000 },
});

describe('setRadioTaskRecordHeldOnPromiseGate', () => {
  const pathPrior = process.env.PATH;
  const stubDir = genTempDir({ slug: 'radio-promise-gate-stub-gh' });
  beforeAll(() => {
    fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.STUB_GH_DIR = stubDir;
    process.env.PATH = `${stubDir}:${pathPrior}`;
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  /**
   * .what = set how the stub answers the visibility of one repo
   */
  const setStubMode = (input: { repo: RadioTaskRepo; mode: string }) =>
    fs.writeFileSync(
      path.join(stubDir, `mode.${input.repo.owner}_${input.repo.name}`),
      input.mode,
    );

  /**
   * .what = the visibility reads the stub saw for one repo
   */
  const getReadsOf = (input: { repo: RadioTaskRepo }): number => {
    const file = path.join(stubDir, 'calls.log');
    if (!fs.existsSync(file)) return 0;
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) =>
        line.startsWith(`repo view ${input.repo.owner}/${input.repo.name} `),
      ).length;
  };

  /**
   * .what = one record transcribed into a fresh dir, for one repo
   */
  const genScene = (input: {
    slug: string;
    repo: RadioTaskRepo;
    via?: RadioChannel;
    title?: string | null;
    description?: string | null;
    exid?: string | null;
    status?: RadioTaskStatus | null;
    promise?: string | null;
  }): { cwd: string; dir: string; record: RadioTaskRecord } => {
    const cwd = genTempDir({ slug: input.slug, git: true });
    const dir = path.join(cwd, '.behavior', '.radio');
    const { record } = setRadioTaskRecordFromPush(
      {
        push: {
          repo: input.repo,
          via: input.via ?? RadioChannel.GH_ISSUES,
          auth: null,
          idem: null,
          title:
            input.title === undefined ? 'lesson reminder flakes' : input.title,
          description:
            input.description === undefined
              ? 'the 9am reminder sends twice'
              : input.description,
          exid: input.exid ?? null,
          status: input.status ?? null,
          promise: input.promise ?? null,
        },
      },
      { dir, cwd },
    );
    return { cwd, dir, record };
  };

  const radioContextOf = (input: { repo: RadioTaskRepo }) => ({
    github: {
      auth: { token: 'ghp_stubTokenMarker0000', role: 'as-robot' as const },
    },
    git: { repo: input.repo },
  });

  const runGate = async (input: {
    scene: { dir: string; record: RadioTaskRecord };
    repo: RadioTaskRepo;
    pushKey: string | null;
    promiseOverride?: string | null;
  }) => {
    const fate = await setRadioTaskRecordHeldOnPromiseGate(
      {
        record: input.scene.record,
        dir: input.scene.dir,
        promiseOverride: input.promiseOverride ?? null,
      },
      {
        radioContext: radioContextOf({ repo: input.repo }),
        push: input.pushKey ? { key: input.pushKey, auth: null } : null,
        drainSendLimit: undefined,
        drainDeadline,
      },
    );
    const onDisk = daoRadioTaskRecord.get.one.byUnique({
      dir: input.scene.dir,
      key: input.scene.record.key,
    });
    return { fate, onDisk };
  };

  given(
    '[case1] a text record into a public repo, not the push at hand',
    () => {
      const repo = new RadioTaskRepo({
        owner: 'sandpine',
        name: 'case1-public',
      });
      const scene = useBeforeAll(async () => {
        setStubMode({ repo, mode: 'PUBLIC' });
        return genScene({ slug: 'promise-gate-case1', repo });
      });
      when('[t0] the gate reads it', () => {
        const result = useThen('it holds', async () =>
          runGate({ scene, repo, pushKey: null }),
        );
        then('it is held QUEUED for its promise, the drain goes on', () => {
          expect(result.fate?.fate).toEqual('held');
          expect(result.fate?.halt).toEqual(false);
          expect(result.fate?.dir).toEqual(scene.dir);
          expect(result.onDisk?.recordStatus).toEqual(
            RadioTaskRecordStatus.QUEUED,
          );
          expect(result.onDisk?.reason).toEqual('public-repo:unpromised');
          expect(result.fate?.detail).toEqual(
            'public repo, no anonymized promise on this record',
          );
        });
      });
    },
  );

  given('[case7] a gh record handed a context with no github auth', () => {
    const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'case7-public' });
    const scene = useBeforeAll(async () => {
      setStubMode({ repo, mode: 'PUBLIC' });
      return genScene({ slug: 'promise-gate-case7', repo });
    });
    when('[t0] the gate reads it', () => {
      const result = useThen('it fails loud', async () => {
        const error = await getError(
          setRadioTaskRecordHeldOnPromiseGate(
            { record: scene.record, dir: scene.dir, promiseOverride: null },
            {
              radioContext: { git: { repo } },
              push: null,
              drainSendLimit: undefined,
              drainDeadline,
            },
          ),
        );
        return { error, reads: getReadsOf({ repo }) };
      });
      then('it throws, never returns null, so no request may run', () => {
        expect(result.error).toBeInstanceOf(UnexpectedCodePathError);
        expect(result.error.message).toContain('assure failed');
      });
      then('it reads no visibility', () => {
        expect(result.reads).toEqual(0);
      });
    });
  });

  given('[case2] the push at hand, into a public repo', () => {
    const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'case2-public' });
    const scene = useBeforeAll(async () => {
      setStubMode({ repo, mode: 'PUBLIC' });
      return genScene({ slug: 'promise-gate-case2', repo });
    });
    when('[t0] the gate reads it', () => {
      const result = useThen('it drops', async () =>
        runGate({ scene, repo, pushKey: scene.record.key }),
      );
      then('it is DROPPED, its reason the machine code', () => {
        expect(result.fate?.fate).toEqual('held');
        expect(result.onDisk?.recordStatus).toEqual(
          RadioTaskRecordStatus.DROPPED,
        );
        expect(result.onDisk?.reason).toEqual('public-repo:unpromised');
      });
    });
  });

  given('[case3] a text record into a private, then an internal, repo', () => {
    const repoPrivate = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case3-private',
    });
    const repoInternal = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case3-internal',
    });
    const scene = useBeforeAll(async () => {
      setStubMode({ repo: repoPrivate, mode: 'PRIVATE' });
      setStubMode({ repo: repoInternal, mode: 'INTERNAL' });
      return {
        private: genScene({ slug: 'promise-gate-case3a', repo: repoPrivate }),
        internal: genScene({ slug: 'promise-gate-case3b', repo: repoInternal }),
      };
    });
    when('[t0] the gate reads each', () => {
      const result = useThen('it reads', async () => ({
        private: await runGate({
          scene: scene.private,
          repo: repoPrivate,
          pushKey: null,
        }),
        internal: await runGate({
          scene: scene.internal,
          repo: repoInternal,
          pushKey: null,
        }),
      }));
      then('neither is held: the request may run', () => {
        expect(result.private.fate).toBeNull();
        expect(result.internal.fate).toBeNull();
        expect(getReadsOf({ repo: repoPrivate })).toEqual(1);
      });
    });
  });

  given('[case4] records that owe no promise', () => {
    const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'case4-public' });
    const scene = useBeforeAll(async () => {
      setStubMode({ repo, mode: 'PUBLIC' });
      return {
        statusOnly: genScene({
          slug: 'promise-gate-case4a',
          repo,
          title: null,
          description: null,
          exid: '5',
          status: RadioTaskStatus.CLAIMED,
        }),
        promised: genScene({
          slug: 'promise-gate-case4b',
          repo,
          promise: LITERAL,
        }),
        overridden: genScene({
          slug: 'promise-gate-case4c',
          repo,
          title: 'board rental count',
        }),
      };
    });
    when('[t0] the gate reads each', () => {
      const result = useThen('it reads', async () => ({
        statusOnly: await runGate({
          scene: scene.statusOnly,
          repo,
          pushKey: null,
        }),
        promised: await runGate({ scene: scene.promised, repo, pushKey: null }),
        overridden: await runGate({
          scene: scene.overridden,
          repo,
          pushKey: null,
          promiseOverride: LITERAL,
        }),
      }));
      then('none is held, and no visibility read is made', () => {
        expect(result.statusOnly.fate).toBeNull();
        expect(result.promised.fate).toBeNull();
        expect(result.overridden.fate).toBeNull();
        expect(getReadsOf({ repo })).toEqual(0);
      });
    });
  });

  given('[case5] visibility reads that fail', () => {
    const repoGarbage = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case5-garbage',
    });
    const repoRejected = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case5-rejected',
    });
    const repoLimited = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case5-limited',
    });
    const repoReset = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case5-reset',
    });
    const scene = useBeforeAll(async () => {
      setStubMode({ repo: repoGarbage, mode: 'garbage' });
      setStubMode({ repo: repoRejected, mode: 'rejected' });
      setStubMode({ repo: repoLimited, mode: 'rate-limit' });
      setStubMode({ repo: repoReset, mode: 'econnreset' });
      return {
        garbage: genScene({ slug: 'promise-gate-case5a', repo: repoGarbage }),
        rejected: genScene({ slug: 'promise-gate-case5b', repo: repoRejected }),
        limited: genScene({ slug: 'promise-gate-case5c', repo: repoLimited }),
        reset: genScene({ slug: 'promise-gate-case5d', repo: repoReset }),
      };
    });
    when('[t0] the gate reads each', () => {
      const result = useThen('it reads', async () => ({
        garbage: await runGate({
          scene: scene.garbage,
          repo: repoGarbage,
          pushKey: null,
        }),
        rejected: await runGate({
          scene: scene.rejected,
          repo: repoRejected,
          pushKey: null,
        }),
        limited: await runGate({
          scene: scene.limited,
          repo: repoLimited,
          pushKey: null,
        }),
        reset: await runGate({
          scene: scene.reset,
          repo: repoReset,
          pushKey: null,
        }),
      }));
      then('an off-shape answer holds as unreadable, its cause named', () => {
        expect(result.garbage.onDisk?.reason).toEqual('public-repo:unreadable');
        // the cause rides on its own line, so no label nests it in a second pair of parens
        expect(result.garbage.fate?.detail).toContain(
          '\ncause: visibility json unparsable',
        );
        expect(result.garbage.fate?.halt).toEqual(false);
      });
      then('a rejected token holds as unreadable on this auth', () => {
        expect(result.rejected.onDisk?.reason).toEqual(
          'public-repo:unreadable-auth',
        );
        expect(result.rejected.fate?.detail).toContain('try as-human');
      });
      then('a rate limit is a wall: it halts, the read named', () => {
        expect(result.limited.fate?.halt).toEqual(true);
        expect(result.limited.onDisk?.reason).toEqual('upstream:rate-limit');
        expect(result.limited.fate?.detail).toContain(
          'visibility read: upstream:rate-limit',
        );
      });
      then(
        'a wall names the promise the record will owe, since the gate is still ahead',
        () => {
          expect(result.limited.fate?.detail).toContain(
            'a public repo will owe --promise once the read clears',
          );
          expect(result.reset.fate?.detail).toContain(
            'a public repo will owe --promise once the read clears',
          );
        },
      );
      then('a network fault is a wall too', () => {
        expect(result.reset.fate?.halt).toEqual(true);
        expect(result.reset.onDisk?.reason).toEqual('upstream:transient');
      });
    });
  });

  given('[case6] the hold read alone, with its three declared answers', () => {
    const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'case6-public' });
    const repoLimited = new RadioTaskRepo({
      owner: 'sandpine',
      name: 'case6-limited',
    });
    const scene = useBeforeAll(async () => {
      setStubMode({ repo, mode: 'PUBLIC' });
      setStubMode({ repo: repoLimited, mode: 'rate-limit' });
      return {
        owed: genScene({ slug: 'promise-hold-case6a', repo }),
        limited: genScene({ slug: 'promise-hold-case6b', repo: repoLimited }),
      };
    });
    when('[t0] the hold is read', () => {
      const result = useThen('it reads', async () => ({
        promise: await getOneRadioPromiseHold(
          { record: scene.owed.record, promiseOverride: null },
          { radioContext: radioContextOf({ repo }) },
        ),
        wall: await getOneRadioPromiseHold(
          { record: scene.limited.record, promiseOverride: null },
          { radioContext: radioContextOf({ repo: repoLimited }) },
        ),
        none: await getOneRadioPromiseHold(
          { record: scene.owed.record, promiseOverride: LITERAL },
          { radioContext: radioContextOf({ repo }) },
        ),
      }));
      then('each case returns exactly one declared kind', () => {
        expect(result.promise).toEqual({
          kind: 'promise',
          reason: 'public-repo:unpromised',
          cause: null,
        });
        expect(result.wall?.kind).toEqual('wall');
        expect(result.none).toBeNull();
      });
    });
  });
});
