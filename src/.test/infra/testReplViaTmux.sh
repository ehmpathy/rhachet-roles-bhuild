#!/usr/bin/env bash
######################################################################
# .what = test FeedbackRepl via tmux to verify real terminal behavior
# .why = unit tests pass but real terminal input fails; tmux provides
#        a real PTY environment to diagnose the issue
#
# usage:
#   ./src/.test/infra/testReplViaTmux.sh
######################################################################
set -euo pipefail

SESSION="feedback-repl-test-$$"
FEEDBACK_FILE="/tmp/feedback-test-$$.md"
DEBUG_LOG="/tmp/repl-debug.log"

# cleanup on exit
cleanup() {
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  rm -f "$FEEDBACK_FILE"
  echo ""
  echo "session killed, temp files cleaned"
}
trap cleanup EXIT

# clear prior debug log
rm -f "$DEBUG_LOG"
touch "$DEBUG_LOG"

echo "╭─────────────────────────────────────────╮"
echo "│ FeedbackRepl tmux test                  │"
echo "╰─────────────────────────────────────────╯"
echo ""
echo "feedback file: $FEEDBACK_FILE"
echo "debug log: $DEBUG_LOG"
echo ""

# create empty feedback file
touch "$FEEDBACK_FILE"

# start tmux session with the repl
echo "→ start tmux session..."
tmux new-session -d -s "$SESSION" -x 120 -y 30

# run the repl with debug mode
echo "→ launch repl with DEBUG_REPL=true..."
tmux send-keys -t "$SESSION" "cd $(pwd) && DEBUG_REPL=true npx tsx src/.test/infra/runReplForTuiTest.ts $FEEDBACK_FILE" Enter

# wait for repl to start
sleep 3

echo "→ capture initial state..."
echo "--- initial screen ---"
tmux capture-pane -t "$SESSION" -p | head -25
echo "--- end initial ---"
echo ""

# test 1: type simple text
echo "→ test 1: type 'hello world'..."
tmux send-keys -t "$SESSION" "hello world"
sleep 0.5

echo "--- after type ---"
tmux capture-pane -t "$SESSION" -p | tail -10
echo "--- end ---"
echo ""

# test 2: press enter to submit
echo "→ test 2: press enter to submit..."
tmux send-keys -t "$SESSION" Enter
sleep 1

echo "--- after enter ---"
tmux capture-pane -t "$SESSION" -p | tail -10
echo "--- end ---"
echo ""

# check feedback file
echo "→ check feedback file..."
if [ -s "$FEEDBACK_FILE" ]; then
  echo "✓ feedback file has content:"
  cat "$FEEDBACK_FILE"
else
  echo "✗ feedback file is empty"
fi
echo ""

# test 3: backspace
echo "→ test 3: type 'abc' then backspace..."
tmux send-keys -t "$SESSION" "abc"
sleep 0.3
tmux send-keys -t "$SESSION" BSpace
sleep 0.3

echo "--- after backspace ---"
tmux capture-pane -t "$SESSION" -p | tail -5
echo "--- end ---"
echo ""

# test 4: arrow keys
echo "→ test 4: press up arrow for history..."
tmux send-keys -t "$SESSION" C-c  # clear current input first
sleep 0.3
tmux send-keys -t "$SESSION" Up
sleep 0.3

echo "--- after up arrow ---"
tmux capture-pane -t "$SESSION" -p | tail -5
echo "--- end ---"
echo ""

# test 5: shift+tab
echo "→ test 5: shift+tab to toggle severity..."
tmux send-keys -t "$SESSION" C-c  # clear
sleep 0.3
tmux send-keys -t "$SESSION" BTab  # shift+tab in tmux
sleep 0.3

echo "--- after shift+tab ---"
tmux capture-pane -t "$SESSION" -p | tail -5
echo "--- end ---"
echo ""

# show debug log
echo "→ debug log contents:"
echo "--- debug log ---"
cat "$DEBUG_LOG" || echo "(empty)"
echo "--- end debug log ---"
echo ""

# exit repl
echo "→ exit repl with ctrl+c ctrl+c..."
tmux send-keys -t "$SESSION" C-c
sleep 0.6
tmux send-keys -t "$SESSION" C-c
sleep 0.5

echo ""
echo "╭─────────────────────────────────────────╮"
echo "│ test complete                           │"
echo "╰─────────────────────────────────────────╯"
