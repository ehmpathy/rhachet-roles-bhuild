import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getOneRadioUsagePermissionDecision } from './getOneRadioUsagePermissionDecision';

describe('getOneRadioUsagePermissionDecision.integration', () => {
  given('[case1] no state files exist', () => {
    const result = useBeforeAll(async () => {
      const cwd = path.join(os.tmpdir(), `radio-decision-empty-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-decision-home-empty-${Date.now()}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(home, { recursive: true });

      const res = await getOneRadioUsagePermissionDecision(
        { targetRepo: 'ehmpathy/domain-objects', sourceCwd: cwd },
        { homeDir: home },
      );

      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] decision is requested', () => {
      then('blocked due to safe default', () => {
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('safe default (unset)');
      });
    });
  });

  given('[case2] global blocked', () => {
    const result = useBeforeAll(async () => {
      const cwd = path.join(os.tmpdir(), `radio-decision-global-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-decision-home-global-${Date.now()}`,
      );
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });

      await fs.writeFile(
        path.join(storage, 'radio.uses.global.jsonc'),
        '{ "blocked": true }',
      );

      const res = await getOneRadioUsagePermissionDecision(
        { targetRepo: 'ehmpathy/domain-objects', sourceCwd: cwd },
        { homeDir: home },
      );

      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] decision is requested', () => {
      then('blocked due to global state', () => {
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('global blocked');
      });
    });
  });

  given('[case3] local override of org block', () => {
    const result = useBeforeAll(async () => {
      const cwd = path.join(os.tmpdir(), `radio-decision-local-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-decision-home-local-${Date.now()}`,
      );
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      const meterDir = path.join(cwd, '.meter');
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });
      await fs.mkdir(meterDir, { recursive: true });

      // org blocks ehmpathy
      await fs.writeFile(
        path.join(storage, 'radio.uses.org.jsonc'),
        '{ "orgs": { "ehmpathy": "blocked" } }',
      );

      // local allows
      await fs.writeFile(
        path.join(meterDir, 'radio.uses.jsonc'),
        '{ "state": "allowed" }',
      );

      const res = await getOneRadioUsagePermissionDecision(
        { targetRepo: 'ehmpathy/domain-objects', sourceCwd: cwd },
        { homeDir: home },
      );

      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] decision is requested', () => {
      then('allowed due to local override', () => {
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('local allowed');
      });
    });
  });

  given('[case4] org allows target but different org blocked', () => {
    const result = useBeforeAll(async () => {
      const cwd = path.join(os.tmpdir(), `radio-decision-org-${Date.now()}`);
      const home = path.join(
        os.tmpdir(),
        `radio-decision-home-org-${Date.now()}`,
      );
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });

      // @all blocked, ehmpathy allowed
      await fs.writeFile(
        path.join(storage, 'radio.uses.org.jsonc'),
        '{ "orgs": { "@all": "blocked", "ehmpathy": "allowed" } }',
      );

      const res = await getOneRadioUsagePermissionDecision(
        { targetRepo: 'ehmpathy/domain-objects', sourceCwd: cwd },
        { homeDir: home },
      );

      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] decision is requested', () => {
      then('allowed due to org config', () => {
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('org allowed');
      });
    });
  });

  given('[case5] target org blocked via specific entry', () => {
    const result = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `radio-decision-orgblock-${Date.now()}`,
      );
      const home = path.join(
        os.tmpdir(),
        `radio-decision-home-orgblock-${Date.now()}`,
      );
      const storage = path.join(
        home,
        '.rhachet/storage/repo=bhuild/role=dispatcher/.meter',
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.mkdir(storage, { recursive: true });

      // @all allowed, but ehmpathy blocked
      await fs.writeFile(
        path.join(storage, 'radio.uses.org.jsonc'),
        '{ "orgs": { "@all": "allowed", "ehmpathy": "blocked" } }',
      );

      const res = await getOneRadioUsagePermissionDecision(
        { targetRepo: 'ehmpathy/domain-objects', sourceCwd: cwd },
        { homeDir: home },
      );

      await fs.rm(cwd, { recursive: true, force: true });
      await fs.rm(home, { recursive: true, force: true });

      return res;
    });

    when('[t0] decision is requested', () => {
      then('blocked due to org config', () => {
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('org blocked');
      });
    });
  });
});
