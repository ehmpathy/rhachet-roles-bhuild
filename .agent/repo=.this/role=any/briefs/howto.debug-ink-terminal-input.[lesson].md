# howto: debug ink terminal input

## .what

debug terminal input issues in react ink apps where useInput hook fails to receive keystrokes that work in manual terminal tests.

## .why

- ink's `useInput` hook requires raw mode on stdin
- different terminals send different escape sequences for the same key combo
- test libraries may send different sequences than real terminals
- stdin must be a TTY with raw mode enabled

## .the problem

tests pass but real terminal input fails. common symptoms:
- multiline paste doesn't work
- shift+enter or ctrl+j doesn't insert newlines
- history navigation via arrow keys fails
- backspace doesn't delete characters
- characters appear but never reach useInput handler

## .root causes

### 1. raw mode not enabled

ink requires `process.stdin.setRawMode(true)` which only works when stdin is a TTY.

check via:
```ts
console.log('stdin.isTTY:', process.stdin.isTTY);
console.log('stdin.isRaw:', process.stdin.isRaw);
```

if `isTTY` is false, you're in piped mode and raw mode won't work.

### 2. escape sequence mismatch

different terminals send different escape sequences:

| action | CSI u format | modifyOtherKeys format |
|--------|--------------|------------------------|
| shift+enter | `\x1b[13;2u` | `\x1b[27;2;13~` |
| ctrl+enter | `\x1b[13;5u` | `\x1b[27;5;13~` |
| alt+enter | `\x1b[13;3u` | `\x1b[27;3;13~` |

your code must handle both formats.

### 3. test library vs real terminal

node-pty and ink-test-library simulate stdin differently than real terminals:
- node-pty creates a real PTY but may send different sequences
- ink-test-library uses a mock stdin stream
- both may pass tests while real terminal fails

## .how claude code handles input

### multiline input pattern

claude code uses [Alt+Enter for newlines](https://github.com/anthropics/claude-code/issues/18042), not Shift+Enter. Ctrl+g also works as a workaround.

### raw mode limitation

when stdin is piped, claude code shows: "Error: Raw mode is not supported on the current process.stdin, which Ink uses as input stream by default."

workarounds:
- use `-p` flag for non-interactive mode
- avoid piped stdin for interactive sessions

see [issue #1072](https://github.com/anthropics/claude-code/issues/1072) for details.

### custom renderer

anthropic rewrote their renderer from scratch (not ink default) to support fine-grained incremental updates. they report ~16ms frame budget with ~5ms to convert react to ansi.

## .how to test ink components

### ink-test-library pattern

```ts
import { render } from 'ink-testing-library';
import { emitInkStdin } from '@src/.test/infra/emitInkStdin';

test('handles shift+tab', async () => {
  const { stdin, lastFrame } = render(React.createElement(MyComponent, {}));
  const emit = emitInkStdin({ stdin });

  await emit.key('shiftTab');

  expect(lastFrame()).toContain('expected');
});
```

key: add 100ms delays between `stdin.write()` and assertions. ink processes stdin asynchronously.

### tui tests with node-pty

```ts
import * as pty from 'node-pty';

const ptyProcess = pty.spawn('npx', ['tsx', 'myRepl.ts'], {
  name: 'xterm-256color',
  cols: 120,
  rows: 30,
});

ptyProcess.write('hello');  // send input
ptyProcess.onData((data) => { /* capture output */ });
```

limitation: node-pty may send different escape sequences than the user's terminal.

### how claude code tests their TUI

per [anthropic engineers](https://hatchet.run/blog/tuis-are-easy-now): "the most important piece was claude code: a terminal-based agent is exceptionally good at driving other terminal-based tools."

their approach:
1. build component or view
2. compile the TUI
3. have claude code drive first pass of tests

this is self-referential: claude code tests claude code's TUI.

## .debug checklist

### 1. add debug log to file

```ts
const DEBUG = process.env.DEBUG_REPL === 'true';
const debugLog = (msg: string) => {
  if (!DEBUG) return;
  fs.appendFileSync('/tmp/repl-debug.log', `${new Date().toJSON()} ${msg}\n`);
};
```

### 2. log stdin state on mount

```ts
useEffect(() => {
  debugLog(`stdin.isTTY=${process.stdin.isTTY}`);
  debugLog(`stdin.isRaw=${process.stdin.isRaw}`);
  debugLog(`stdin.readable=${process.stdin.readable}`);
}, []);
```

### 3. log raw stdin data

```ts
useEffect(() => {
  const listener = (data: Buffer) => {
    const hex = [...data].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    debugLog(`stdin.data: hex=[${hex}]`);
  };
  process.stdin.on('data', listener);
  return () => process.stdin.off('data', listener);
}, []);
```

### 4. log useInput parsed values

```ts
useInput((char, key) => {
  const keyFlags = Object.entries(key).filter(([, v]) => v).map(([k]) => k);
  const charHex = [...char].map((c) => c.charCodeAt(0).toString(16)).join(' ');
  debugLog(`useInput: char="${char}" hex=[${charHex}] keys=[${keyFlags.join(',')}]`);
});
```

### 5. run with debug enabled

```sh
DEBUG_REPL=true npx tsx myRepl.ts
# then check /tmp/repl-debug.log
```

## .multiline input patterns

### ctrl+j (reliable)

ctrl+j sends `\n` (0x0a) in most terminals. detect via:

```ts
const isCtrlJ = inputChar === '\n';
```

### shift+enter detection

must handle both CSI u and modifyOtherKeys formats:

```ts
// ink key flag detection
const isShiftEnter = key.shift && key.return;

// CSI u format: \x1b[13;2u
const isCsiUShiftEnter = inputChar === '\x1b[13;2u';

// modifyOtherKeys format: \x1b[27;2;13~
const isModifyOtherKeysShiftEnter = inputChar === '\x1b[27;2;13~';

const isNewlineKey = isShiftEnter || isCsiUShiftEnter || isModifyOtherKeysShiftEnter;
```

### multiline paste detection

detect paste via multiple characters with embedded newlines:

```ts
const isMultilinePaste = inputChar.includes('\n') && inputChar.length > 1;

if (isMultilinePaste) {
  // insert all characters, preserve newlines, don't submit
  const before = value.slice(0, cursor);
  const after = value.slice(cursor);
  setValue(before + inputChar + after);
  setCursor(cursor + inputChar.length);
  return;
}
```

## .common failures

| symptom | cause | fix |
|---------|-------|-----|
| no input received | stdin not TTY | don't pipe stdin |
| shift+enter submits | escape sequence not detected | add CSI u + modifyOtherKeys checks |
| paste triggers submit | multiline paste not detected | check `inputChar.length > 1` |
| tests pass, real fails | test library sends different sequences | test in real terminal with debug |

## .scrollback buffer and multiline content

### the problem

when ink content shrinks (e.g., 5-line input reduces to 1-line), stale lines remain visible in the terminal scrollback. ANSI escape codes like `\x1b[J` (clear to end) cannot clear terminal scrollback.

### how claude code handles it

per [anthropic engineers](https://steipete.me/posts/2025/signature-flicker):

1. **differential renderer**: rewrote ink's renderer to diff individual terminal cells and emit only minimal ANSI escape sequences
2. **synchronized output**: added DEC mode 2026 support for flicker-free renders
3. **frame budget**: ~16ms total, ~5ms to convert react to ANSI

options they considered:
- **alt mode**: take complete control over terminal viewport (loses scrollback)
- **careful re-render**: update only changed parts, leave scrollback alone

neither is perfect. they chose differential render with synchronized output.

### current FeedbackRepl approach

```ts
// track line count for potential clear
useEffect(() => {
  const currentLineCount = (state.inputValue.match(/\n/g) || []).length + 1;
  prevLineCountRef.current = currentLineCount;
  // note: console.clear() was removed - runs AFTER ink render, causes blank terminal
}, [state.inputValue]);
```

`console.clear()` doesn't work well with ink because it runs after ink's render completes.

### recommended approach

for simple repls, accept stale lines as a tradeoff. for production quality:
1. use a fixed-height viewport
2. emit ANSI cursor position commands before ink renders
3. or build a custom renderer like claude code did

---

## .implementation plan for multiline support

### phase 1: detection (verified via tests)

- [x] ctrl+j sends `\n` (0x0a) - detected via `inputChar === '\n'`
- [x] shift/alt/ctrl+enter via ink key flags - `key.shift && key.return`
- [x] CSI u format - `\x1b[13;{mod}u`
- [x] modifyOtherKeys format - `\x1b[27;{mod};13~`
- [x] multiline paste - `inputChar.includes('\n') && inputChar.length > 1`

### phase 2: insertion (verified via tests)

- [x] insert newline at cursor position
- [x] cursor advances correctly
- [x] paste preserves all newlines

### phase 3: render (partial)

- [x] ink renders multiline content
- [ ] scrollback clear on content shrink (accept stale lines for now)
- [ ] fixed-height viewport option

### phase 4: test results

**unit tests via ink-test-library: 11/11 pass**
- [x] multiline paste via `emit.text('line1\nline2')`
- [x] shift+enter via `emit.key('shiftEnter')` (CSI u format)
- [x] submit after multiline

**integration tests via node-pty: 10/10 pass**
- [x] spawn real PTY process
- [x] multiline paste preserves newlines
- [x] severity toggle via shift+tab
- [x] submit and exit behavior

**agent tool verification: BLOCKED**
- cannot test via Claude Code Bash tool (stdin not TTY)
- requires user to run directly in terminal

### phase 5: user verification

to verify in your terminal, run:
```sh
npx tsx src/.test/infra/runReplForTuiTest.ts /tmp/test.md
```

then test:
1. type text, press ctrl+j → should insert newline
2. paste multiline text → should preserve newlines
3. press shift+tab → should toggle blocker/nitpick
4. press enter → should save and show next index

---

## .known limitations

1. **shift+enter not universal**: some terminals don't send a distinct sequence
2. **no scrollback clear**: ANSI codes can't clear scrollback buffer
3. **piped stdin breaks raw mode**: ink requires TTY stdin
4. **test libraries differ from real terminals**: escape sequences may not match
5. **agent tools don't provide TTY**: Claude Code's Bash tool (and similar) run commands without a TTY stdin

## .agent tool limitation (critical)

when an agent (like Claude Code) runs a bash command, stdin is NOT a TTY:

```ts
// in agent context:
process.stdin.isTTY  // undefined or false
```

this means **ink-based interactive TUIs cannot be tested via agent bash tools**.

### workaround for agents

1. **unit tests**: use ink-test-library (mock stdin)
2. **integration tests**: use node-pty (creates real PTY)
3. **real terminal verification**: user runs command directly

### detection and error

add TTY check at repl startup:

```ts
if (!process.stdin.isTTY) {
  console.error('⛈️  error: interactive repl requires a TTY terminal');
  console.error('   run this command directly in your terminal');
  process.exit(1);
}
```

### why this happens

agent tools execute commands via `child_process.spawn` or similar, which:
- creates a new process
- pipes stdin/stdout/stderr
- does NOT allocate a PTY

this is the same reason `echo "hello" | claude` fails with "Raw mode is not supported".

## .sources

- [ink github](https://github.com/vadimdemedes/ink)
- [ink-test-library](https://github.com/vadimdemedes/ink-testing-library)
- [ink-text-input](https://github.com/vadimdemedes/ink-text-input)
- [claude code multiline issue #18042](https://github.com/anthropics/claude-code/issues/18042)
- [claude code raw mode issue #1072](https://github.com/anthropics/claude-code/issues/1072)
- [claude code terminal resize issue #18493](https://github.com/anthropics/claude-code/issues/18493)
- [hatchet tui article](https://hatchet.run/blog/tuis-are-easy-now)
- [steipete flicker article](https://steipete.me/posts/2025/signature-flicker)
- [CSI u spec](https://www.leonerd.org.uk/hacks/fixterms/)
