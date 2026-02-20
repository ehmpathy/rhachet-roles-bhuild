# ref: how claude code handles terminal setup

## .source

[claude code terminal config docs](https://code.claude.com/docs/en/terminal-config)

---

## .the problem

different terminals send different escape sequences for shift+enter and alt+enter. some don't send any distinguishable sequence at all.

---

## .claude code's solution

### tier 1: native support (no config needed)

these terminals send correct escape sequences out of the box:

| terminal | shift+enter works | alt+enter works |
|----------|-------------------|-----------------|
| iTerm2 | ✓ | ✓ (with "Use Option as Meta Key") |
| WezTerm | ✓ | ✓ |
| Ghostty | ✓ | ✓ |
| Kitty | ✓ | ✓ |

for these terminals, `/terminal-setup` command is not shown (not needed).

### tier 2: configurable (need setup)

these terminals need key bind configuration:

| terminal | requires |
|----------|----------|
| VS Code | keybinds.json modification |
| Alacritty | alacritty.yml modification |
| Zed | keymap.json modification |
| Warp | settings modification |

claude code's `/terminal-setup` command:
1. detects current terminal
2. outputs the specific config needed for that terminal
3. user applies config manually (or auto-applies if possible)

### tier 3: fallback (any terminal)

if shift+enter doesn't work, user can type `\` + enter to create a newline.

---

## .what the config does

the key bind config tells the terminal "when user presses shift+enter, send this escape sequence to the application".

example for VS Code (keybinds.json):
```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

this sends CSI u format `\x1b[13;2u` which ink can parse as shift+enter.

---

## .how to implement for give.feedback

### option A: detect and guide

```sh
npx rhachet run --skill give.feedback --terminal-setup
```

1. detect terminal via `$TERM`, `$TERM_PROGRAM`, etc.
2. if tier 1 terminal: "shift+enter already works"
3. if tier 2 terminal: output config snippet for that terminal
4. if unknown: "try ctrl+j for newline, or configure your terminal to send CSI u sequences"

### option B: just document

add to `--help`:
```
multiline input:
  shift+enter or alt+enter inserts newline (most terminals)
  ctrl+j inserts newline (all terminals)
  \ + enter inserts newline (fallback)

if shift+enter submits instead of newline:
  configure your terminal to send CSI u sequences
  see: https://docs.example.com/terminal-setup
```

### option C: detect and warn on startup

when repl starts, detect terminal and show hint if needed:
```
# blocker.1                        (shift+tab toggle)
> _

tip: your terminal may not support shift+enter. use ctrl+j for newline.
```

---

## .terminal detection

```ts
const detectTerminal = (): string => {
  const termProgram = process.env.TERM_PROGRAM;
  const term = process.env.TERM;

  if (termProgram === 'iTerm.app') return 'iterm2';
  if (termProgram === 'WezTerm') return 'wezterm';
  if (termProgram === 'ghostty') return 'ghostty';
  if (term?.includes('kitty')) return 'kitty';
  if (termProgram === 'vscode') return 'vscode';
  if (term?.includes('alacritty')) return 'alacritty';

  return 'unknown';
};
```

---

## .recommendation

for v1: option B (document) + option C (warn if needed)

for v2: option A (full terminal-setup command)

---

## .sources

- [claude code terminal config](https://code.claude.com/docs/en/terminal-config)
- [kitty terminal CSI u](https://sw.kovidgoyal.net/kitty/keyboard-protocol/)
- [VS Code terminal sequences](https://code.visualstudio.com/docs/terminal/advanced#_custom-sequence-keybindings)
