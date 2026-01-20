import { useCallback, useState } from 'react';

/**
 * .what = react hook to manage feedback repl state
 * .why = encapsulates severity toggle, index, and input management
 */
export const useFeedbackState = (input: {
  initialFeedbackCount?: number;
  initialHistory?: string[];
}): {
  inputValue: string;
  setInputValue: (val: string) => void;
  severity: 'blocker' | 'nitpick';
  toggleSeverity: () => void;
  nextIndex: number;
  handleSubmit: (text: string) => void;
  clearInput: () => void;
  restoreCleared: () => boolean;
  lastCleared: string | null;
  navigateUp: () => boolean;
  navigateDown: () => boolean;
  exitHistoryNavigation: () => void;
  historyIndex: number;
  history: string[];
} => {
  // severity toggle between blocker and nitpick
  const [severity, setSeverity] = useState<'blocker' | 'nitpick'>('blocker');

  // feedback index starts at 1 + any prior feedback count
  const [feedbackIndex, setFeedbackIndex] = useState(
    (input.initialFeedbackCount ?? 0) + 1,
  );

  // input value for multiline text
  const [inputValue, setInputValue] = useState('');

  // track last cleared input for restore via ctrl+z
  const [lastCleared, setLastCleared] = useState<string | null>(null);

  // history of submitted feedback texts for up/down navigation
  const [history, setHistory] = useState<string[]>(input.initialHistory ?? []);

  // index into history for navigation (-1 = not yet navigated, 0 = most recent)
  const [historyIndex, setHistoryIndex] = useState(-1);

  // draft value saved when user starts to navigate history
  const [draftValue, setDraftValue] = useState<string | null>(null);

  // toggle severity between blocker and nitpick
  const toggleSeverity = useCallback(() => {
    setSeverity((prev) => (prev === 'blocker' ? 'nitpick' : 'blocker'));
  }, []);

  // handle submit: increment index, clear input, add to history
  const handleSubmit = useCallback((text: string) => {
    setFeedbackIndex((prev) => prev + 1);
    setInputValue('');
    setLastCleared(null); // submit clears the restore buffer
    setHistory((prev) => [text, ...prev]); // prepend to history (most recent first)
    setHistoryIndex(-1); // reset navigation
    setDraftValue(null);
  }, []);

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
    const nextIndex = historyIndex + 1;
    if (nextIndex >= history.length) return false;

    // save draft on first navigation
    if (historyIndex === -1) {
      setDraftValue(inputValue);
    }

    setHistoryIndex(nextIndex);
    setInputValue(history[nextIndex] ?? '');
    return true;
  }, [history, historyIndex, inputValue]);

  // navigate down through history (newer entries)
  const navigateDown = useCallback((): boolean => {
    if (historyIndex < 0) return false;

    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);

    // restore draft when back to current
    if (nextIndex === -1) {
      setInputValue(draftValue ?? '');
      setDraftValue(null);
    } else {
      setInputValue(history[nextIndex] ?? '');
    }
    return true;
  }, [history, historyIndex, draftValue]);

  // exit history navigation mode (when user starts editing)
  const exitHistoryNavigation = useCallback(() => {
    setHistoryIndex(-1);
    setDraftValue(null);
  }, []);

  return {
    inputValue,
    setInputValue,
    severity,
    toggleSeverity,
    nextIndex: feedbackIndex,
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
