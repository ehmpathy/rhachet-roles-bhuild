# roadmap: TUI integration tests for FeedbackRepl

## .what

roadmap to add TUI integration tests that verify real terminal behavior beyond what ink-testing-library can simulate.

## .why

unit tests with ink-testing-library verify component logic but simulate stdin, not real terminal escape sequences. different terminals (ptyxis, codium, iTerm, ghostty) send different escape sequences for the same key combinations. TUI integration tests via @microsoft/tui-test verify the full stack: terminal → escape sequence → ink → render.

## .inventory: unit tests

| file | cases | tests | coverage |
|------|-------|-------|----------|
| FeedbackRepl.input.test.ts | 4 | 11 | text input, submit, newlines, paste |
| FeedbackRepl.cursor.test.ts | 4 | 15 | arrow keys, backspace, delete, position |
| FeedbackRepl.exit.test.ts | 2 | 4 | ctrl+c clear, double ctrl+c exit |
| FeedbackRepl.history.test.ts | 2 | 14 | up/down navigation, edit mode exit |
| FeedbackRepl.render.test.ts | 3 | 6 | initial render, prior counts, index |
| FeedbackRepl.severity.test.ts | 2 | 4 | shift+tab toggle |
| FeedbackRepl.undo.test.ts | 3 | 4 | ctrl+z, ctrl+y, buffer restore |
| **total** | **20** | **58** | |

## .triage: which tests need TUI integration

### .high priority — terminal escape sequences vary

these behaviors depend on escape sequences that differ across terminals. unit tests use simulated sequences; TUI tests verify real sequences.

| behavior | unit test | TUI test needed | why |
|----------|-----------|-----------------|-----|
| shift+enter newline | ✓ FeedbackRepl.input.test.ts | **yes** | CSI u vs modifyOtherKeys vs raw `\n` |
| ctrl+enter newline | ✗ not covered | **yes** | same as shift+enter |
| alt+enter newline | ✗ not covered | **yes** | same as shift+enter |
| ctrl+j newline | ✗ not covered | **yes** | verify `\n` detection works |
| multiline paste | ✓ FeedbackRepl.input.test.ts | **yes** | verify real paste behavior |
| shift+tab toggle | ✓ FeedbackRepl.severity.test.ts | **yes** | verify escape sequence `\x1b[Z` |

### .medium priority — critical paths worth verification

these behaviors are well-tested in unit tests but worth end-to-end verification.

| behavior | unit test | TUI test needed | why |
|----------|-----------|-----------------|-----|
| submit via enter | ✓ FeedbackRepl.input.test.ts | nice-to-have | verify `\r` works |
| double ctrl+c exit | ✓ FeedbackRepl.exit.test.ts | nice-to-have | verify time behavior in real terminal |
| ctrl+z undo | ✓ FeedbackRepl.undo.test.ts | nice-to-have | verify `\x1a` detection |
| ctrl+y redo | ✓ FeedbackRepl.undo.test.ts | nice-to-have | verify `\x19` detection |

### .low priority — unit tests are sufficient

these behaviors are logic-only and don't depend on terminal escape sequences.

| behavior | unit test | TUI test needed | why |
|----------|-----------|-----------------|-----|
| history navigation | ✓ FeedbackRepl.history.test.ts | no | arrow keys are standard |
| cursor position | ✓ FeedbackRepl.cursor.test.ts | no | logic-only |
| backspace/delete | ✓ FeedbackRepl.cursor.test.ts | no | standard keys |
| index management | ✓ FeedbackRepl.render.test.ts | no | pure state logic |
| callback contracts | ✓ various | no | interface verification |

## .implementation plan

### phase 1: setup @microsoft/tui-test

1. install dependencies
   ```sh
   pnpm add -D @microsoft/tui-test playwright
   ```

2. create test config at `tui.config.ts`
   ```ts
   import { defineConfig } from '@microsoft/tui-test';
   export default defineConfig({
     retries: 2,
     timeout: 30000,
   });
   ```

3. add npm scripts
   ```json
   {
     "test:tui": "tui-test",
     "test:tui:headed": "tui-test --headed"
   }
   ```

### phase 2: high priority tests

create `FeedbackRepl.tui.test.ts` with:

```ts
import { test, expect } from '@microsoft/tui-test';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

test.describe('FeedbackRepl.tui', () => {
  let feedbackFile: string;

  test.beforeEach(async () => {
    feedbackFile = path.join(os.tmpdir(), `feedback-${Date.now()}.md`);
  });

  test.afterEach(async () => {
    await fs.rm(feedbackFile, { force: true });
  });

  test.use({
    program: {
      file: 'npx',
      args: ['rhachet', 'run', '--skill', 'give.feedback', '--against', feedbackFile, '--talk'],
    },
  });

  // high priority: newline via shift+enter
  test('shift+enter inserts newline without submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1');
    terminal.write('\x1b[13;2u'); // CSI u shift+enter
    terminal.write('line2');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2');
  });

  // high priority: newline via ctrl+j
  test('ctrl+j inserts newline without submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1');
    terminal.write('\n'); // ctrl+j sends \n
    terminal.write('line2');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2');
  });

  // high priority: ctrl+enter
  test('ctrl+enter inserts newline without submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1');
    terminal.write('\x1b[13;5u'); // CSI u ctrl+enter
    terminal.write('line2');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2');
  });

  // high priority: alt+enter
  test('alt+enter inserts newline without submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1');
    terminal.write('\x1b[13;3u'); // CSI u alt+enter
    terminal.write('line2');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2');
  });

  // high priority: shift+tab toggle
  test('shift+tab toggles severity to nitpick', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('\x1b[Z'); // shift+tab
    await expect(terminal.getByText('# nitpick.1')).toBeVisible();
  });

  // high priority: multiline paste
  test('multiline paste inserts without submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1\nline2\nline3');
    // should not submit, all lines should be visible
    await expect(terminal.getByText('line1')).toBeVisible();
    await expect(terminal.getByText('line2')).toBeVisible();
    await expect(terminal.getByText('line3')).toBeVisible();
    // now submit
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2\nline3');
  });
});
```

### phase 3: medium priority tests

add to same file:

```ts
  // medium priority: submit via enter
  test('enter submits feedback', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('my feedback');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    await expect(terminal.getByText('# blocker.2')).toBeVisible();
  });

  // medium priority: double ctrl+c exit
  test('double ctrl+c exits repl', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('\x03'); // ctrl+c
    await expect(terminal.getByText('press ctrl+c again to exit')).toBeVisible();
    await new Promise(r => setTimeout(r, 600)); // wait 600ms
    terminal.write('\x03'); // ctrl+c
    // terminal should close
  });
```

### phase 4: ci integration

add to `.github/workflows/ci.yml`:

```yaml
  test-tui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run test:tui
```

## .test file structure

```
src/domain.operations/behavior/feedback/repl/
├── FeedbackRepl.tsx
├── FeedbackRepl.cursor.test.ts      # unit tests
├── FeedbackRepl.exit.test.ts        # unit tests
├── FeedbackRepl.history.test.ts     # unit tests
├── FeedbackRepl.input.test.ts       # unit tests
├── FeedbackRepl.render.test.ts      # unit tests
├── FeedbackRepl.severity.test.ts    # unit tests
├── FeedbackRepl.undo.test.ts        # unit tests
└── FeedbackRepl.tui.test.ts         # TUI integration tests (new)
```

## .timeline

| phase | scope | tests | effort |
|-------|-------|-------|--------|
| 1 | setup | 0 | 1-2 hrs |
| 2 | high priority | 6 | 2-3 hrs |
| 3 | medium priority | 2 | 1 hr |
| 4 | ci integration | 0 | 30 min |
| **total** | | **8** | **~6 hrs** |

## .success criteria

1. all high priority TUI tests pass on linux (ci runner)
2. newline insertion works via shift+enter, ctrl+enter, alt+enter, ctrl+j
3. shift+tab toggles severity correctly
4. multiline paste does not trigger submit
5. TUI tests run in ci alongside unit tests

## .deep dive: exhaustive multiline test matrix

the multiline experiences are the primary pain points. this section details exhaustive coverage.

### .problem statement

multiline input in terminal apps is notoriously fragile:
1. **newline insertion** — terminals send different escape sequences for shift+enter, ctrl+enter, alt+enter
2. **multiline paste** — must detect paste vs manual newline, must not submit on paste
3. **multiline history** — navigate entries with different line counts, terminal must clear stale lines

### .test matrix: newline insertion

| test id | action | terminal sequence | expected | why |
|---------|--------|-------------------|----------|-----|
| NL-01 | shift+enter (CSI u) | `\x1b[13;2u` | newline, no submit | ptyxis, kitty, modern terminals |
| NL-02 | shift+enter (modifyOtherKeys) | `\x1b[27;2;13~` | newline, no submit | ghostty, xterm |
| NL-03 | shift+enter (ink flags) | key.shift + key.return | newline, no submit | some terminals via ink detection |
| NL-04 | ctrl+enter (CSI u) | `\x1b[13;5u` | newline, no submit | modern terminals |
| NL-05 | ctrl+enter (modifyOtherKeys) | `\x1b[27;5;13~` | newline, no submit | ghostty, xterm |
| NL-06 | alt+enter (CSI u) | `\x1b[13;3u` | newline, no submit | modern terminals |
| NL-07 | alt+enter (modifyOtherKeys) | `\x1b[27;3;13~` | newline, no submit | ghostty, xterm |
| NL-08 | ctrl+j | `\n` (ASCII 10) | newline, no submit | universal fallback |
| NL-09 | ctrl+shift+enter (CSI u) | `\x1b[13;6u` | newline, no submit | edge case |
| NL-10 | alt+shift+enter (CSI u) | `\x1b[13;4u` | newline, no submit | edge case |

**exhaustive test code:**

```ts
test.describe('newline insertion', () => {
  const NEWLINE_SEQUENCES = [
    { name: 'shift+enter (CSI u)', seq: '\x1b[13;2u' },
    { name: 'shift+enter (modifyOtherKeys)', seq: '\x1b[27;2;13~' },
    { name: 'ctrl+enter (CSI u)', seq: '\x1b[13;5u' },
    { name: 'ctrl+enter (modifyOtherKeys)', seq: '\x1b[27;5;13~' },
    { name: 'alt+enter (CSI u)', seq: '\x1b[13;3u' },
    { name: 'alt+enter (modifyOtherKeys)', seq: '\x1b[27;3;13~' },
    { name: 'ctrl+j', seq: '\n' },
    { name: 'ctrl+shift+enter (CSI u)', seq: '\x1b[13;6u' },
    { name: 'alt+shift+enter (CSI u)', seq: '\x1b[13;4u' },
  ];

  for (const { name, seq } of NEWLINE_SEQUENCES) {
    test(`${name} inserts newline without submit`, async ({ terminal }) => {
      await expect(terminal.getByText('# blocker.1')).toBeVisible();
      terminal.write('line1');
      terminal.write(seq);
      terminal.write('line2');
      // verify no submit yet
      await expect(terminal.getByText('line1')).toBeVisible();
      await expect(terminal.getByText('line2')).toBeVisible();
      // now submit
      terminal.submit();
      await expect(terminal.getByText('saved')).toBeVisible();
      const content = await fs.readFile(feedbackFile, 'utf-8');
      expect(content).toContain('line1\nline2');
    });
  }

  test('multiple newlines via mixed sequences', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1');
    terminal.write('\x1b[13;2u'); // shift+enter CSI u
    terminal.write('line2');
    terminal.write('\n'); // ctrl+j
    terminal.write('line3');
    terminal.write('\x1b[13;5u'); // ctrl+enter CSI u
    terminal.write('line4');
    terminal.submit();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2\nline3\nline4');
  });

  test('newline at cursor position (mid-text)', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('ab');
    terminal.write('\x1b[D'); // left arrow
    terminal.write('\x1b[13;2u'); // shift+enter
    terminal.submit();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('a\nb');
  });
});
```

### .test matrix: multiline paste

| test id | scenario | input | expected | why |
|---------|----------|-------|----------|-----|
| MP-01 | 2-line paste | `line1\nline2` | both lines visible, no submit | basic paste |
| MP-02 | 3-line paste | `line1\nline2\nline3` | all lines visible, no submit | multi-line paste |
| MP-03 | paste with final newline | `line1\nline2\n` | no submit | final newline is not enter |
| MP-04 | paste then submit | `line1\nline2` + enter | submit with both lines | full flow |
| MP-05 | paste at cursor position | type `ab`, left, paste `x\ny` | `ax\nyb` | mid-text paste |
| MP-06 | paste then edit | paste, backspace, type | cursor tracks correctly | edit after paste |
| MP-07 | paste exits history mode | up-arrow, paste | exits history, inserts paste | state transition |

**exhaustive test code:**

```ts
test.describe('multiline paste', () => {
  test('2-line paste does not submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1\nline2');
    // should not submit
    await expect(terminal.getByText('line1')).toBeVisible();
    await expect(terminal.getByText('line2')).toBeVisible();
    // verify still on blocker.1 (not incremented)
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
  });

  test('3-line paste does not submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1\nline2\nline3');
    await expect(terminal.getByText('line1')).toBeVisible();
    await expect(terminal.getByText('line2')).toBeVisible();
    await expect(terminal.getByText('line3')).toBeVisible();
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
  });

  test('paste with final newline does not submit', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1\nline2\n');
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
  });

  test('paste then enter submits all lines', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1\nline2');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nline2');
  });

  test('paste at cursor mid-text', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('ab');
    terminal.write('\x1b[D'); // left arrow (cursor between a and b)
    terminal.write('x\ny'); // paste multiline
    terminal.submit();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('ax\nyb');
  });

  test('paste then backspace tracks cursor correctly', async ({ terminal }) => {
    await expect(terminal.getByText('# blocker.1')).toBeVisible();
    terminal.write('line1\nline2');
    terminal.write('\x7f'); // backspace
    terminal.write('X');
    terminal.submit();
    const content = await fs.readFile(feedbackFile, 'utf-8');
    expect(content).toContain('line1\nlinX');
  });

  test('paste exits history navigation mode', async ({ terminal }) => {
    // first submit an item to create history
    terminal.write('history entry');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();

    // navigate to history
    terminal.write('\x1b[A'); // up arrow
    await expect(terminal.getByText('history entry')).toBeVisible();

    // paste multiline (should exit history mode)
    terminal.write('new\ntext');
    // should have the pasted text now, not pure history
    await expect(terminal.getByText('new')).toBeVisible();
  });
});
```

### .test matrix: multiline history navigation

| test id | scenario | history state | action | expected |
|---------|----------|---------------|--------|----------|
| MH-01 | single-line → single-line | `['a', 'b']` | up, up | shows 'b' |
| MH-02 | single-line → multiline | `['a', 'b\nc']` | up, up | shows 'b\nc', renders 2 lines |
| MH-03 | multiline → single-line | `['a\nb', 'c']` | up, up | shows 'c', **clears stale line** |
| MH-04 | multiline → multiline (same) | `['a\nb', 'c\nd']` | up, up | shows 'c\nd' |
| MH-05 | multiline → multiline (fewer) | `['a\nb\nc', 'd\ne']` | up, up | shows 'd\ne', **clears 1 stale line** |
| MH-06 | multiline → multiline (more) | `['a\nb', 'c\nd\ne']` | up, up | shows 'c\nd\ne' |
| MH-07 | up then down | `['a\nb', 'c']` | up, up, down | shows 'a\nb' |
| MH-08 | up to oldest, then up | `['a', 'b']` | up, up, up | stays on 'b' |
| MH-09 | down past newest | `['a', 'b']` | up, down, down | clears to empty |
| MH-10 | navigate, edit, navigate | `['a', 'b']` | up, type 'x', up | stays on modified 'xa' |

**exhaustive test code:**

```ts
test.describe('multiline history navigation', () => {
  test.beforeEach(async ({ terminal }) => {
    // create history with mixed line counts
    terminal.write('single line');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();

    terminal.write('two\nlines');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();

    terminal.write('three\nlines\nhere');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();
  });

  test('navigate to single-line entry', async ({ terminal }) => {
    // up 3 times to get to 'single line'
    terminal.write('\x1b[A\x1b[A\x1b[A');
    await expect(terminal.getByText('single line')).toBeVisible();
  });

  test('navigate to 2-line entry', async ({ terminal }) => {
    // up 2 times to get to 'two\nlines'
    terminal.write('\x1b[A\x1b[A');
    await expect(terminal.getByText('two')).toBeVisible();
    await expect(terminal.getByText('lines')).toBeVisible();
  });

  test('navigate to 3-line entry', async ({ terminal }) => {
    // up 1 time to get to 'three\nlines\nhere'
    terminal.write('\x1b[A');
    await expect(terminal.getByText('three')).toBeVisible();
    await expect(terminal.getByText('lines')).toBeVisible();
    await expect(terminal.getByText('here')).toBeVisible();
  });

  test('multiline → single-line clears stale lines', async ({ terminal }) => {
    // navigate to 3-line entry
    terminal.write('\x1b[A');
    await expect(terminal.getByText('three')).toBeVisible();

    // navigate to single-line entry
    terminal.write('\x1b[A\x1b[A');
    await expect(terminal.getByText('single line')).toBeVisible();
    // stale 'lines' and 'here' should be cleared
    await expect(terminal.getByText('lines')).not.toBeVisible();
    await expect(terminal.getByText('here')).not.toBeVisible();
  });

  test('up-down-up navigation', async ({ terminal }) => {
    // up to 3-line
    terminal.write('\x1b[A');
    await expect(terminal.getByText('three')).toBeVisible();

    // up to 2-line
    terminal.write('\x1b[A');
    await expect(terminal.getByText('two')).toBeVisible();
    // 'three' should be gone
    await expect(terminal.getByText('three')).not.toBeVisible();

    // down back to 3-line
    terminal.write('\x1b[B');
    await expect(terminal.getByText('three')).toBeVisible();
    // 'two' should be gone
    await expect(terminal.getByText('two')).not.toBeVisible();
  });

  test('down past newest clears input', async ({ terminal }) => {
    // up to 3-line
    terminal.write('\x1b[A');
    await expect(terminal.getByText('three')).toBeVisible();

    // down back to empty
    terminal.write('\x1b[B');
    // should be empty (no text visible except prompt)
    await expect(terminal.getByText('three')).not.toBeVisible();
    await expect(terminal.getByText('> ')).toBeVisible();
  });

  test('edit while in history locks position', async ({ terminal }) => {
    // up to 3-line
    terminal.write('\x1b[A');
    await expect(terminal.getByText('three')).toBeVisible();

    // type a character (exits navigation mode)
    terminal.write('X');

    // up arrow should not navigate (input was modified)
    terminal.write('\x1b[A');
    // still see modified entry, not older one
    await expect(terminal.getByText('Xthree')).toBeVisible();
  });
});
```

### .terminal clear verification

the hardest multiline bug: stale lines remain visible when content shrinks.

```ts
test.describe('terminal clear on shrink', () => {
  test('3-line → 1-line clears 2 stale lines', async ({ terminal }) => {
    // type 3 lines
    terminal.write('aaa');
    terminal.write('\n');
    terminal.write('bbb');
    terminal.write('\n');
    terminal.write('ccc');
    await expect(terminal.getByText('aaa')).toBeVisible();
    await expect(terminal.getByText('bbb')).toBeVisible();
    await expect(terminal.getByText('ccc')).toBeVisible();

    // ctrl+c to clear
    terminal.write('\x03');
    // all 3 lines should be gone
    await expect(terminal.getByText('aaa')).not.toBeVisible();
    await expect(terminal.getByText('bbb')).not.toBeVisible();
    await expect(terminal.getByText('ccc')).not.toBeVisible();
  });

  test('history 3-line → 1-line clears stale lines', async ({ terminal }) => {
    // submit 3-line entry
    terminal.write('aaa\nbbb\nccc');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();

    // submit 1-line entry
    terminal.write('ddd');
    terminal.submit();
    await expect(terminal.getByText('saved')).toBeVisible();

    // navigate to 1-line (most recent)
    terminal.write('\x1b[A');
    await expect(terminal.getByText('ddd')).toBeVisible();

    // navigate to 3-line
    terminal.write('\x1b[A');
    await expect(terminal.getByText('aaa')).toBeVisible();
    await expect(terminal.getByText('bbb')).toBeVisible();
    await expect(terminal.getByText('ccc')).toBeVisible();

    // navigate back to 1-line
    terminal.write('\x1b[B');
    await expect(terminal.getByText('ddd')).toBeVisible();
    // stale lines must be cleared
    await expect(terminal.getByText('bbb')).not.toBeVisible();
    await expect(terminal.getByText('ccc')).not.toBeVisible();
  });
});
```

### .total multiline tests

| category | tests |
|----------|-------|
| newline insertion | 12 |
| multiline paste | 7 |
| multiline history | 6 |
| terminal clear | 2 |
| **total** | **27** |

these 27 tests provide exhaustive coverage of all multiline failure modes.

## .fallback: tmux manual tests

if @microsoft/tui-test has issues, fallback to tmux-based tests per `zoomin.howto-test-tui-with-claude-code.md`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SESSION="feedback-repl-test"
FEEDBACK_FILE="/tmp/test.feedback.md"

cleanup() {
  tmux kill-session -t $SESSION 2>/dev/null || true
  rm -f "$FEEDBACK_FILE"
}
trap cleanup EXIT
cleanup

# start repl
tmux new-session -d -s $SESSION
tmux send-keys -t $SESSION "npx rhachet run --skill give.feedback --against $FEEDBACK_FILE --talk" Enter
sleep 3

# test shift+enter
printf '\x1b[13;2u' | tmux load-buffer -
tmux send-keys -t $SESSION "line1"
tmux paste-buffer -t $SESSION
tmux send-keys -t $SESSION "line2" Enter
sleep 0.5

if grep -q "line1" "$FEEDBACK_FILE" && grep -q "line2" "$FEEDBACK_FILE"; then
  echo "✓ shift+enter test passed"
else
  echo "✗ shift+enter test failed"
  exit 1
fi
```
