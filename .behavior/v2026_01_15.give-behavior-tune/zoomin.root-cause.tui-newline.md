# root cause: tui newline keys

## .summary

the code is correct. the terminals are not configured.

most terminals do NOT send CSI u sequences for shift+enter or alt+enter by default. they need explicit configuration.

## .the detection logic (already correct)

FeedbackRepl.tsx line 245-250:

```tsx
const isCsiUEnter =
  inputChar === '\x1b[13;2u' || // shift
  inputChar === '\x1b[13;3u' || // alt
  inputChar === '\x1b[13;5u';   // ctrl
```

this is correct. the sequences never arrive because the terminal doesn't send them.

## .terminal reality

| terminal | shift+enter default | alt+enter default | needs config |
|----------|---------------------|-------------------|--------------|
| iTerm2 | `\n` (same as enter) | varies | YES |
| Ghostty | `\x1b[27;2;13~` | `\x1b[27;3;13~` | NO |
| Kitty | `\x1b[13;2u` | `\x1b[13;3u` | NO |
| VS Code | `\n` | varies | YES |
| tmux | depends on outer terminal | depends | YES |

## .the fix: terminal configuration

### iTerm2

1. Settings → Profiles → Keys → Key Binds
2. Click + to add bind
3. Keyboard Shortcut: Shift+Enter
4. Action: "Send Escape Sequence"
5. Esc+ value: `[13;2u`

repeat for Alt+Enter with value `[13;3u`

### tmux

add to `~/.tmux.conf`:

```
bind-key -n S-Enter send-keys Escape "\[13;2u"
bind-key -n M-Enter send-keys Escape "\[13;3u"
set -s extended-keys on
set -as terminal-features 'tmux-256color:extkeys'
```

reload: `tmux source-file ~/.tmux.conf`

### VS Code

add to keybinds.json:

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

## .verification

run `cat -v` in terminal, press shift+enter:
- correct: `^[[13;2u`
- wrong: (new line, same as enter)

## .what give.feedback should do

### option 1: add `/terminal-setup` (like claude code)

detect terminal, output config for that terminal.

```sh
npx rhachet run --skill give.feedback --terminal-setup
```

### option 2: documentation only

add help text that explains ctrl+j as reliable fallback.

### option 3: detect and warn

on repl start, detect if terminal likely needs config:

```
if ($TERM_PROGRAM === 'iTerm.app' && !hasShiftEnterBind) {
  console.log('tip: shift+enter may not work. use ctrl+j or configure iTerm2.');
}
```

## .ctrl+j always works

ctrl+j sends `\n` (0x0a) in all terminals. it's the POSIX line feed.

the code already detects this:

```tsx
const isCtrlJ = inputChar === '\n';
```

this is why ctrl+j is the reliable fallback.

## .action items

1. verify ctrl+j works in real terminal (should work)
2. decide: add terminal-setup command or just document
3. update help text to emphasize ctrl+j
4. optionally add terminal detection + warn on startup

## .sources

- [tmux modifier keys wiki](https://github.com/tmux/tmux/wiki/Modifier-Keys)
- [iTerm2 + tmux + claude code gist](https://gist.github.com/jftuga/ffa03dbf4cd818f00cc32ce4186d6c1c)
- [tmux CSI u issue #3246](https://github.com/tmux/tmux/issues/3246)
