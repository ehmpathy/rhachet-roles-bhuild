import { given, then, when } from 'test-fns';

/**
 * test helper to simulate React useState behavior
 */
const createMockState = <T>(
  initial: T,
): [() => T, (val: T | ((prev: T) => T)) => void] => {
  let value = initial;
  return [
    () => value,
    (newVal) => {
      value =
        typeof newVal === 'function'
          ? (newVal as (prev: T) => T)(value)
          : newVal;
    },
  ];
};

/**
 * simulate useFeedbackState hook logic for unit tests
 * (mirrors the real hook's behavior without React dependencies)
 */
const createFeedbackState = (input: {
  initialFeedbackCount?: number;
  initialHistory?: string[];
}) => {
  const [getSeverity, setSeverity] = createMockState<'blocker' | 'nitpick'>(
    'blocker',
  );
  const [getFeedbackIndex, setFeedbackIndex] = createMockState(
    (input.initialFeedbackCount ?? 0) + 1,
  );
  const [getInputValue, setInputValue] = createMockState('');
  const [getLastCleared, setLastCleared] = createMockState<string | null>(null);
  const [getHistory, setHistory] = createMockState<string[]>(
    input.initialHistory ?? [],
  );
  const [getHistoryIndex, setHistoryIndex] = createMockState(-1);
  const [getDraftValue, setDraftValue] = createMockState<string | null>(null);

  return {
    get inputValue() {
      return getInputValue();
    },
    setInputValue,
    get severity() {
      return getSeverity();
    },
    toggleSeverity: () => {
      setSeverity((prev) => (prev === 'blocker' ? 'nitpick' : 'blocker'));
    },
    get nextIndex() {
      return getFeedbackIndex();
    },
    handleSubmit: (text: string) => {
      setFeedbackIndex((prev) => prev + 1);
      setInputValue('');
      setLastCleared(null);
      setHistory((prev) => [text, ...prev]);
      setHistoryIndex(-1);
      setDraftValue(null);
    },
    clearInput: () => {
      setLastCleared(getInputValue());
      setInputValue('');
    },
    restoreCleared: (): boolean => {
      const cleared = getLastCleared();
      if (cleared === null) return false;
      setInputValue(cleared);
      setLastCleared(null);
      return true;
    },
    get lastCleared() {
      return getLastCleared();
    },
    navigateUp: (): boolean => {
      const history = getHistory();
      const historyIndex = getHistoryIndex();
      if (history.length === 0) return false;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) return false;

      // save draft on first navigation
      if (historyIndex === -1) {
        setDraftValue(getInputValue());
      }

      setHistoryIndex(nextIndex);
      setInputValue(history[nextIndex] ?? '');
      return true;
    },
    navigateDown: (): boolean => {
      const historyIndex = getHistoryIndex();
      if (historyIndex < 0) return false;

      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);

      // restore draft when back to current
      if (nextIndex === -1) {
        setInputValue(getDraftValue() ?? '');
        setDraftValue(null);
      } else {
        const history = getHistory();
        setInputValue(history[nextIndex] ?? '');
      }
      return true;
    },
    get historyIndex() {
      return getHistoryIndex();
    },
    get history() {
      return getHistory();
    },
  };
};

describe('useFeedbackState', () => {
  given('[case1] fresh state with no prior feedback', () => {
    when('[t0] initialized', () => {
      then('severity defaults to "blocker"', () => {
        const state = createFeedbackState({});
        expect(state.severity).toBe('blocker');
      });

      then('feedbackIndex starts at 1', () => {
        const state = createFeedbackState({});
        expect(state.nextIndex).toBe(1);
      });

      then('inputValue starts empty', () => {
        const state = createFeedbackState({});
        expect(state.inputValue).toBe('');
      });
    });

    when('[t1] toggleSeverity called', () => {
      then('severity toggles to nitpick', () => {
        const state = createFeedbackState({});
        state.toggleSeverity();
        expect(state.severity).toBe('nitpick');
      });

      then('severity toggles back to blocker on second call', () => {
        const state = createFeedbackState({});
        state.toggleSeverity();
        state.toggleSeverity();
        expect(state.severity).toBe('blocker');
      });
    });

    when('[t2] handleSubmit called with text', () => {
      then('feedbackIndex increments', () => {
        const state = createFeedbackState({});
        expect(state.nextIndex).toBe(1);
        state.handleSubmit('some feedback');
        expect(state.nextIndex).toBe(2);
      });

      then('inputValue clears', () => {
        const state = createFeedbackState({});
        state.setInputValue('some text');
        expect(state.inputValue).toBe('some text');
        state.handleSubmit('some text');
        expect(state.inputValue).toBe('');
      });
    });
  });

  given('[case2] state with prior feedback count', () => {
    when('[t0] initialized with initialFeedbackCount=5', () => {
      then('feedbackIndex starts at 6', () => {
        const state = createFeedbackState({ initialFeedbackCount: 5 });
        expect(state.nextIndex).toBe(6);
      });
    });
  });

  given('[case3] input buffer clear and restore', () => {
    when('[t0] clearInput called with text in buffer', () => {
      then('inputValue is cleared', () => {
        const state = createFeedbackState({});
        state.setInputValue('draft text');
        state.clearInput();
        expect(state.inputValue).toBe('');
      });

      then('lastCleared contains the cleared text', () => {
        const state = createFeedbackState({});
        state.setInputValue('draft text');
        state.clearInput();
        expect(state.lastCleared).toBe('draft text');
      });
    });

    when('[t1] restoreCleared called after clearInput', () => {
      then('inputValue is restored', () => {
        const state = createFeedbackState({});
        state.setInputValue('draft text');
        state.clearInput();
        state.restoreCleared();
        expect(state.inputValue).toBe('draft text');
      });

      then('lastCleared is cleared after restore', () => {
        const state = createFeedbackState({});
        state.setInputValue('draft text');
        state.clearInput();
        state.restoreCleared();
        expect(state.lastCleared).toBeNull();
      });

      then('returns true on successful restore', () => {
        const state = createFeedbackState({});
        state.setInputValue('draft text');
        state.clearInput();
        const result = state.restoreCleared();
        expect(result).toBe(true);
      });
    });

    when('[t2] restoreCleared called with no cleared text', () => {
      then('returns false', () => {
        const state = createFeedbackState({});
        const result = state.restoreCleared();
        expect(result).toBe(false);
      });

      then('inputValue remains empty', () => {
        const state = createFeedbackState({});
        state.restoreCleared();
        expect(state.inputValue).toBe('');
      });
    });

    when('[t3] handleSubmit called after clearInput', () => {
      then('lastCleared is reset to null', () => {
        const state = createFeedbackState({});
        state.setInputValue('draft text');
        state.clearInput();
        expect(state.lastCleared).toBe('draft text');
        state.handleSubmit('new text');
        expect(state.lastCleared).toBeNull();
      });
    });
  });

  given('[case4] history navigation', () => {
    when('[t0] no history exists', () => {
      then('navigateUp returns false', () => {
        const state = createFeedbackState({});
        expect(state.navigateUp()).toBe(false);
      });

      then('navigateDown returns false', () => {
        const state = createFeedbackState({});
        expect(state.navigateDown()).toBe(false);
      });
    });

    when('[t1] history exists and navigateUp called', () => {
      then('inputValue shows previous entry', () => {
        const state = createFeedbackState({
          initialHistory: ['first', 'second'],
        });
        state.navigateUp();
        expect(state.inputValue).toBe('first');
      });

      then('historyIndex is 0', () => {
        const state = createFeedbackState({
          initialHistory: ['first', 'second'],
        });
        state.navigateUp();
        expect(state.historyIndex).toBe(0);
      });
    });

    when('[t2] navigateUp called twice', () => {
      then('inputValue shows older entry', () => {
        const state = createFeedbackState({
          initialHistory: ['first', 'second'],
        });
        state.navigateUp();
        state.navigateUp();
        expect(state.inputValue).toBe('second');
      });

      then('historyIndex is 1', () => {
        const state = createFeedbackState({
          initialHistory: ['first', 'second'],
        });
        state.navigateUp();
        state.navigateUp();
        expect(state.historyIndex).toBe(1);
      });
    });

    when('[t3] navigateUp at end of history', () => {
      then('returns false and stays at last entry', () => {
        const state = createFeedbackState({ initialHistory: ['only'] });
        state.navigateUp();
        const result = state.navigateUp();
        expect(result).toBe(false);
        expect(state.inputValue).toBe('only');
      });
    });

    when('[t4] navigateDown after navigateUp', () => {
      then('returns to more recent entry', () => {
        const state = createFeedbackState({
          initialHistory: ['first', 'second'],
        });
        state.navigateUp();
        state.navigateUp();
        state.navigateDown();
        expect(state.inputValue).toBe('first');
      });
    });

    when('[t5] navigateDown to current draft', () => {
      then('restores the draft value', () => {
        const state = createFeedbackState({ initialHistory: ['prev'] });
        state.setInputValue('my draft');
        state.navigateUp();
        expect(state.inputValue).toBe('prev');
        state.navigateDown();
        expect(state.inputValue).toBe('my draft');
      });

      then('historyIndex is -1', () => {
        const state = createFeedbackState({ initialHistory: ['prev'] });
        state.setInputValue('my draft');
        state.navigateUp();
        state.navigateDown();
        expect(state.historyIndex).toBe(-1);
      });
    });

    when('[t6] handleSubmit adds to history', () => {
      then('new entry is prepended', () => {
        const state = createFeedbackState({});
        state.setInputValue('feedback one');
        state.handleSubmit('feedback one');
        expect(state.history).toEqual(['feedback one']);
      });

      then('history resets navigation state', () => {
        const state = createFeedbackState({ initialHistory: ['old'] });
        state.navigateUp();
        expect(state.historyIndex).toBe(0);
        state.setInputValue('new feedback');
        state.handleSubmit('new feedback');
        expect(state.historyIndex).toBe(-1);
      });
    });
  });
});
