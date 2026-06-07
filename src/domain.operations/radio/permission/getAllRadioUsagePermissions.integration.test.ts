import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllRadioUsagePermissions } from './getAllRadioUsagePermissions';

describe('getAllRadioUsagePermissions.integration', () => {
  // isolated temp directories
  const testId = Date.now();
  const testCwd = path.join(os.tmpdir(), `radio-perm-cwd-${testId}`);
  const testHome = path.join(os.tmpdir(), `radio-perm-home-${testId}`);
  const globalStoragePath = path.join(
    testHome,
    '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
  );

  beforeAll(async () => {
    await fs.mkdir(testCwd, { recursive: true });
    await fs.mkdir(globalStoragePath, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testCwd, { recursive: true, force: true });
    await fs.rm(testHome, { recursive: true, force: true });
  });

  given('[case1] no state files', () => {
    const result = useBeforeAll(async () => {
      // create fresh temp dirs
      const cwd = path.join(os.tmpdir(), `radio-perm-empty-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-perm-home-empty-${Date.now()}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(home, { recursive: true });

      const res = await getAllRadioUsagePermissions({ cwd }, { homeDir: home });

      // cleanup
      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] getAllRadioUsagePermissions is called', () => {
      then('global is null', () => {
        expect(result.global).toBeNull();
      });

      then('org is null', () => {
        expect(result.org).toBeNull();
      });

      then('local is null', () => {
        expect(result.local).toBeNull();
      });
    });
  });

  given('[case2] local state file', () => {
    const result = useBeforeAll(async () => {
      // create temp dirs
      const cwd = path.join(os.tmpdir(), `radio-perm-local-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-perm-home-local-${Date.now()}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(home, { recursive: true });

      // write local state
      const meterDir = path.join(cwd, '.meter');
      await fs.mkdir(meterDir, { recursive: true });
      await fs.writeFile(
        path.join(meterDir, 'radio.uses.jsonc'),
        '// local state\n{ "state": "allowed" }',
      );

      const res = await getAllRadioUsagePermissions({ cwd }, { homeDir: home });

      // cleanup
      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] getAllRadioUsagePermissions is called', () => {
      then('local state is read correctly', () => {
        expect(result.local).toEqual({ state: 'allowed' });
      });

      then('global is null', () => {
        expect(result.global).toBeNull();
      });

      then('org is null', () => {
        expect(result.org).toBeNull();
      });
    });
  });

  given('[case3] global state file', () => {
    const result = useBeforeAll(async () => {
      // create temp dirs
      const cwd = path.join(os.tmpdir(), `radio-perm-global-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-perm-home-global-${Date.now()}`,
      );
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });

      // write global state
      await fs.writeFile(
        path.join(storage, 'radio.uses.global.jsonc'),
        '// global state\n{ "blocked": true }',
      );

      const res = await getAllRadioUsagePermissions({ cwd }, { homeDir: home });

      // cleanup
      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] getAllRadioUsagePermissions is called', () => {
      then('global state is read correctly', () => {
        expect(result.global).toEqual({ blocked: true });
      });

      then('local is null', () => {
        expect(result.local).toBeNull();
      });

      then('org is null', () => {
        expect(result.org).toBeNull();
      });
    });
  });

  given('[case4] org state file', () => {
    const result = useBeforeAll(async () => {
      // create temp dirs
      const cwd = path.join(os.tmpdir(), `radio-perm-org-${Date.now()}`);
      const home = path.join(os.tmpdir(), `radio-perm-home-org-${Date.now()}`);
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });

      // write org state
      await fs.writeFile(
        path.join(storage, 'radio.uses.org.jsonc'),
        '// org state\n{ "orgs": { "@all": "blocked", "ehmpathy": "allowed" } }',
      );

      const res = await getAllRadioUsagePermissions({ cwd }, { homeDir: home });

      // cleanup
      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] getAllRadioUsagePermissions is called', () => {
      then('org state is read correctly', () => {
        expect(result.org).toEqual({
          orgs: { '@all': 'blocked', ehmpathy: 'allowed' },
        });
      });

      then('local is null', () => {
        expect(result.local).toBeNull();
      });

      then('global is null', () => {
        expect(result.global).toBeNull();
      });
    });
  });

  given('[case5] all state files', () => {
    const result = useBeforeAll(async () => {
      // create temp dirs
      const cwd = path.join(os.tmpdir(), `radio-perm-all-${Date.now()}`);
      const home = path.join(os.tmpdir(), `radio-perm-home-all-${Date.now()}`);
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });

      // write local state
      const meterDir = path.join(cwd, '.meter');
      await fs.mkdir(meterDir, { recursive: true });
      await fs.writeFile(
        path.join(meterDir, 'radio.uses.jsonc'),
        '{ "state": "blocked" }',
      );

      // write global state
      await fs.writeFile(
        path.join(storage, 'radio.uses.global.jsonc'),
        '{ "blocked": false }',
      );

      // write org state
      await fs.writeFile(
        path.join(storage, 'radio.uses.org.jsonc'),
        '{ "orgs": { "@all": "allowed", "ahbode": "blocked" } }',
      );

      const res = await getAllRadioUsagePermissions({ cwd }, { homeDir: home });

      // cleanup
      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] getAllRadioUsagePermissions is called', () => {
      then('all states are read correctly', () => {
        expect(result.local).toEqual({ state: 'blocked' });
        expect(result.global).toEqual({ blocked: false });
        expect(result.org).toEqual({
          orgs: { '@all': 'allowed', ahbode: 'blocked' },
        });
      });
    });
  });
});
