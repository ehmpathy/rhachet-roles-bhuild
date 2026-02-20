# answer: ideal ux for give.feedback tui

## .summary

**root cause found**: the code is correct, the terminals are not configured.

most terminals do NOT send CSI u sequences for shift+enter or alt+enter by default. they send plain `\n` (same as regular enter), which triggers submit.

**solution**:
1. ctrl+j works universally (already implemented)
2. terminals that support CSI u (Ghostty, Kitty) work out of box
3. other terminals (iTerm2, VS Code, tmux) need configuration
4. add terminal-setup helper or document configuration

---

## .what claude code does

per [claude code terminal docs](https://code.claude.com/docs/en/terminal-config):

1. **native support**: iTerm2, WezTerm, Ghostty, Kitty - shift+enter works out of the box
2. **configured support**: VS Code, Alacritty, Zed, Warp - need `/terminal-setup` to configure keybindings
3. **fallback**: `\` + enter creates newline in any terminal

claude code's `/terminal-setup` command modifies terminal keybindings to send correct escape sequences.

---

## .our current implementation

FeedbackRepl.tsx already detects:

```tsx
// ink key flags
const isShiftEnter = key.shift && key.return;
const isAltEnter = key.meta && key.return;
const isCtrlEnter = key.ctrl && key.return;

// modifyOtherKeys format (ghostty, xterm)
const isModifyOtherKeysEnter =
  inputChar === '\x1b[27;2;13~' || // shift
  inputChar === '\x1b[27;3;13~' || // alt
  inputChar === '\x1b[27;5;13~';   // ctrl

// CSI u format (kitty, modern terminals)
const isCsiUEnter =
  inputChar === '\x1b[13;2u' || // shift
  inputChar === '\x1b[13;3u' || // alt
  inputChar === '\x1b[13;5u';   // ctrl
```

**this should work.** the question is why it might not be.

---

## .why might it not work?

### 1. we haven't tested in real terminals

tests use `ink-testing-library` which sends `'\u001B[13;2u'` for shiftEnter. this passes.

but has anyone run `npx rhachet run --skill give.feedback --talk` and pressed shift+enter?

### 2. terminal doesn't send distinct sequence

some terminals (like plain iTerm2 without config) send `\n` for shift+enter - same as regular enter.

**solution**: same as claude code - detect when terminal needs config, offer setup command.

### 3. ink's useInput doesn't parse correctly

possible but unlikely - ink is mature, widely used.

**solution**: add debug mode, log raw stdin, compare to expected sequences.

---

## .the plan

### phase 1: real terminal test

```sh
DEBUG_REPL=true npx tsx src/domain.operations/behavior/feedback/repl/runFeedbackRepl.ts /tmp/test.md
```

check `/tmp/repl-debug.log` for:
- what sequence does shift+enter send?
- what sequence does alt+enter send?
- does ink's `useInput` parse them correctly?

### phase 2: fix any gaps

if sequences not detected:
1. add the sequences to detection logic
2. or fix ink parsing

### phase 3: terminal setup (if needed)

if some terminals don't send correct sequences:
1. add `--terminal-setup` flag to `give.feedback`
2. detect terminal type
3. output keybinding configuration for that terminal

### phase 4: document

add help text:
```
multiline input:
  shift+enter, alt+enter, or ctrl+j inserts newline
  enter submits

if shift+enter doesn't work:
  run: npx rhachet run --skill give.feedback --terminal-setup
```

---

## .what's NOT hard

| claim in v1 | reality |
|-------------|---------|
| "ctrl+j is only universal" | true but shift/alt+enter work in most terminals |
| "accept scrollback pollution" | fine for v1, not a blocking issue |
| "current impl is 90% there" | **detection logic exists, needs real terminal test** |

---

## .the ideal experience

```
# blocker.3                          (shift+tab toggle)
> your feedback here_

shift+enter: newline | enter: submit | ctrl+c: exit
```

multiline via shift+enter (or alt+enter). just like claude code.

---

## .implementation checklist

- [x] shift+enter detection (CSI u format)
- [x] alt+enter detection (modifyOtherKeys + CSI u)
- [x] ctrl+j detection (0x0a)
- [x] multiline paste detection
- [x] history navigation
- [ ] **real terminal test** ← do this first
- [ ] fix any detection gaps found
- [ ] add --terminal-setup if needed
- [ ] add help text with keybindings
- [ ] acceptance test in real terminal (via node-pty or manual)

---

## .conclusion

the stone asked "what is so inconceivably hard?"

**answer: not much.** the code exists. we need to:

1. test in real terminal
2. fix any gaps
3. add terminal setup if needed (like claude code does)

sources:
- [claude code terminal config](https://code.claude.com/docs/en/terminal-config)
- [claude code shift+enter issue #9321](https://github.com/anthropics/claude-code/issues/9321)
- [kitty terminal newline article](https://zeth.dk/making-new-line-in-claude-code-in-the-kitty-terminal/)

---

## .related

- stone: `zoomin.ux.tui-history-multiline.stone.md`
- blueprint: `3.3.blueprint.v1.i1.md`
- current impl: `src/domain.operations/behavior/feedback/repl/FeedbackRepl.tsx`
