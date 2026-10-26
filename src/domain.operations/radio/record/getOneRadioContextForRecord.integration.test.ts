import * as fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { shx } from '@src/infra/shell/shx';

import { getOneRadioContextForRecord } from './getOneRadioContextForRecord';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = the drain case proves a stored shx auth never runs; no real issue need land
 * .real = the gh dao runs against real github in daoRadioTaskViaGhIssues.integration.test.ts
 */
const STUB_GH = `#!/usr/bin/env bash
case "$1 $2" in
  "issue list") echo "[]" ;;
  "issue create") echo "https://github.com/stub/stub/issues/7" ;;
  *) echo "stub gh: unexpected call: $*" >&2; exit 1 ;;
esac
`;

/**
 * .what = a gh.issues record with the given auth
 * .why = each case varies only the auth the record file holds
 */
const genRecord = (input: { auth: string | null }) =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: input.auth,
    idem: null,
    title: 'wetsuit inventory',
    description: 'count the wetsuits',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
  });

describe('getOneRadioContextForRecord — a stored auth never runs a shell', () => {
  const dir = genTempDir({ slug: 'radio-auth-replay' });
  const context = { env: process.env, shx };

  given('[case1] a record file whose stored auth is a shx command', () => {
    const pwned = path.join(dir, 'pwned-case1');
    const record = genRecord({
      auth: `as-robot:shx(touch ${pwned} && echo ghp_stub)`,
    });

    when('[t0] a drain replays it, with no live auth', () => {
      const result = useThen('it is held', async () => {
        const derived = await getOneRadioContextForRecord(
          { record, authOverride: null, authLive: null },
          context,
        );
        return {
          isConstraint:
            'fault' in derived && derived.fault instanceof ConstraintError,
          message: 'fault' in derived ? derived.fault.message : null,
          ran: fs.existsSync(pwned),
        };
      });

      then('it is refused as a constraint that names the fix', () => {
        expect(result.isConstraint).toEqual(true);
        expect(result.message).toContain('rhx radio.task.queue set --key');
        expect(result.message).not.toContain(
          'rhx radio.task.queue drain --auth',
        );
      });

      then('the stored command never ran', () => {
        expect(result.ran).toEqual(false);
      });
    });
  });

  given(
    '[case2] the same shx auth, typed by the live push that wrote the record',
    () => {
      const pwned = path.join(dir, 'pwned-case2');
      const auth = `as-robot:shx(touch ${pwned} && echo ghp_stub)`;
      const record = genRecord({ auth });

      when('[t0] the push sends its own record', () => {
        const result = useThen('it derives the token', async () => {
          const derived = await getOneRadioContextForRecord(
            { record, authOverride: null, authLive: { key: record.key, auth } },
            context,
          );
          return {
            token:
              'radioContext' in derived && 'github' in derived.radioContext
                ? derived.radioContext.github.auth.token
                : null,
            ran: fs.existsSync(pwned),
          };
        });

        then('the live shx auth still works', () => {
          expect(result.token).toEqual('ghp_stub');
          expect(result.ran).toEqual(true);
        });
      });
    },
  );

  given(
    '[case3] a record file whose stored keyrack owner holds shell syntax',
    () => {
      const pwned = path.join(dir, 'pwned-case3');
      const record = genRecord({
        auth: `as-robot:via-keyrack(ehmpath; touch ${pwned})`,
      });

      when('[t0] a drain replays it, with no live auth', () => {
        const result = useThen('it is held', async () => {
          const derived = await getOneRadioContextForRecord(
            { record, authOverride: null, authLive: null },
            context,
          );
          return {
            isConstraint:
              'fault' in derived && derived.fault instanceof ConstraintError,
            ran: fs.existsSync(pwned),
          };
        });

        then('it is refused as a constraint, and naught ran', () => {
          expect(result.isConstraint).toEqual(true);
          expect(result.ran).toEqual(false);
        });
      });
    },
  );

  given('[case4] a held gh record whose stored auth is a shx command', () => {
    const pathPrior = process.env.PATH;
    const pwned = path.join(dir, 'pwned-case4');
    const scene = useBeforeAll(async () => {
      const stubDir = genTempDir({ slug: 'radio-auth-replay-stub-gh' });
      fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
      process.env.PATH = `${stubDir}:${pathPrior}`;
      return {
        cwd: genTempDir({ slug: 'radio-auth-replay-drain', git: true }),
        homeDir: genTempDir({ slug: 'radio-auth-replay-drain-home' }),
      };
    });
    afterAll(() => {
      process.env.PATH = pathPrior;
    });

    when('[t0] the queue is drained through an open gate', () => {
      const result = useThen('the drain runs', async () => {
        fs.mkdirSync(path.join(scene.cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(scene.cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        setRadioTaskRecordFromPush(
          {
            push: {
              repo: new RadioTaskRepo({
                owner: 'sandpine',
                name: 'svc-lessons',
              }),
              via: RadioChannel.GH_ISSUES,
              auth: `as-robot:shx(touch ${pwned} && echo ghp_stub)`,
              idem: null,
              title: 'board rental count',
              description: 'count the boards',
              exid: null,
              status: null,
            },
          },
          { dir: path.join(scene.cwd, '.behavior', '.radio'), cwd: scene.cwd },
        );
        const drained = await setRadioTaskRecordsDrained(
          {},
          { ...scene, env: process.env, shx },
        );
        return {
          fates: drained.fates.map((fate) => fate.fate),
          ran: fs.existsSync(pwned),
        };
      });

      then('the record stays held, unsent', () => {
        expect(result.fates).toEqual(['held']);
      });

      then('the stored command never ran', () => {
        expect(result.ran).toEqual(false);
      });
    });
  });

  given(
    '[case5] a planted shx record, then a bare re-push of its identity with no --auth',
    () => {
      const pathPrior = process.env.PATH;
      const pwned = path.join(dir, 'pwned-case5');
      const scene = useBeforeAll(async () => {
        const stubDir = genTempDir({ slug: 'radio-auth-repush-stub-gh' });
        fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
        process.env.PATH = `${stubDir}:${pathPrior}`;
        const cwd = genTempDir({ slug: 'radio-auth-repush', git: true });
        fs.mkdirSync(path.join(cwd, '.meter'), { recursive: true });
        fs.writeFileSync(
          path.join(cwd, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
        );
        return {
          cwd,
          homeDir: genTempDir({ slug: 'radio-auth-repush-home' }),
          dir: path.join(cwd, '.behavior', '.radio'),
        };
      });
      afterAll(() => {
        process.env.PATH = pathPrior;
      });

      when('[t0] the human re-pushes the same title with no --auth', () => {
        const result = useThen('the push drains', async () => {
          const push = {
            repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
            via: RadioChannel.GH_ISSUES,
            idem: null,
            title: 'swell alert',
            description: 'alert the surfers',
            exid: null,
            status: null,
          };

          // the record a merge planted, with a stored shell auth
          setRadioTaskRecordFromPush(
            {
              push: {
                ...push,
                auth: `as-robot:shx(touch ${pwned} && echo ghp_stub)`,
              },
            },
            { dir: scene.dir, cwd: scene.cwd },
          );

          // the human's bare re-push: it inherits the stored auth onto its record
          const { record } = setRadioTaskRecordFromPush(
            { push: { ...push, auth: null } },
            { dir: scene.dir, cwd: scene.cwd },
          );
          const drained = await setRadioTaskRecordsDrainedByPush(
            { record, dir: scene.dir, authTyped: null },
            { ...scene, env: process.env, shx },
          );
          return {
            inherited: record.auth,
            fate: drained.pushed.fate,
            reason: drained.pushed.record.reason,
            ran: fs.existsSync(pwned),
          };
        });

        then('the re-push record carries the stored auth it inherited', () => {
          expect(result.inherited).toContain('as-robot:shx(');
        });

        then('the push is held on its auth, unsent', () => {
          expect(result.fate).toEqual('held');
          expect(result.reason).toEqual('upstream:auth');
        });

        then('the planted command never ran', () => {
          expect(result.ran).toEqual(false);
        });
      });
    },
  );

  given('[case6] a stored env auth that names a var no token lives in', () => {
    const env = {
      ...process.env,
      SANDPINE_SECRET_ACCESS_KEY: 'ghp_stub_secret',
      SANDPINE_GITHUB_TOKEN: 'ghp_stub_token',
    };

    when('[t0] a drain replays it, with no live auth', () => {
      const result = useThen('it is held', async () => {
        const derived = await getOneRadioContextForRecord(
          {
            record: genRecord({
              auth: 'as-robot:env(SANDPINE_SECRET_ACCESS_KEY)',
            }),
            authOverride: null,
            authLive: null,
          },
          { env, shx },
        );
        return {
          isConstraint:
            'fault' in derived && derived.fault instanceof ConstraintError,
          message: 'fault' in derived ? derived.fault.message : null,
        };
      });

      then('it is refused as a constraint that names the fix', () => {
        expect(result.isConstraint).toEqual(true);
        expect(result.message).toContain('TOKEN segment');
        expect(result.message).toContain('rhx radio.task.queue set --key');
        expect(result.message).not.toContain(
          'rhx radio.task.queue drain --auth',
        );
        expect(result.message).not.toContain('SANDPINE_SECRET_ACCESS_KEY');
      });
    });

    when(
      '[t1] a drain replays a stored env auth that names a token var',
      () => {
        const result = useThen('it derives the token', async () => {
          const derived = await getOneRadioContextForRecord(
            {
              record: genRecord({
                auth: 'as-robot:env(SANDPINE_GITHUB_TOKEN)',
              }),
              authOverride: null,
              authLive: null,
            },
            { env, shx },
          );
          return {
            token:
              'radioContext' in derived && 'github' in derived.radioContext
                ? derived.radioContext.github.auth.token
                : null,
          };
        });

        then('the token var replays', () => {
          expect(result.token).toEqual('ghp_stub_token');
        });
      },
    );

    when('[t2] the live push typed the same non-token env auth', () => {
      const result = useThen('it derives the token', async () => {
        const record = genRecord({
          auth: 'as-robot:env(SANDPINE_SECRET_ACCESS_KEY)',
        });
        const derived = await getOneRadioContextForRecord(
          {
            record,
            authOverride: null,
            authLive: { key: record.key, auth: record.auth },
          },
          { env, shx },
        );
        return {
          token:
            'radioContext' in derived && 'github' in derived.radioContext
              ? derived.radioContext.github.auth.token
              : null,
        };
      });

      then('a live push may still name any env var', () => {
        expect(result.token).toEqual('ghp_stub_secret');
      });
    });
  });
});
