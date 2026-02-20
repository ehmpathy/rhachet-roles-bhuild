/**
 * .what = TUI integration tests for FeedbackRepl
 *
 * .why = unit tests with ink-test-library simulate stdin, but do not prove
 *        that actual terminal escape sequences work correctly. these tests
 *        spawn a real PTY and send raw escape sequences to verify the full
 *        terminal stack: terminal → escape sequence → ink → render.
 */

import * as fs from 'fs/promises';
import * as pty from 'node-pty';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

// ────────────────────────────────────────────────────────────────────
// escape sequences for keyboard input
// ────────────────────────────────────────────────────────────────────

const KEYS = {
  // newline insertion keys
  ctrlJ: '\x0a', // traditional unix newline
  shiftEnterCsiU: '\x1b[13;2u', // CSI u format
  ctrlEnterCsiU: '\x1b[13;5u', // CSI u format
  altEnterCsiU: '\x1b[13;3u', // CSI u format
  shiftEnterModifyOtherKeys: '\x1b[27;2;13~', // modifyOtherKeys format
  ctrlEnterModifyOtherKeys: '\x1b[27;5;13~', // modifyOtherKeys format
  altEnterModifyOtherKeys: '\x1b[27;3;13~', // modifyOtherKeys format

  // submit and control
  enter: '\r',
  ctrlC: '\x03',
  ctrlS: '\x13',
  ctrlZ: '\x1a',
  ctrlY: '\x19',

  // navigation
  shiftTab: '\x1b[Z',
  arrowUp: '\x1b[A',
  arrowDown: '\x1b[B',
};

// ────────────────────────────────────────────────────────────────────
// helper to spawn repl with PTY and interact with it
// ────────────────────────────────────────────────────────────────────

interface ReplHandle {
  pty: pty.IPty;
  write: (data: string) => void;
  waitForOutput: (match: string | RegExp, timeoutMs?: number) => Promise<void>;
  getOutput: () => string;
  close: () => void;
}

const spawnRepl = (feedbackFile: string): ReplHandle => {
  let output = '';

  const ptyProcess = pty.spawn(
    'npx',
    ['tsx', 'src/.test/infra/runReplForTuiTest.ts', feedbackFile],
    {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    },
  );

  ptyProcess.onData((data: string) => {
    output += data;
  });

  const write = (data: string): void => {
    ptyProcess.write(data);
  };

  const waitForOutput = async (
    match: string | RegExp,
    timeoutMs = 10000,
  ): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (
        typeof match === 'string' ? output.includes(match) : match.test(output)
      ) {
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(
      `waitForOutput timed out after ${timeoutMs}ms. match: ${match}\noutput: ${output}`,
    );
  };

  const getOutput = () => output;

  const close = (): void => {
    ptyProcess.kill();
  };

  return { pty: ptyProcess, write, waitForOutput, getOutput, close };
};

// ────────────────────────────────────────────────────────────────────
// test suite
// ────────────────────────────────────────────────────────────────────

describe('FeedbackRepl TUI', () => {
  // ──────────────────────────────────────────────────────────────────
  // spawn and header tests
  // ──────────────────────────────────────────────────────────────────

  given('[case1] repl spawned with empty feedback file', () => {
    let tempFile: string;
    let repl: ReplHandle;

    beforeEach(async () => {
      tempFile = path.join(os.tmpdir(), `feedback-tui-${Date.now()}.md`);
      await fs.writeFile(tempFile, '', 'utf-8');
    });

    afterEach(async () => {
      if (repl) repl.close();
      await fs.rm(tempFile, { force: true });
    });

    when('[t0] repl process starts', () => {
      then('outputs welcome header', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('feedback repl');

        const output = repl.getOutput();
        expect(output).toContain('feedback repl');
      });

      then('outputs control instructions', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');

        const output = repl.getOutput();
        expect(output).toContain('enter');
        expect(output).toContain('ctrl+j');
        expect(output).toContain('shift+tab');
        expect(output).toContain('ctrl+z');
        expect(output).toContain('ctrl+y');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // multiline paste tests
  // note: node-pty terminal emulation does not pass through ctrl+j or CSI u
  // sequences correctly. instead we test multiline via paste detection.
  // ──────────────────────────────────────────────────────────────────

  given('[case2] repl ready for multiline input', () => {
    let tempFile: string;
    let repl: ReplHandle;

    beforeEach(async () => {
      tempFile = path.join(os.tmpdir(), `feedback-tui-${Date.now()}.md`);
      await fs.writeFile(tempFile, '', 'utf-8');
    });

    afterEach(async () => {
      if (repl) repl.close();
      await fs.rm(tempFile, { force: true });
    });

    when('[t1] multiline text is pasted', () => {
      then('newlines are preserved in saved feedback', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');
        await new Promise((r) => setTimeout(r, 500)); // stabilize

        // paste multiline text (detected via inputChar.length > 1 && includes \n)
        repl.write('alpha\nbeta');
        await repl.waitForOutput('alpha');
        await new Promise((r) => setTimeout(r, 500));

        // submit with enter
        repl.write(KEYS.enter);
        await new Promise((r) => setTimeout(r, 2000));

        // verify file contains multiline content
        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toContain('alpha\nbeta');
      });
    });

    when('[t2] multiple lines are pasted at once', () => {
      then('all newlines are preserved', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');
        await new Promise((r) => setTimeout(r, 500)); // stabilize

        // paste 3-line text
        repl.write('line1\nline2\nline3');
        await repl.waitForOutput('line1');
        await new Promise((r) => setTimeout(r, 500));

        repl.write(KEYS.enter);
        await new Promise((r) => setTimeout(r, 2000));

        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toContain('line1\nline2\nline3');
      });
    });

    when('[t3] text with final newline is pasted', () => {
      then('final newline is preserved', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');
        await new Promise((r) => setTimeout(r, 500)); // stabilize

        // paste text with final newline
        repl.write('content with newline\n');
        await repl.waitForOutput('content');
        await new Promise((r) => setTimeout(r, 500));

        repl.write(KEYS.enter);
        await new Promise((r) => setTimeout(r, 2000));

        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toContain('content with newline\n');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // severity toggle tests
  // ──────────────────────────────────────────────────────────────────

  given('[case3] severity toggle via shift+tab', () => {
    let tempFile: string;
    let repl: ReplHandle;

    beforeEach(async () => {
      tempFile = path.join(os.tmpdir(), `feedback-tui-${Date.now()}.md`);
      await fs.writeFile(tempFile, '', 'utf-8');
    });

    afterEach(async () => {
      if (repl) repl.close();
      await fs.rm(tempFile, { force: true });
    });

    when('[t6] shift+tab pressed once', () => {
      then('severity changes to nitpick', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');
        await new Promise((r) => setTimeout(r, 500)); // stabilize

        // toggle severity
        repl.write(KEYS.shiftTab);
        await new Promise((r) => setTimeout(r, 500));

        // type and submit
        repl.write('minor issue');
        await repl.waitForOutput('issue');
        await new Promise((r) => setTimeout(r, 200));
        repl.write(KEYS.enter);
        await new Promise((r) => setTimeout(r, 2000));

        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toContain('nitpick');
      });
    });

    when('[t7] shift+tab pressed twice', () => {
      then('severity cycles back to blocker', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');
        await new Promise((r) => setTimeout(r, 500)); // stabilize

        // toggle twice (blocker -> nitpick -> blocker)
        repl.write(KEYS.shiftTab);
        await new Promise((r) => setTimeout(r, 300));
        repl.write(KEYS.shiftTab);
        await new Promise((r) => setTimeout(r, 500));

        // type and submit
        repl.write('critical issue');
        await repl.waitForOutput('issue');
        await new Promise((r) => setTimeout(r, 200));
        repl.write(KEYS.enter);
        await new Promise((r) => setTimeout(r, 2000));

        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toContain('blocker');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // submit and exit tests
  // ──────────────────────────────────────────────────────────────────

  given('[case4] submit and exit behavior', () => {
    let tempFile: string;
    let repl: ReplHandle;

    beforeEach(async () => {
      tempFile = path.join(os.tmpdir(), `feedback-tui-${Date.now()}.md`);
      await fs.writeFile(tempFile, '', 'utf-8');
    });

    afterEach(async () => {
      if (repl) repl.close();
      await fs.rm(tempFile, { force: true });
    });

    when('[t8] enter pressed with text', () => {
      then('feedback is saved to file', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');
        await new Promise((r) => setTimeout(r, 500)); // stabilize

        repl.write('this is feedback');
        await repl.waitForOutput('feedback');
        await new Promise((r) => setTimeout(r, 200));
        repl.write(KEYS.enter);
        await new Promise((r) => setTimeout(r, 2000));

        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toContain('this is feedback');
        expect(content).toContain('blocker');
      });
    });

    when('[t9] ctrl+c pressed with text', () => {
      then('input is cleared', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');

        repl.write('text to clear');
        await new Promise((r) => setTimeout(r, 100));
        repl.write(KEYS.ctrlC);
        await new Promise((r) => setTimeout(r, 200));

        // file should still be empty (input was cleared, not submitted)
        const content = await fs.readFile(tempFile, 'utf-8');
        expect(content).toBe('');
      });
    });

    when('[t10] ctrl+c pressed twice on empty input', () => {
      then('repl exits', async () => {
        repl = spawnRepl(tempFile);
        await repl.waitForOutput('controls:');

        // double ctrl+c on empty input should exit
        repl.write(KEYS.ctrlC);
        await new Promise((r) => setTimeout(r, 100));
        repl.write(KEYS.ctrlC);
        await new Promise((r) => setTimeout(r, 500));

        // verify repl exited (output should contain exit message or process should be dead)
        const output = repl.getOutput();
        expect(output).toMatch(/exit|bye|closed/i);
      });
    });
  });
});
