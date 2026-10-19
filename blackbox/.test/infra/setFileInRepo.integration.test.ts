import fs from 'fs';
import path from 'path';
import { genTempDir, getError, given, then, useBeforeAll, when } from 'test-fns';

import { setFileInRepo } from './setFileInRepo';

/**
 * .what = clamps the fixture-write guard against the host-settings overwrite
 * .why  = a consumer repo's `.claude/settings.json` links out to the host's own
 *         `~/.claude/settings.json`; a fixture write through it clobbered real settings.
 *         each case mirrors one shape of that layout, with a stand-in "host" dir
 */
describe('setFileInRepo', () => {
  given('[case1] the target file is a link to a file outside the repo', () => {
    const scene = useBeforeAll(async () => {
      const hostDir = genTempDir({ slug: 'set-file-host-file' });
      const hostFile = path.join(hostDir, 'settings.json');
      fs.writeFileSync(hostFile, '{"host":true}');
      const repoDir = genTempDir({ slug: 'set-file-repo-file' });
      fs.mkdirSync(path.join(repoDir, '.claude'));
      fs.symlinkSync(hostFile, path.join(repoDir, '.claude', 'settings.json'));
      return { hostFile, repoDir };
    });

    when('[t0] a fixture writes to .claude/settings.json', () => {
      then('the write is refused, and names the link', async () => {
        const error = await getError(() =>
          setFileInRepo({
            repoDir: scene.repoDir,
            path: '.claude/settings.json',
            content: '{"fixture":true}',
          }),
        );
        expect(error.message).toContain('refused a write through a link');
      });

      then('the host file is untouched', () => {
        expect(fs.readFileSync(scene.hostFile, 'utf-8')).toEqual(
          '{"host":true}',
        );
      });
    });
  });

  given(
    '[case2] the target file is a link with an absent target (the ci runner shape)',
    () => {
      const scene = useBeforeAll(async () => {
        const repoDir = genTempDir({ slug: 'set-file-repo-absent' });
        fs.mkdirSync(path.join(repoDir, '.claude'));
        fs.symlinkSync(
          path.join(repoDir, '..', 'absent-host', 'settings.json'),
          path.join(repoDir, '.claude', 'settings.json'),
        );
        return { repoDir };
      });

      when('[t0] a fixture writes to .claude/settings.json', () => {
        then('the write is refused', async () => {
          const error = await getError(() =>
            setFileInRepo({
              repoDir: scene.repoDir,
              path: '.claude/settings.json',
              content: '{"fixture":true}',
            }),
          );
          expect(error.message).toContain('refused a write through a link');
        });
      });
    },
  );

  given('[case3] the target dir is a link to a dir outside the repo', () => {
    const scene = useBeforeAll(async () => {
      const hostDir = genTempDir({ slug: 'set-file-host-dir' });
      const repoDir = genTempDir({ slug: 'set-file-repo-dir' });
      fs.symlinkSync(hostDir, path.join(repoDir, '.claude'));
      return { hostDir, repoDir };
    });

    when('[t0] a fixture writes a fresh file under .claude/', () => {
      then('the write is refused, and names where it would land', async () => {
        const error = await getError(() =>
          setFileInRepo({
            repoDir: scene.repoDir,
            path: '.claude/settings.of.repo.json',
            content: '{"fixture":true}',
          }),
        );
        expect(error.message).toContain('refused a write outside the repo');
      });

      then('no file appears in the host dir', () => {
        expect(
          fs.existsSync(path.join(scene.hostDir, 'settings.of.repo.json')),
        ).toBe(false);
      });
    });

    when('[t1] a fixture writes into a fresh subdir under .claude/', () => {
      then('the write is refused', async () => {
        const error = await getError(() =>
          setFileInRepo({
            repoDir: scene.repoDir,
            path: '.claude/projects/session.jsonl',
            content: '{}',
          }),
        );
        expect(error.message).toContain('refused a write outside the repo');
      });

      then('no subdir is created in the host dir', () => {
        expect(fs.existsSync(path.join(scene.hostDir, 'projects'))).toBe(false);
      });
    });
  });

  given(
    '[case4] the target dir is a link that stays inside the repo (the actor brain dir)',
    () => {
      const scene = useBeforeAll(async () => {
        const repoDir = genTempDir({ slug: 'set-file-repo-inside' });
        const brainDir = path.join(repoDir, '.agent', 'brain', '.claude');
        fs.mkdirSync(brainDir, { recursive: true });
        fs.symlinkSync(brainDir, path.join(repoDir, '.claude'));
        return { brainDir, repoDir };
      });

      when('[t0] a fixture writes .claude/settings.of.repo.json', () => {
        then('the write lands in the brain dir', () => {
          setFileInRepo({
            repoDir: scene.repoDir,
            path: '.claude/settings.of.repo.json',
            content: '{"fixture":true}',
          });
          expect(
            fs.readFileSync(
              path.join(scene.brainDir, 'settings.of.repo.json'),
              'utf-8',
            ),
          ).toEqual('{"fixture":true}');
        });
      });
    },
  );
});
