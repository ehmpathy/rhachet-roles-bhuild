# zoomin: how claude code can test terminal user interfaces

## .what

claude code can test TUIs (terminal user interfaces) via tmux as a virtual terminal layer. tmux enables:
- send keystrokes to a TUI process
- wait for UI to update
- capture the rendered output
- assert on the captured content

this creates a "selenium for the terminal" pattern.

## .why

unit tests with ink-testing-library verify component logic, but:
- they simulate stdin, not real terminal escape sequences
- they don't prove the actual terminal sends the expected sequences
- different terminals (ptyxis, codium, iterm) send different escape sequences

tmux-based tests verify the full stack: terminal → escape sequence → ink → render.

## .core pattern: send → wait → capture

```bash
# send keystrokes to the TUI
tmux send-keys -t $SESSION "hello world"

# wait for UI to update
sleep 0.3

# capture the rendered output
OUTPUT=$(tmux capture-pane -t $SESSION -p)

# assert on content
echo "$OUTPUT" | grep -q "hello world" || echo "FAIL: text not rendered"
```

## .setup: start TUI in tmux session

```bash
# create a detached tmux session
tmux new-session -d -s tui-test

# start the TUI in that session
tmux send-keys -t tui-test "npm run start:repl" Enter

# wait for startup
sleep 2
```

## .send special keys

tmux supports special key names:

| key | tmux syntax |
|-----|-------------|
| enter | `Enter` or `C-m` |
| escape | `Escape` |
| ctrl+c | `C-c` |
| ctrl+j | `C-j` |
| ctrl+z | `C-z` |
| shift+enter | not directly supported |
| arrow up | `Up` |
| arrow down | `Down` |
| arrow left | `Left` |
| arrow right | `Right` |
| backspace | `BSpace` |
| delete | `DC` |
| tab | `Tab` |
| shift+tab | `BTab` |

examples:
```bash
# type text then press enter
tmux send-keys -t tui-test "my feedback" Enter

# press ctrl+c
tmux send-keys -t tui-test C-c

# press escape then arrow up
tmux send-keys -t tui-test Escape Up

# press shift+tab (back-tab)
tmux send-keys -t tui-test BTab
```

## .send raw escape sequences

for keys tmux doesn't name, send raw escape sequences:

```bash
# send CSI u shift+enter: \x1b[13;2u
printf '\x1b[13;2u' | tmux load-buffer -
tmux paste-buffer -t tui-test

# or via send-keys with escape
tmux send-keys -t tui-test -l $'\x1b[13;2u'
```

## .capture pane content

```bash
# capture visible content
tmux capture-pane -t tui-test -p

# capture with scrollback history
tmux capture-pane -t tui-test -p -S -

# capture to file
tmux capture-pane -t tui-test -p > /tmp/tui-output.txt

# capture and strip ANSI codes
tmux capture-pane -t tui-test -p | sed 's/\x1b\[[0-9;]*m//g'
```

## .example: test feedback repl

```bash
#!/usr/bin/env bash
set -euo pipefail

SESSION="feedback-repl-test"
FEEDBACK_FILE="/tmp/test.feedback.md"

# cleanup
cleanup() {
  tmux kill-session -t $SESSION 2>/dev/null || true
  rm -f "$FEEDBACK_FILE"
}
trap cleanup EXIT

# start fresh
cleanup

# create session and start repl
tmux new-session -d -s $SESSION
tmux send-keys -t $SESSION "npx rhachet run --skill give.feedback --against $FEEDBACK_FILE --talk" Enter
sleep 3

# test 1: type and submit feedback
tmux send-keys -t $SESSION "this is test feedback" Enter
sleep 0.5

OUTPUT=$(tmux capture-pane -t $SESSION -p)
if echo "$OUTPUT" | grep -q "blocker.1 saved"; then
  echo "✓ test 1 passed: feedback saved"
else
  echo "✗ test 1 failed: feedback not saved"
  echo "$OUTPUT"
  exit 1
fi

# test 2: toggle severity with shift+tab
tmux send-keys -t $SESSION BTab
sleep 0.3

OUTPUT=$(tmux capture-pane -t $SESSION -p)
if echo "$OUTPUT" | grep -q "nitpick"; then
  echo "✓ test 2 passed: severity toggled to nitpick"
else
  echo "✗ test 2 failed: severity not toggled"
  echo "$OUTPUT"
  exit 1
fi

# test 3: ctrl+j for newline
tmux send-keys -t $SESSION "line one" C-j "line two" Enter
sleep 0.5

if grep -q "line one" "$FEEDBACK_FILE" && grep -q "line two" "$FEEDBACK_FILE"; then
  echo "✓ test 3 passed: multiline feedback saved"
else
  echo "✗ test 3 failed: multiline not saved"
  cat "$FEEDBACK_FILE"
  exit 1
fi

# test 4: exit with double ctrl+c
tmux send-keys -t $SESSION C-c
sleep 0.6
tmux send-keys -t $SESSION C-c
sleep 0.5

# check if session ended
if ! tmux has-session -t $SESSION 2>/dev/null; then
  echo "✓ test 4 passed: repl exited"
else
  echo "✗ test 4 failed: repl still running"
  exit 1
fi

echo ""
echo "all tests passed"
```

## .debug: see what terminal sends

to debug what escape sequences a terminal actually sends:

```bash
# start a cat process that shows raw input
tmux new-session -d -s debug
tmux send-keys -t debug "cat -v" Enter

# now press keys in the tmux session and see what cat shows
tmux attach -t debug

# ctrl+j shows as ^J
# escape shows as ^[
# shift+enter might show as ^M or ^[[13;2u depending on terminal
```

## .integration with claude code

claude code can run these tmux-based tests via bash:

```
user: test the feedback repl TUI

claude: I'll create a tmux session and test the TUI interactively.

[runs bash command that creates tmux session, sends keys, captures output, asserts]
```

the pattern enables claude code to:
1. spawn a TUI in a controlled environment
2. interact with it programmatically
3. verify the rendered output
4. report pass/fail with evidence

## .limitations

- tmux send-keys for shift+enter varies by terminal config
- some terminals require specific escape sequences
- timing-sensitive (need sleep between send and capture)
- ANSI codes in output need to be stripped for assertions

## .sources

- [tmux send-keys docs](https://linuxhint.com/tmux-send-keys/)
- [tmux for console app testing](https://www.drmaciver.com/2015/05/using-tmux-to-test-your-console-applications/)
- [tmux capture-pane](https://tmuxai.dev/tmux-capture-pane/)
- [tmux-logging plugin](https://github.com/tmux-plugins/tmux-logging)
- [tao of tmux](https://tao-of-tmux.readthedocs.io/en/latest/manuscript/10-scripting.html)
- [HN: TUI testing with tmux](https://news.ycombinator.com/item?id=46570397)
