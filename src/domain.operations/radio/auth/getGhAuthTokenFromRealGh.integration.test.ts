import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { shx } from '@src/infra/shell/shx';

import { AMBIENT_READ_GH_LOGIN } from './AMBIENT_READ_GH_LOGIN';
import { getAmbientReadOrNone } from './getAmbientReadOrNone';

/**
 * .what = the ambient gh read, run against the REAL gh binary with an empty config of its own
 * .why  = every other ambient test runs a stub gh, so the one fact the code leans on — that the
 *         real `gh auth token` exits 1 with no login — is proven here against the real binary
 *
 * .note = no real login can answer: GH_CONFIG_DIR, XDG_CONFIG_HOME, and HOME all point at a
 *         fresh temp dir, and the read itself unsets GH_TOKEN and GITHUB_TOKEN. gh finds no
 *         host in its empty config, so it asks no os credential store. RADIO_GH_STUB=1 lifts
 *         the test guard on purpose: the isolated config does the guard's job here
 *
 * .note = gh is a declared host dep of this read (exit 127 without it is a named fault), so a
 *         box with no gh fails this test loud rather than skip it
 */
describe('getGhAuthTokenFromRealGh.integration', () => {
  given(
    '[case1] the real gh, with an empty config dir and no env token',
    () => {
      when('[t0] the ambient read asks gh for its login', () => {
        const result = useThen('the read runs', async () => {
          const configDir = genTempDir({ slug: 'radio-real-gh-nologin' });
          fs.mkdirSync(path.join(configDir, 'gh'), { recursive: true });

          // the isolated env rides on the command itself, so the real shx and its process.env stay as every caller runs them
          const envIsolated = `GH_CONFIG_DIR=${path.join(configDir, 'gh')} XDG_CONFIG_HOME=${configDir} HOME=${configDir}`;
          const shxIsolated = (command: string) =>
            shx(`${envIsolated} ${command}`);

          return {
            ghResolved: (await shx('command -v gh')).stdout.trim(),
            ghVersion: (await shxIsolated('gh --version')).stdout,
            configDir,
            token: await getAmbientReadOrNone(
              { command: AMBIENT_READ_GH_LOGIN },
              {
                env: { ...process.env, RADIO_GH_STUB: '1' },
                shx: shxIsolated,
              },
            ),
          };
        });

        then('the gh that answered is the real binary, not a stub', () => {
          expect(result.ghResolved).not.toEqual('');
          expect(result.ghResolved.startsWith(result.configDir)).toEqual(false);
          expect(result.ghVersion).toContain('gh version');
        });

        then('the real no-login exit 1 reads as none, never as a fault', () => {
          expect(result.token).toBeNull();
        });
      });
    },
  );
});
