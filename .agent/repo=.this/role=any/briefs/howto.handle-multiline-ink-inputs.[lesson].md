# howto: handle multiline inputs in react ink

## .what

handle multiline text input in ink cli apps:
- newline insertion via shift+enter, alt+enter, or ctrl+j
- multiline paste detection and proper handling
- terminal clear when content shrinks

## .why

- ink's `useInput` hook receives raw terminal escape sequences
- different terminals send different escape sequences for the same key combo
- ANSI escape codes cannot clear terminal scrollback buffer
- naive paste detection breaks on escape sequences

## .terminal escape sequence variations

### shift+enter sends different sequences by terminal

| terminal | escape sequence | notes |
|----------|-----------------|-------|
| iTerm | `\n` | indistinguishable from regular enter |
| Ghostty | `\x1b[27;2;13~` | modifyOtherKeys protocol |
| CSI u terminals | `\x1b[13;2u` | modern CSI u format |
| some terminals | not detected | ink sees regular enter |

### detection pattern

```tsx
// ctrl+j sends single '\n' (detect before multiline paste check)
const isCtrlJ = inputChar === '\n';

// ink key flag detection
const isShiftEnter = key.shift && key.return;
const isAltEnter = key.meta && key.return;
const isCtrlEnter = key.ctrl && key.return;

// modifyOtherKeys format: \x1b[27;{modifier};13~
const isModifyOtherKeysEnter =
  inputChar === '\x1b[27;2;13~' || // shift
  inputChar === '\x1b[27;3;13~' || // alt
  inputChar === '\x1b[27;5;13~';   // ctrl

// CSI u format: \x1b[13;{modifier}u
const isCsiUEnter =
  inputChar === '\x1b[13;2u' || // shift
  inputChar === '\x1b[13;3u' || // alt
  inputChar === '\x1b[13;5u' || // ctrl
  inputChar === '\x1b[13;6u' || // ctrl+shift
  inputChar === '\x1b[13;4u';   // alt+shift

const isNewlineKey =
  isShiftEnter ||
  isAltEnter ||
  isCtrlEnter ||
  isCtrlJ ||
  isModifyOtherKeysEnter ||
  isCsiUEnter;
```

### ctrl+j as reliable fallback

ctrl+j sends `\n` in most terminals and is the traditional unix newline.
always offer ctrl+j as an alternative to shift/alt/ctrl+enter.

## .multiline paste detection

### the problem

to detect paste via `inputChar.length > 1` breaks because escape sequences like `\x1b[D` (arrow left) also have length > 1.

### the solution

detect paste via newline presence only:

```tsx
const isMultilinePaste = inputChar.includes('\n');

// handle paste: insert with newlines preserved, no submit
if (isMultilinePaste) {
  const before = state.inputValue.slice(0, cursorPosition);
  const after = state.inputValue.slice(cursorPosition);
  state.setInputValue(before + inputChar + after);
  setCursorPosition(cursorPosition + inputChar.length);
  return;
}
```

### prevent submit on paste

when enter is pressed as part of a paste (multiline content), don't submit:

```tsx
// enter saves feedback (but not if pasted multiline content)
if (key.return && !key.shift && !key.meta && !isMultilinePaste) {
  // handle submit
}
```

## .terminal clear for shrunk content

### the problem

when multiline content shrinks (e.g., navigate from 3-line history entry to 1-line), ANSI escape codes like `\x1b[J` (clear to end) cannot clear terminal scrollback buffer. stale lines remain visible.

### the solution

use `console.clear()` which properly clears the entire terminal:

```tsx
const prevLineCountRef = useRef<number>(0);

useEffect(() => {
  const currentLineCount = (state.inputValue.match(/\n/g) || []).length + 1;
  const prevLineCount = prevLineCountRef.current;

  // if we went from multiline to fewer lines, clear terminal
  if (prevLineCount > 1 && currentLineCount < prevLineCount) {
    console.clear();
  }

  prevLineCountRef.current = currentLineCount;
}, [state.inputValue]);
```

### tradeoff

`console.clear()` clears all terminal content, not just the repl area. this is acceptable because:
- scrollback content is typically not relevant in repl use
- the header is re-rendered by ink anyway
- alternative approaches (ANSI codes) don't work for scrollback

## .key binds summary

| action | primary | fallback | notes |
|--------|---------|----------|-------|
| submit | enter | - | only when input non-empty |
| save in place | ctrl+s | - | stays on current item |
| newline | shift+enter | ctrl+j | ctrl+j most reliable |
| clear input | ctrl+c | - | first press clears |
| exit | ctrl+c ctrl+c | - | double press when empty |

## .sources

- [ink github](https://github.com/vadimdemedes/ink)
- [ink-multiline-input](https://github.com/ellie/ink-multiline-input) - alternative approach
- [ansi escape sequences](https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797)
- [CSI u spec](https://www.leonerd.org.uk/hacks/fixterms/)
