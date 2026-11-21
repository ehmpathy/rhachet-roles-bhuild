import * as fs from 'fs';
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

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { ContextGithubAuth } from '@src/domain.objects/RadioContext';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { getOneRadioRepoVisibilityRead } from './getOneRadioRepoVisibilityRead';
import { setRadioTaskRecordFromPush } from './setRadioTaskRecordFromPush';

/**
 * .mock = the gh cli, via a stub `gh` first on PATH
 * .why  = a rejected visibility read is a state a test cannot provoke on demand against real
 *         github; the stub answers it
 * .real = src/access/daos/daoRadioTask/getOneGhRepoVisibility.integration.test.ts reads the real
 *         demo repo, an absent repo, and a rejected token against github
 */
const STUB_GH = `#!/usr/bin/env bash
echo "HTTP 401: Bad credentials (https://api.github.com/graphql)" >&2
exit 1
`;

describe('getOneRadioRepoVisibilityRead', () => {
  const pathPrior = process.env.PATH;
  const stubDir = genTempDir({ slug: 'radio-visibility-read-stub-gh' });
  beforeAll(() => {
    fs.writeFileSync(path.join(stubDir, 'gh'), STUB_GH, { mode: 0o755 });
    process.env.PATH = `${stubDir}:${pathPrior}`;
  });
  afterAll(() => {
    process.env.PATH = pathPrior;
  });

  const repo = new RadioTaskRepo({
    owner: 'sandpine',
    name: 'visibility-read',
  });
  const scene = useBeforeAll(async () => {
    const cwd = genTempDir({ slug: 'radio-visibility-read', git: true });
    const { record } = setRadioTaskRecordFromPush(
      {
        push: {
          repo,
          via: RadioChannel.GH_ISSUES,
          auth: null,
          idem: null,
          title: 'lesson reminder flakes',
          description: 'the 9am reminder sends twice',
          exid: null,
          status: null,
          promise: null,
        },
      },
      { dir: path.join(cwd, '.behavior', '.radio'), cwd },
    );
    return { record };
  });

  given('[case1] a gh fault on the read', () => {
    when('[t0] the read runs', () => {
      const result = useThen('it settles', async () =>
        getOneRadioRepoVisibilityRead(
          { record: scene.record },
          {
            github: {
              auth: { token: 'ghp_stubTokenMarker0000', role: 'as-robot' },
            },
          },
        ),
      );
      then('it is unreadable, with the cause and the fault code', () => {
        expect(result.visibility).toEqual('unreadable');
        expect(result.cause).not.toBeNull();
        expect(result.causeCode).not.toBeNull();
      });
    });
  });

  given('[case2] a defect in the read, not a gh fault', () => {
    when('[t0] the read runs', () => {
      const result = useThen('it fails loud', async () => {
        // a context whose auth cannot be read: a defect of our own, never an answer from gh
        const context: ContextGithubAuth = {
          github: {
            get auth(): ContextGithubAuth['github']['auth'] {
              throw new TypeError('auth read failed: a defect, not a gh fault');
            },
          },
        };
        // wrap the error in a field: useThen hands back a proxy, so an instanceof check needs the bare value
        const error = await getError(
          getOneRadioRepoVisibilityRead({ record: scene.record }, context),
        );
        return { error };
      });
      then('it rethrows the defect, never settles it as unreadable', () => {
        expect(result.error).toBeInstanceOf(TypeError);
        expect(result.error.message).toContain('a defect, not a gh fault');
      });
    });
  });
});
