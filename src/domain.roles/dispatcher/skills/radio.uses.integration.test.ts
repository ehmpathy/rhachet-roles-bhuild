/**
 * .what = integration tests for radio.uses shell skills
 * .why = verify shell skill behavior matches domain operations
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

const SKILL_PATH = path.resolve(
  __dirname,
  '../../../../dist/domain.roles/dispatcher/skills',
);

/**
 * .what = invoke radio.uses skill
 * .why = reusable test helper
 */
const invokeRadioUses = (input: {
  args: string;
  cwd: string;
  env?: Record<string, string>;
}): { stdout: string; stderr: string; exitCode: number } => {
  try {
    const stdout = execSync(`bash ${SKILL_PATH}/radio.uses.sh ${input.args}`, {
      cwd: input.cwd,
      encoding: 'utf-8',
      env: {
        ...process.env,
        __I_AM_HUMAN: 'true',
        ...input.env,
      },
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      exitCode: execError.status ?? 1,
    };
  }
};

describe('radio.uses', () => {
  given('[case1] fresh repo with no state', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radio-uses-'));
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      return { tempDir };
    });

    when('[t0] get is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({ args: 'get', cwd: scene.tempDir }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('shows unset state', () => {
        expect(result.stdout).toContain('local');
        expect(result.stdout).toContain('unset');
      });
    });

    when('[t1] allow is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({ args: 'allow', cwd: scene.tempDir }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('creates meter file', () => {
        const meterFile = path.join(scene.tempDir, '.meter/radio.uses.jsonc');
        expect(fs.existsSync(meterFile)).toBe(true);
        const content = fs.readFileSync(meterFile, 'utf-8');
        expect(content).toContain('"state": "allowed"');
      });
    });

    when('[t2] block is called after allow', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({ args: 'block', cwd: scene.tempDir }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('updates meter file', () => {
        const meterFile = path.join(scene.tempDir, '.meter/radio.uses.jsonc');
        const content = fs.readFileSync(meterFile, 'utf-8');
        expect(content).toContain('"state": "blocked"');
      });
    });

    when('[t3] del is called after block', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({ args: 'del', cwd: scene.tempDir }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('removes meter file', () => {
        const meterFile = path.join(scene.tempDir, '.meter/radio.uses.jsonc');
        expect(fs.existsSync(meterFile)).toBe(false);
      });
    });
  });

  given('[case2] global commands with isolated home', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radio-uses-'));
      const homeDir = path.join(tempDir, 'home');
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      fs.mkdirSync(homeDir);
      return { tempDir, homeDir };
    });

    when('[t0] --global get is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--global get',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('shows not blocked', () => {
        expect(result.stdout).toContain('global');
      });
    });

    when('[t1] --global block is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--global block',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('creates global state file', () => {
        const globalFile = path.join(
          scene.homeDir,
          '.rhachet/storage/repo=bhuild/role=dispatcher/.meter/radio.uses.global.jsonc',
        );
        expect(fs.existsSync(globalFile)).toBe(true);
        const content = fs.readFileSync(globalFile, 'utf-8');
        expect(content).toContain('"blocked": true');
      });
    });

    when('[t2] --global allow is called after block', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--global allow',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('removes global state file', () => {
        const globalFile = path.join(
          scene.homeDir,
          '.rhachet/storage/repo=bhuild/role=dispatcher/.meter/radio.uses.global.jsonc',
        );
        expect(fs.existsSync(globalFile)).toBe(false);
      });
    });
  });

  given('[case3] org commands with isolated home', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radio-uses-'));
      const homeDir = path.join(tempDir, 'home');
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      fs.mkdirSync(homeDir);
      return { tempDir, homeDir };
    });

    when('[t0] --org ehmpathy allow is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--org ehmpathy allow',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('creates org state file with ehmpathy allowed', () => {
        const orgFile = path.join(
          scene.homeDir,
          '.rhachet/storage/repo=bhuild/role=dispatcher/.meter/radio.uses.org.jsonc',
        );
        expect(fs.existsSync(orgFile)).toBe(true);
        const content = fs.readFileSync(orgFile, 'utf-8');
        expect(content).toContain('"ehmpathy": "allowed"');
      });
    });

    when('[t1] --org @all block is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--org @all block',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('adds @all to org state', () => {
        const orgFile = path.join(
          scene.homeDir,
          '.rhachet/storage/repo=bhuild/role=dispatcher/.meter/radio.uses.org.jsonc',
        );
        const content = fs.readFileSync(orgFile, 'utf-8');
        expect(content).toContain('"@all": "blocked"');
        expect(content).toContain('"ehmpathy": "allowed"');
      });
    });

    when('[t2] --org ehmpathy del is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--org ehmpathy del',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('removes ehmpathy from org state', () => {
        const orgFile = path.join(
          scene.homeDir,
          '.rhachet/storage/repo=bhuild/role=dispatcher/.meter/radio.uses.org.jsonc',
        );
        const content = fs.readFileSync(orgFile, 'utf-8');
        expect(content).not.toContain('"ehmpathy"');
        expect(content).toContain('"@all": "blocked"');
      });
    });

    when('[t3] --org @all get is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--org @all get',
          cwd: scene.tempDir,
          env: { HOME: scene.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('shows org state', () => {
        expect(result.stdout).toContain('org');
      });
    });
  });

  given('[case4] tty guard blocks non-human mutations', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radio-uses-'));
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      return { tempDir };
    });

    when('[t0] allow is called without __I_AM_HUMAN', () => {
      const result = useThen('skill runs', () => {
        try {
          const stdout = execSync(`bash ${SKILL_PATH}/radio.uses.sh allow`, {
            cwd: scene.tempDir,
            encoding: 'utf-8',
            env: { ...process.env, __I_AM_HUMAN: undefined },
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          return { stdout, stderr: '', exitCode: 0 };
        } catch (error: unknown) {
          const execError = error as {
            stdout?: string;
            stderr?: string;
            status?: number;
          };
          return {
            stdout: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
            exitCode: execError.status ?? 1,
          };
        }
      });

      then('exits non-zero', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('shows blocked message', () => {
        expect(result.stdout).toContain('humans');
      });
    });

    when('[t1] get is called without __I_AM_HUMAN (read allowed)', () => {
      const result = useThen('skill runs', () => {
        try {
          const stdout = execSync(`bash ${SKILL_PATH}/radio.uses.sh get`, {
            cwd: scene.tempDir,
            encoding: 'utf-8',
            env: { ...process.env, __I_AM_HUMAN: undefined },
          });
          return { stdout, stderr: '', exitCode: 0 };
        } catch (error: unknown) {
          const execError = error as {
            stdout?: string;
            stderr?: string;
            status?: number;
          };
          return {
            stdout: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
            exitCode: execError.status ?? 1,
          };
        }
      });

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });
    });
  });

  given('[case5] help output', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radio-uses-'));
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      return { tempDir };
    });

    when('[t0] --help is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({ args: '--help', cwd: scene.tempDir }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('shows usage', () => {
        expect(result.stdout).toContain('usage');
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] --global --help is called', () => {
      const result = useThen('skill runs', () =>
        invokeRadioUses({ args: '--global --help', cwd: scene.tempDir }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('shows global usage', () => {
        expect(result.stdout).toContain('global');
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t2] --org --help is called', () => {
      const scene2 = useBeforeAll(async () => {
        const homeDir = path.join(scene.tempDir, 'home');
        fs.mkdirSync(homeDir, { recursive: true });
        return { homeDir };
      });

      const result = useThen('skill runs', () =>
        invokeRadioUses({
          args: '--org ehmpathy --help',
          cwd: scene.tempDir,
          env: { HOME: scene2.homeDir },
        }),
      );

      then('exits 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('shows org usage', () => {
        expect(result.stdout).toContain('org');
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });
});
