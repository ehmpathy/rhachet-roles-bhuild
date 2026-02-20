import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import chalk from 'chalk';
import * as fs from 'fs';

import { HistoryEntry } from './countPriorFeedback';
import { useFeedbackState } from './useFeedbackState';

// debug log to file (avoids conflict with ink render)
const DEBUG = process.env.DEBUG_REPL === 'true';
const debugLog = (msg: string) => {
  if (!DEBUG) return;
  const ts = new Date().toJSON();
  fs.appendFileSync('/tmp/repl-debug.log', `[${ts}] ${msg}\n`);
};

/**
 * .what = ink component for interactive feedback repl
 * .why = enables iterative feedback entry with severity toggle
 */
export const FeedbackRepl = (input: {
  feedbackFile: string;
  initialBlockerCount?: number;
  initialNitpickCount?: number;
  initialHistory?: HistoryEntry[];
  onSubmit?: (feedback: {
    severity: 'blocker' | 'nitpick';
    index: number;
    text: string;
    isUpdate: boolean;
  }) => void;
  onUndo?: () => { undone: boolean; message: string };
  onRedo?: () => { redone: boolean; message: string };
  onExit?: (summary: { feedbackCount: number }) => void;
}): React.ReactNode => {
  // use feedback state hook for all state management
  const initialFeedbackCount =
    (input.initialBlockerCount ?? 0) + (input.initialNitpickCount ?? 0);
  const state = useFeedbackState({
    initialFeedbackCount,
    initialHistory: input.initialHistory,
  });

  // cursor blink state
  const [cursorVisible, setCursorVisible] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // double ctrl-c to exit state
  const [exitPrompted, setExitPrompted] = useState(false);
  const lastCtrlCRef = useRef<number>(0);

  // track line count for clear on multiline shrink
  const prevLineCountRef = useRef<number>(0);

  // reset activity timestamp on any input
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setCursorVisible(true); // always show cursor on activity
  }, []);

  // debug: log component mount and raw stdin data
  useEffect(() => {
    debugLog('component mounted');
    debugLog(`stdin.isTTY=${process.stdin.isTTY}`);
    debugLog(`stdin.isRaw=${process.stdin.isRaw}`);
    debugLog(`stdin.readable=${process.stdin.readable}`);

    // listen to raw stdin to verify node receives input
    const stdinListener = (data: Buffer) => {
      const hex = [...data].map((b) => b.toString(16).padStart(2, '0')).join(' ');
      debugLog(`stdin.data: hex=[${hex}] str="${data.toString().replace(/\n/g, '\\n')}"`);
    };
    if (DEBUG) {
      process.stdin.on('data', stdinListener);
    }

    return () => {
      if (DEBUG) {
        process.stdin.off('data', stdinListener);
      }
    };
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

  // track line count for potential clear (not used - console.clear breaks ink render)
  useEffect(() => {
    const currentLineCount = (state.inputValue.match(/\n/g) || []).length + 1;
    prevLineCountRef.current = currentLineCount;
    // note: console.clear() was removed - it runs AFTER ink render completes,
    // which causes blank terminal. stale lines are a lesser evil.
    // proper fix requires ink-level solution.
  }, [state.inputValue]);

  // handle keyboard input
  useInput((inputChar: string, key: { shift?: boolean; tab?: boolean; ctrl?: boolean; return?: boolean; meta?: boolean; backspace?: boolean; delete?: boolean; upArrow?: boolean; downArrow?: boolean; leftArrow?: boolean; rightArrow?: boolean }) => {
    // debug: log what ink parsed from the input
    const keyFlags = Object.entries(key).filter(([, v]) => v).map(([k]) => k);
    const charHex = [...inputChar].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    debugLog(`useInput: char="${inputChar.replace(/\n/g, '\\n')}" hex=[${charHex}] keys=[${keyFlags.join(',')}]`);

    markActivity();

    // shift+tab toggles severity
    if (key.shift && key.tab) {
      state.toggleSeverity();
      return;
    }

    // ctrl+c exits or clears
    if (key.ctrl && inputChar === 'c') {
      if (state.inputValue !== '') {
        // clear if has content (save for potential restore via ctrl+z)
        state.clearInput();
        setCursorPosition(0);
        setExitPrompted(false);
        return;
      }

      // input is empty - handle double ctrl-c to exit
      const now = Date.now();
      const timeSinceLastCtrlC = now - lastCtrlCRef.current;
      lastCtrlCRef.current = now;

      if (exitPrompted && timeSinceLastCtrlC >= 500) {
        // second ctrl-c at least 500ms after first - exit
        input.onExit?.({ feedbackCount: state.nextNewIndex - 1 });
      } else {
        // first ctrl-c or too fast - prompt for second
        setExitPrompted(true);
      }
      return;
    }

    // any other input resets exit prompt
    if (exitPrompted) {
      setExitPrompted(false);
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

    // ctrl+s saves feedback but stays on current item (save in place)
    if (key.ctrl && inputChar === 's') {
      if (state.inputValue.trim() !== '') {
        input.onSubmit?.({
          severity: state.severity,
          index: state.currentIndex,
          text: state.inputValue,
          isUpdate: true, // always an update via ctrl+s
        });
        // note: do NOT call handleSubmit or clear - user stays on current item
      }
      return;
    }

    // detect ctrl+j: ink converts '\x0a' (ctrl+j) to inputChar='j' with key.ctrl=true
    // (see ink/build/hooks/use-input.js lines 55-58)
    const isCtrlJ = key.ctrl && inputChar === 'j';

    // detect multiline paste: multiple characters with embedded newlines
    // (single '\n' is ctrl+j, not paste)
    const isMultilinePaste = inputChar.includes('\n') && inputChar.length > 1;

    // detect modified enter sequences BEFORE submit check
    // terminals send different escape sequences:
    //   - ink key flags: key.shift/meta/ctrl && key.return
    //   - modifyOtherKeys (xterm/ghostty): \x1b[27;{mod};13~
    //     mod: 2=shift, 3=alt, 5=ctrl
    //   - CSI u (kitty/ptyxis/modern): \x1b[13;{mod}u
    //     mod: 2=shift, 3=alt, 5=ctrl, 6=ctrl+shift, 4=alt+shift
    const isShiftEnter = key.shift && key.return;
    const isAltEnter = key.meta && key.return;
    const isCtrlEnter = key.ctrl && key.return;
    // modifyOtherKeys format: \x1b[27;{modifier};13~
    const isModifyOtherKeysEnter =
      inputChar === '\x1b[27;2;13~' || // shift
      inputChar === '\x1b[27;3;13~' || // alt
      inputChar === '\x1b[27;5;13~'; // ctrl
    // CSI u format: \x1b[13;{modifier}u
    const isCsiUEnter =
      inputChar === '\x1b[13;2u' || // shift
      inputChar === '\x1b[13;3u' || // alt
      inputChar === '\x1b[13;5u' || // ctrl
      inputChar === '\x1b[13;6u' || // ctrl+shift
      inputChar === '\x1b[13;4u'; // alt+shift
    const isNewlineKey =
      isShiftEnter ||
      isAltEnter ||
      isCtrlEnter ||
      isCtrlJ ||
      isModifyOtherKeysEnter ||
      isCsiUEnter;

    // enter saves feedback (but not if any newline key or pasted multiline content)
    if (key.return && !isNewlineKey && !isMultilinePaste) {
      if (state.inputValue.trim() !== '') {
        input.onSubmit?.({
          severity: state.severity,
          index: state.currentIndex,
          text: state.inputValue,
          isUpdate: state.inEditMode,
        });
        state.handleSubmit(state.inputValue);
        setCursorPosition(0);
      }
      return;
    }

    // newline keys insert newline at cursor
    if (isNewlineKey && !isMultilinePaste) {
      const before = state.inputValue.slice(0, cursorPosition);
      const after = state.inputValue.slice(cursorPosition);
      state.setInputValue(before + '\n' + after);
      setCursorPosition(cursorPosition + 1);
      return;
    }

    // handle pasted multiline content (insert with newlines preserved)
    if (isMultilinePaste) {
      const before = state.inputValue.slice(0, cursorPosition);
      const after = state.inputValue.slice(cursorPosition);
      state.setInputValue(before + inputChar + after);
      setCursorPosition(cursorPosition + inputChar.length);

      // exit history navigation mode on paste
      if (state.historyIndex >= 0) {
        state.exitHistoryNavigation();
      }
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
      // functional update to ensure we work with latest cursorPosition
      setCursorPosition((pos) => {
        if (pos > 0) {
          // compute slice with current position
          const before = state.inputValue.slice(0, pos - 1);
          const after = state.inputValue.slice(pos);
          state.setInputValue(before + after);

          // exit history navigation mode on edit
          if (state.historyIndex >= 0) {
            state.exitHistoryNavigation();
          }

          return pos - 1;
        }
        return pos;
      });
      return;
    }

    // delete removes char at cursor
    if (key.delete) {
      // functional update to work with latest cursorPosition
      setCursorPosition((pos) => {
        if (pos < state.inputValue.length) {
          const before = state.inputValue.slice(0, pos);
          const after = state.inputValue.slice(pos + 1);
          state.setInputValue(before + after);

          // exit history navigation mode on edit
          if (state.historyIndex >= 0) {
            state.exitHistoryNavigation();
          }
        }
        return pos; // delete doesn't change cursor position
      });
      return;
    }

    // up arrow navigates to older history
    // only if: input is empty, OR (in history navigation AND input not modified from history entry)
    if (key.upArrow) {
      const isInputEmpty = state.inputValue === '';
      const isInHistory = state.historyIndex >= 0;
      const isHistoryUnmodified =
        isInHistory &&
        state.inputValue === state.history[state.historyIndex]?.text;
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
        isInHistory &&
        state.inputValue === state.history[state.historyIndex]?.text;
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
          # {state.severity}.{state.currentIndex}
        </Text>
        {state.inEditMode ? (
          <Text dimColor> [edit mode]</Text>
        ) : (
          <Text dimColor> (shift+tab to toggle)</Text>
        )}
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

      {/* exit prompt hint */}
      {exitPrompted && (
        <Box>
          <Text dimColor>press ctrl+c again to exit</Text>
        </Box>
      )}
    </Box>
  );
};
