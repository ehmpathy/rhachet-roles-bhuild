import { useCallback, useState } from 'react';

import type { HistoryEntry } from './countPriorFeedback';

/**
 * draft state saved when user navigates into history
 */
type DraftState = {
  text: string;
  severity: 'blocker' | 'nitpick';
};

/**
 * .what = react hook to manage feedback repl state
 * .why = encapsulates severity toggle, index, and input management
 */
export const useFeedbackState = (input: {
  initialFeedbackCount?: number;
  initialHistory?: HistoryEntry[];
}): {
  inputValue: string;
  setInputValue: (val: string) => void;
  severity: 'blocker' | 'nitpick';
  setSeverity: (val: 'blocker' | 'nitpick') => void;
  toggleSeverity: () => void;
  currentIndex: number;
  nextNewIndex: number;
  inEditMode: boolean;
  handleSubmit: (text: string) => void;
  clearInput: () => void;
  restoreCleared: () => boolean;
  lastCleared: string | null;
  navigateUp: () => boolean;
  navigateDown: () => boolean;
  exitHistoryNavigation: () => void;
  historyIndex: number;
  history: HistoryEntry[];
} => {
  // severity toggle between blocker and nitpick
  const [severity, setSeverity] = useState<'blocker' | 'nitpick'>('blocker');

  // next new feedback index (starts at 1 + any prior feedback count)
  const [nextNewIndex, setNextNewIndex] = useState(
    (input.initialFeedbackCount ?? 0) + 1,
  );

  // input value for multiline text
  const [inputValue, setInputValue] = useState('');

  // track last cleared input for restore via ctrl+z
  const [lastCleared, setLastCleared] = useState<string | null>(null);

  // history of submitted feedback entries for up/down navigation
  const [history, setHistory] = useState<HistoryEntry[]>(
    input.initialHistory ?? [],
  );

  // index into history for navigation (-1 = not in history, 0 = most recent)
  const [historyIndex, setHistoryIndex] = useState(-1);

  // draft state saved when user starts to navigate history
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  // toggle severity between blocker and nitpick
  const toggleSeverity = useCallback(() => {
    setSeverity((prev) => (prev === 'blocker' ? 'nitpick' : 'blocker'));
  }, []);

  // compute if we're in edit mode (navigated to a history entry)
  const inEditMode = historyIndex >= 0;

  // compute current index (history entry index if in edit mode, else next new)
  const currentIndex = inEditMode
    ? (history[historyIndex]?.index ?? nextNewIndex)
    : nextNewIndex;

  // handle submit: update history entry or create new
  const handleSubmit = useCallback(
    (text: string) => {
      if (historyIndex >= 0) {
        // update existing history entry
        const entry = history[historyIndex];
        if (entry) {
          setHistory((prev) => {
            const updated = [...prev];
            updated[historyIndex] = { ...entry, text, severity };
            return updated;
          });
        }
      } else {
        // create new entry
        const newEntry: HistoryEntry = {
          text,
          severity,
          index: nextNewIndex,
        };
        setHistory((prev) => [newEntry, ...prev]);
        setNextNewIndex((prev) => prev + 1);
      }

      setInputValue('');
      setLastCleared(null);
      setHistoryIndex(-1);
      setDraftState(null);
    },
    [historyIndex, history, severity, nextNewIndex],
  );

  // clear input and save for potential restore
  const clearInput = useCallback(() => {
    setLastCleared(inputValue);
    setInputValue('');
  }, [inputValue]);

  // restore last cleared input
  const restoreCleared = useCallback((): boolean => {
    if (lastCleared === null) return false;
    setInputValue(lastCleared);
    setLastCleared(null);
    return true;
  }, [lastCleared]);

  // navigate up through history (older entries)
  const navigateUp = useCallback((): boolean => {
    if (history.length === 0) return false;
    const nextIdx = historyIndex + 1;
    if (nextIdx >= history.length) return false;

    // save draft on first navigation
    if (historyIndex === -1) {
      setDraftState({ text: inputValue, severity });
    }

    const entry = history[nextIdx];
    setHistoryIndex(nextIdx);
    setInputValue(entry?.text ?? '');
    setSeverity(entry?.severity ?? 'blocker');
    return true;
  }, [history, historyIndex, inputValue, severity]);

  // navigate down through history (newer entries)
  const navigateDown = useCallback((): boolean => {
    if (historyIndex < 0) return false;

    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);

    // restore draft when back to current
    if (nextIdx === -1) {
      setInputValue(draftState?.text ?? '');
      setSeverity(draftState?.severity ?? 'blocker');
      setDraftState(null);
    } else {
      const entry = history[nextIdx];
      setInputValue(entry?.text ?? '');
      setSeverity(entry?.severity ?? 'blocker');
    }
    return true;
  }, [history, historyIndex, draftState]);

  // exit history navigation mode (when user starts to edit in place)
  const exitHistoryNavigation = useCallback(() => {
    // don't reset - user is now editing this entry
    // just clear the draft since they modified the history entry
    setDraftState(null);
  }, []);

  return {
    inputValue,
    setInputValue,
    severity,
    setSeverity,
    toggleSeverity,
    currentIndex,
    nextNewIndex,
    inEditMode,
    handleSubmit,
    clearInput,
    restoreCleared,
    lastCleared,
    navigateUp,
    navigateDown,
    exitHistoryNavigation,
    historyIndex,
    history,
  };
};
