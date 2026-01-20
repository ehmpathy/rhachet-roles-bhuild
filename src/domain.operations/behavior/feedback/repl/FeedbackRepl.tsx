import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import chalk from 'chalk';

import { useFeedbackState } from './useFeedbackState';

/**
 * .what = ink component for interactive feedback repl
 * .why = enables iterative feedback entry with severity toggle
 */
export const FeedbackRepl = (input: {
  feedbackFile: string;
  initialBlockerCount?: number;
  initialNitpickCount?: number;
  initialHistory?: string[];
  onSubmit?: (feedback: { severity: 'blocker' | 'nitpick'; index: number; text: string }) => void;
  onUndo?: () => { undone: boolean; message: string };
  onRedo?: () => { redone: boolean; message: string };
  onExit?: (summary: { feedbackCount: number }) => void;
}): React.ReactNode => {
  // use feedback state hook for all state management
  const initialFeedbackCount = (input.initialBlockerCount ?? 0) + (input.initialNitpickCount ?? 0);
  const state = useFeedbackState({
    initialFeedbackCount,
    initialHistory: input.initialHistory,
  });

  // cursor blink state
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // reset activity timestamp on any input
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setCursorVisible(true); // always show cursor on activity
  }, []);

  // blink effect: start blinking after 5s of inactivity
  useEffect(() => {
    const BLINK_DELAY_MS = 5000;
    const BLINK_INTERVAL_MS = 530;

    // clear any existing interval
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
    }

    // check activity and manage blink
    const checkActivity = () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity >= BLINK_DELAY_MS) {
        // start blinking
        if (!blinkIntervalRef.current) {
          blinkIntervalRef.current = setInterval(() => {
            setCursorVisible((v) => !v);
          }, BLINK_INTERVAL_MS);
        }
      } else {
        // stop blinking, show cursor
        if (blinkIntervalRef.current) {
          clearInterval(blinkIntervalRef.current);
          blinkIntervalRef.current = null;
        }
        setCursorVisible(true);
      }
    };

    // check every second
    const activityCheckInterval = setInterval(checkActivity, 1000);

    // initial check
    checkActivity();

    return () => {
      clearInterval(activityCheckInterval);
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    };
  }, []);

  // position cursor at start when loading from history (so up-up continues navigating)
  useEffect(() => {
    if (state.historyIndex >= 0) {
      setCursorPosition(0);
    }
  }, [state.historyIndex]);

  // handle keyboard input
  useInput((inputChar: string, key: { shift?: boolean; tab?: boolean; ctrl?: boolean; return?: boolean; meta?: boolean; backspace?: boolean; delete?: boolean; upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean }) => {
    markActivity();

    // shift+tab toggles severity
    if (key.shift && key.tab) {
      state.toggleSeverity();
      return;
    }

    // ctrl+c exits or clears
    if (key.ctrl && inputChar === 'c') {
      if (state.inputValue === '') {
        // exit if empty
        input.onExit?.({ feedbackCount: state.nextIndex - 1 });
      } else {
        // clear if has content (save for potential restore via ctrl+z)
        state.clearInput();
        setCursorPosition(0);
      }
      return;
    }

    // ctrl+z restores cleared input or undoes last file change
    if (key.ctrl && inputChar === 'z') {
      // first try to restore cleared input buffer
      const restored = state.restoreCleared();
      if (restored) return;

      // otherwise, undo last file change
      input.onUndo?.();
      return;
    }

    // ctrl+y redoes last undo
    if (key.ctrl && inputChar === 'y') {
      input.onRedo?.();
      return;
    }

    // enter submits
    if (key.return && !key.shift && !key.meta) {
      if (state.inputValue.trim() !== '') {
        input.onSubmit?.({
          severity: state.severity,
          index: state.nextIndex,
          text: state.inputValue,
        });
        state.handleSubmit(state.inputValue);
        setCursorPosition(0);
      }
      return;
    }

    // shift+enter or alt+enter adds newline at cursor
    if ((key.shift && key.return) || (key.meta && key.return)) {
      const before = state.inputValue.slice(0, cursorPosition);
      const after = state.inputValue.slice(cursorPosition);
      state.setInputValue(before + '\n' + after);
      setCursorPosition(cursorPosition + 1);
      return;
    }

    // left arrow moves cursor left
    if (key.leftArrow) {
      setCursorPosition((pos) => Math.max(0, pos - 1));
      return;
    }

    // right arrow moves cursor right
    if (key.rightArrow) {
      setCursorPosition((pos) => Math.min(state.inputValue.length, pos + 1));
      return;
    }

    // backspace removes char before cursor
    if (key.backspace) {
      if (cursorPosition > 0) {
        const before = state.inputValue.slice(0, cursorPosition - 1);
        const after = state.inputValue.slice(cursorPosition);
        state.setInputValue(before + after);
        setCursorPosition(cursorPosition - 1);

        // exit history navigation mode when editing
        if (state.historyIndex >= 0) {
          state.exitHistoryNavigation();
        }
      }
      return;
    }

    // delete removes char at cursor
    if (key.delete) {
      if (cursorPosition < state.inputValue.length) {
        const before = state.inputValue.slice(0, cursorPosition);
        const after = state.inputValue.slice(cursorPosition + 1);
        state.setInputValue(before + after);

        // exit history navigation mode when editing
        if (state.historyIndex >= 0) {
          state.exitHistoryNavigation();
        }
      }
      return;
    }

    // up arrow navigates to older history
    // only if: input is empty, OR (in history navigation AND input not modified from history entry)
    if (key.upArrow) {
      const isInputEmpty = state.inputValue === '';
      const isInHistory = state.historyIndex >= 0;
      const isHistoryUnmodified =
        isInHistory && state.inputValue === state.history[state.historyIndex];
      if (isInputEmpty || isHistoryUnmodified) {
        state.navigateUp();
      }
      return;
    }

    // down arrow navigates to newer history
    // only if: in history navigation AND input not modified from history entry
    if (key.downArrow) {
      const isInHistory = state.historyIndex >= 0;
      const isHistoryUnmodified =
        isInHistory && state.inputValue === state.history[state.historyIndex];
      if (isHistoryUnmodified) {
        state.navigateDown();
      }
      return;
    }

    // regular character input at cursor position (handles paste/multi-char input)
    if (inputChar && !key.ctrl && !key.meta) {
      const before = state.inputValue.slice(0, cursorPosition);
      const after = state.inputValue.slice(cursorPosition);
      state.setInputValue(before + inputChar + after);
      setCursorPosition(cursorPosition + inputChar.length);

      // escape history navigation mode when editing starts
      if (state.historyIndex >= 0) {
        state.exitHistoryNavigation();
      }
    }
  });

  // compute severity color
  const severityColor = state.severity === 'blocker' ? 'red' : 'yellow';

  return (
    <Box flexDirection="column">
      {/* current severity and index */}
      <Box>
        <Text color={severityColor}>
          # {state.severity}.{state.nextIndex}
        </Text>
        <Text dimColor> (shift+tab to toggle)</Text>
      </Box>

      {/* input area with prompt and cursor */}
      <Box>
        <Text>&gt; </Text>
        <Text>
          {state.inputValue.slice(0, cursorPosition)}
          {cursorVisible
            ? chalk.inverse(state.inputValue[cursorPosition] ?? ' ')
            : (state.inputValue[cursorPosition] ?? ' ')}
          {state.inputValue.slice(cursorPosition + 1)}
        </Text>
      </Box>
    </Box>
  );
};
