# zoomin blueprint: TUI integration tests via @microsoft/tui-test

## .what

add TUI integration tests via `@microsoft/tui-test` to verify terminal behavior with real pty interaction.

## .why

unit tests (ink-testing-library) verify component logic but not:
- actual terminal escape sequence behavior
- real keystroke flows
- end-to-end user flows

`@microsoft/tui-test` closes this gap with:
- isolated terminal contexts per test (parallel safe)
- auto-wait for terminal renders
- snapshot support
- trace/replay for debug
- cross-platform (linux, macos, windows)

## .install

```bash
pnpm add -D @microsoft/tui-test
```

## .structure

```
src/
├── .test/
│   └── infra/
│       └── emitInkStdin.ts          # prior: unit test stdin helper
├── domain.operations/
│   └── behavior/
│       └── feedback/
│           └── repl/
│               ├── FeedbackRepl.tsx
│               ├── FeedbackRepl.input.test.ts        # unit tests
│               ├── FeedbackRepl.tui.test.ts          # NEW: tui-test
│               └── ...
tui-test.config.ts                    # tui-test config
```

## .implementation

### 1. config

```typescript
// tui-test.config.ts
import { defineConfig } from '@microsoft/tui-test';

export default defineConfig({
  retries: 2,
  trace: true, // enable trace for debug
  timeout: 30000,
});
```

### 2. feature tests with @microsoft/tui-test

```typescript
// src/domain.operations/behavior/feedback/repl/FeedbackRepl.tui.test.ts
import { test, expect } from '@microsoft/tui-test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const genFeedbackFile = () => {
  const id = Math.random().toString(36).slice(2, 8);
  return path.join(os.tmpdir(), `feedback-${id}.md`);
};

test.describe('FeedbackRepl.tui', () => {
  test.describe('input and submit', () => {
    const feedbackFile = genFeedbackFile();

    test.use({
      program: {
        file: 'npx',
        args: ['rhachet', 'run', '--skill', 'give.feedback', '--against', feedbackFile, '--talk'],
      },
    });

    test.afterAll(() => {
      if (fs.existsSync(feedbackFile)) fs.unlinkSync(feedbackFile);
    });

    test('shows blocker.1 prompt on start', async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();
    });

    test('submit saves feedback to file', async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();

      terminal.write('this is my feedback');
      terminal.submit(); // sends enter

      await expect(terminal.getByText('saved')).toBeVisible();

      const content = fs.readFileSync(feedbackFile, 'utf-8');
      expect(content).toContain('this is my feedback');
    });

    test('shift+tab toggles severity', async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();

      terminal.write('\x1b[Z'); // shift+tab escape sequence

      await expect(terminal.getByText('nitpick')).toBeVisible();
    });

    test('ctrl+j inserts newline', async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();

      terminal.write('line one');
      terminal.write('\x0a'); // ctrl+j = LF
      terminal.write('line two');
      terminal.submit();

      await expect(terminal.getByText('saved')).toBeVisible();

      const content = fs.readFileSync(feedbackFile, 'utf-8');
      expect(content).toContain('line one');
      expect(content).toContain('line two');
    });
  });

  test.describe('exit behavior', () => {
    const feedbackFile = genFeedbackFile();

    test.use({
      program: {
        file: 'npx',
        args: ['rhachet', 'run', '--skill', 'give.feedback', '--against', feedbackFile, '--talk'],
      },
    });

    test.afterAll(() => {
      if (fs.existsSync(feedbackFile)) fs.unlinkSync(feedbackFile);
    });

    test('double ctrl+c exits', async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();

      terminal.write('\x03'); // ctrl+c
      await expect(terminal.getByText('press ctrl+c again')).toBeVisible();

      // wait 600ms then second ctrl+c
      await new Promise((r) => setTimeout(r, 600));
      terminal.write('\x03');

      await expect(terminal.getByText('feedback items saved')).toBeVisible();
    });
  });

  test.describe('snapshot', () => {
    test.use({
      program: {
        file: 'npx',
        args: ['rhachet', 'run', '--skill', 'give.feedback', '--against', '/tmp/snap.md', '--talk'],
      },
    });

    test('initial render matches snapshot', async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();
      await expect(terminal).toMatchSnapshot();
    });
  });
});
```

### 3. run tui tests

```bash
# run all tui tests
npx tui-test

# run specific test file
npx tui-test FeedbackRepl.tui.test.ts

# run with trace viewer
npx tui-test --trace on
```

## .package.json

```json
{
  "devDependencies": {
    "@microsoft/tui-test": "^0.x.x"
  }
}
```

no additional jest config needed - tui-test has its own runner.

## .key API

| method | description |
|--------|-------------|
| `terminal.write(text)` | send text/escape sequences |
| `terminal.submit()` | send enter |
| `terminal.getByText(text)` | locate text in terminal |
| `expect(...).toBeVisible()` | wait for and assert visibility |
| `expect(terminal).toMatchSnapshot()` | snapshot entire terminal |

## .escape sequences

| key | sequence |
|-----|----------|
| ctrl+c | `\x03` |
| ctrl+j | `\x0a` |
| ctrl+z | `\x1a` |
| shift+tab | `\x1b[Z` |
| up arrow | `\x1b[A` |
| down arrow | `\x1b[B` |

## .fallback: manual tmux wrapper

if `@microsoft/tui-test` doesn't fit, here's a minimal tmux wrapper:

### TmuxSession wrapper

```typescript
// src/.test/infra/tmux/TmuxSession.ts
import { execSync, spawn } from 'child_process';

/**
 * .what = wrapper for tmux session lifecycle and interaction
 * .why = enables programmatic TUI tests via real terminal
 */
export class TmuxSession {
  constructor(private sessionName: string) {}

  /**
   * .what = create a new detached tmux session
   */
  create(): void {
    execSync(`tmux new-session -d -s ${this.sessionName}`, {
      stdio: 'ignore',
    });
  }

  /**
   * .what = kill the tmux session
   */
  kill(): void {
    try {
      execSync(`tmux kill-session -t ${this.sessionName}`, {
        stdio: 'ignore',
      });
    } catch {
      // session may already be dead
    }
  }

  /**
   * .what = check if session exists
   */
  exists(): boolean {
    try {
      execSync(`tmux has-session -t ${this.sessionName}`, {
        stdio: 'ignore',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * .what = send a command to run in the session
   */
  runCommand(command: string): void {
    execSync(
      `tmux send-keys -t ${this.sessionName} ${this.escapeForShell(command)} Enter`,
    );
  }

  /**
   * .what = send keystrokes to the session
   */
  sendKeys(keys: string): void {
    execSync(`tmux send-keys -t ${this.sessionName} ${keys}`);
  }

  /**
   * .what = send text followed by enter
   */
  sendLine(text: string): void {
    execSync(
      `tmux send-keys -t ${this.sessionName} ${this.escapeForShell(text)} Enter`,
    );
  }

  /**
   * .what = send raw escape sequence
   */
  sendEscape(sequence: string): void {
    execSync(`tmux send-keys -t ${this.sessionName} -l $'${sequence}'`);
  }

  /**
   * .what = capture current pane content
   */
  capture(): string {
    return execSync(`tmux capture-pane -t ${this.sessionName} -p`, {
      encoding: 'utf-8',
    });
  }

  /**
   * .what = capture and strip ANSI codes
   */
  captureClean(): string {
    const raw = this.capture();
    return raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  }

  /**
   * .what = wait for output to contain text
   */
  async waitFor(
    text: string,
    options: { timeout?: number; interval?: number } = {},
  ): Promise<boolean> {
    const timeout = options.timeout ?? 5000;
    const interval = options.interval ?? 100;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const output = this.captureClean();
      if (output.includes(text)) return true;
      await this.sleep(interval);
    }
    return false;
  }

  /**
   * .what = wait for session to terminate
   */
  async waitForExit(timeout = 5000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (!this.exists()) return true;
      await this.sleep(100);
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private escapeForShell(text: string): string {
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}
```

### 2. key mappings

```typescript
// src/.test/infra/tmux/keys.ts

/**
 * .what = tmux key name mappings
 * .why = readable test code
 */
export const TMUX_KEYS = {
  enter: 'Enter',
  escape: 'Escape',
  tab: 'Tab',
  shiftTab: 'BTab',
  backspace: 'BSpace',
  delete: 'DC',
  up: 'Up',
  down: 'Down',
  left: 'Left',
  right: 'Right',
  ctrlC: 'C-c',
  ctrlJ: 'C-j',
  ctrlS: 'C-s',
  ctrlZ: 'C-z',
  ctrlY: 'C-y',
} as const;

/**
 * .what = raw escape sequences for keys tmux doesn't name
 */
export const ESCAPE_SEQUENCES = {
  // CSI u format
  shiftEnter: '\\x1b[13;2u',
  altEnter: '\\x1b[13;3u',
  ctrlEnter: '\\x1b[13;5u',
} as const;
```

### 3. session factory

```typescript
// src/.test/infra/tmux/genTmuxSession.ts
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { TmuxSession } from './TmuxSession';

/**
 * .what = create a unique tmux session with auto-cleanup
 * .why = each test gets isolated session, enables parallel execution
 */
export const genTmuxSession = () => {
  const id = Math.random().toString(36).slice(2, 8);
  const session = new TmuxSession(`tui-test-${id}`);
  const feedbackFile = path.join(os.tmpdir(), `feedback-${id}.md`);

  session.create();

  // register cleanup
  afterEach(() => {
    session.kill();
    if (fs.existsSync(feedbackFile)) fs.unlinkSync(feedbackFile);
  });

  return { session, feedbackFile };
};
```

### 4. feature integration test

```typescript
// src/domain.operations/behavior/feedback/repl/FeedbackRepl.tui.integration.test.ts
import * as fs from 'fs';

import { given, then, when } from 'test-fns';

import { genTmuxSession } from '../../../../.test/infra/tmux/genTmuxSession';
import { TMUX_KEYS } from '../../../../.test/infra/tmux/keys';

describe('FeedbackRepl.tui', () => {
  given('[case1] repl started via skill', () => {
    const { session, feedbackFile } = genTmuxSession();

    beforeAll(async () => {
      session.runCommand(
        `npx rhachet run --skill give.feedback --against ${feedbackFile} --talk`,
      );
      await session.waitFor('# blocker.1', { timeout: 5000 });
    });

    when('[t0] user types and submits feedback', () => {
      then('feedback is saved to file', async () => {
        session.sendLine('this is my feedback');
        await session.waitFor('saved');

        const content = fs.readFileSync(feedbackFile, 'utf-8');
        expect(content).toContain('this is my feedback');
      });
    });

    when('[t1] user presses shift+tab', () => {
      then('severity toggles to nitpick', async () => {
        session.sendKeys(TMUX_KEYS.shiftTab);
        const found = await session.waitFor('nitpick');
        expect(found).toBe(true);
      });
    });

    when('[t2] user presses ctrl+j for newline', () => {
      then('multiline feedback is saved', async () => {
        session.sendKeys('"line one"');
        session.sendKeys(TMUX_KEYS.ctrlJ);
        session.sendKeys('"line two"');
        session.sendKeys(TMUX_KEYS.enter);
        await session.waitFor('saved');

        const content = fs.readFileSync(feedbackFile, 'utf-8');
        expect(content).toContain('line one');
        expect(content).toContain('line two');
      });
    });
  });

  given('[case2] exit behavior', () => {
    const { session, feedbackFile } = genTmuxSession();

    beforeAll(async () => {
      session.runCommand(
        `npx rhachet run --skill give.feedback --against ${feedbackFile} --talk`,
      );
      await session.waitFor('# blocker.1', { timeout: 5000 });
    });

    when('[t0] user presses ctrl+c twice', () => {
      then('repl terminates', async () => {
        session.sendKeys(TMUX_KEYS.ctrlC);
        await new Promise((r) => setTimeout(r, 600));
        session.sendKeys(TMUX_KEYS.ctrlC);

        const exited = await session.waitForExit(2000);
        expect(exited).toBe(true);
      });
    });
  });
});
```

### 4. package.json commands (for tmux fallback)

```json
{
  "devDependencies": {
    "@microsoft/tui-test": "^0.x.x"
  }
}
```

for tmux fallback, add jest config:

```typescript
// jest.tui.config.ts
import type { Config } from 'jest';
import baseConfig from './jest.unit.config';

const config: Config = {
  ...baseConfig,
  testMatch: ['**/*.tui.integration.test.ts'],
  testTimeout: 30000,
  // no maxWorkers limit - each test has unique session
};

export default config;
```

## .test organization per feature

each TUI feature gets its own test file:

| feature | unit test | tui integration test |
|---------|-----------|---------------------|
| input | `FeedbackRepl.input.test.ts` | `FeedbackRepl.input.tui.integration.test.ts` |
| severity | `FeedbackRepl.severity.test.ts` | covered in main tui test |
| history | `FeedbackRepl.history.test.ts` | `FeedbackRepl.history.tui.integration.test.ts` |
| cursor | `FeedbackRepl.cursor.test.ts` | `FeedbackRepl.cursor.tui.integration.test.ts` |
| exit | `FeedbackRepl.exit.test.ts` | covered in main tui test |

## .ci considerations

```yaml
# .github/workflows/test.yml
jobs:
  test-tui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: install tmux
        run: sudo apt-get install -y tmux

      - name: setup node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: install deps
        run: npm ci

      - name: build
        run: npm run build

      - name: run tui tests
        run: npm run test:tui
```

## .debug helpers

```typescript
// add to TmuxSession class

/**
 * .what = dump current state for debug
 */
debug(): void {
  console.log('=== TMUX DEBUG ===');
  console.log('session:', this.sessionName);
  console.log('exists:', this.exists());
  console.log('--- output ---');
  console.log(this.capture());
  console.log('--- clean ---');
  console.log(this.captureClean());
  console.log('=================');
}
```

## .usage in tests

```typescript
// when a test fails, call debug to see state
then('feedback is saved', async () => {
  session.sendLine('my feedback');
  const found = await session.waitFor('saved');

  if (!found) {
    session.debug(); // dumps state to console
  }

  expect(found).toBe(true);
});
```

## .next steps

1. create `src/.test/infra/tmux/TmuxSession.ts`
2. create `src/.test/infra/tmux/keys.ts`
3. create `jest.tui.config.ts`
4. add `test:tui` to package.json
5. write first tui integration test
6. add to CI workflow
