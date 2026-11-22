import * as fs from 'fs';
import { ConstraintError, MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { assertStubGhOnPath } from '@src/.test/utils/assertStubGhOnPath';
import {
  STUB_GH_TOKEN,
  withAmbientStub,
} from '@src/.test/utils/withAmbientStub';
import { shx } from '@src/infra/shell/shx';

import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

/**
 * .what = the ambient as-ehmpath path, run through the REAL shx against a stub gh
 * .why  = a stub placed anywhere but the PATH the subprocess runs under never reaches it,
 *         and a real gh login answers. these prove the stub answers before any assert, and
 *         that the git identity read is the test's alone
 *
 * .note = case1 is the clamp for shx's explicit `env: process.env`: without it, under jest,
 *         the shell runs under the host PATH and `command -v gh` names the real gh
 */
describe('getEhmpathTokenFromAmbient.integration', () => {
  // the derive, as every caller runs it: process.env and the real shx
  const runDerive = (input: { auth: string }) =>
    getGithubTokenByAuthArg({ auth: input.auth }, { env: process.env, shx });

  given(
    '[case1] a stub gh with a login, and a repo whose email is ehmpath',
    () => {
      when('[t0] as-ehmpath-via-ambient derives a token', () => {
        const result = useThen('the derive runs', async () =>
          withAmbientStub(
            {
              slug: 'case1',
              gh: { login: 'token' },
              git: { email: 'seaturtle@ehmpath.com' },
            },
            async (scene) => ({
              ghResolved: (await shx('command -v gh')).stdout.trim(),
              stubPath: scene.stubPath,
              auth: await runDerive({ auth: 'as-ehmpath-via-ambient' }),
            }),
          ),
        );
        then('command -v gh, through the same shx, names the stub', () => {
          expect(result.ghResolved).toEqual(result.stubPath);
        });
        then('the token is the stub fake token', () => {
          expect(result.auth).toEqual({
            token: STUB_GH_TOKEN,
            role: 'as-robot',
            ehmpathSpot: null,
          });
        });
      });
    },
  );

  given(
    '[case2] a stub gh with a login, and a repo whose email is a human one',
    () => {
      when('[t0] as-ehmpath-via-ambient derives a token', () => {
        then('refuses, and names the human email; gh pays naught', async () => {
          const error = await withAmbientStub(
            {
              slug: 'case2',
              gh: { login: 'token' },
              git: { email: 'bert@example.com' },
            },
            async () => getError(runDerive({ auth: 'as-ehmpath-via-ambient' })),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'ambient: git config user.email = bert@example.com, not an ehmpath email',
          );
          expect(error.message).not.toContain(STUB_GH_TOKEN);
          expect(error.message).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] a stub gh with a login, and a repo with no email at all',
    () => {
      when('[t0] as-ehmpath-via-ambient derives a token', () => {
        then(
          'refuses, and reads the email as unset (git exit 1 is an answer)',
          async () => {
            const error = await withAmbientStub(
              { slug: 'case3', gh: { login: 'token' }, git: { email: null } },
              async () =>
                getError(runDerive({ auth: 'as-ehmpath-via-ambient' })),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'ambient: git config user.email unset',
            );
            expect(error.message).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case4] a stub gh with no login, and a repo whose email is ehmpath',
    () => {
      when('[t0] as-ehmpath-via-ambient derives a token', () => {
        then(
          'refuses, and names gh auth login (gh exit 1 is an answer)',
          async () => {
            const error = await withAmbientStub(
              {
                slug: 'case4',
                gh: { login: 'none' },
                git: {
                  email: '259600029+ehm-seaturtle@users.noreply.github.com',
                },
              },
              async () =>
                getError(runDerive({ auth: 'as-ehmpath-via-ambient' })),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'ambient: ehmpath email, but gh holds no login',
            );
            expect(error.message).toContain('gh auth login');
            expect(error.message).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case5] a stub gh that is absent from the subprocess PATH', () => {
    when('[t0] the guard step runs', () => {
      then('the guard fails loud; no token is read', async () => {
        const dir = genTempDir({ slug: 'radio-ambient-stub-absent' });
        const stubPath = path.join(dir, 'gh');
        fs.writeFileSync(stubPath, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
        const error = await getError(assertStubGhOnPath({ stubPath }));
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('stub gh not on the subprocess PATH');
      });
    });
  });
});
