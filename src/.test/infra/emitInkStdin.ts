/**
 * .what = emit stdin input to an ink component under test
 *
 * .why = ink processes stdin asynchronously via useInput hook.
 *        the useInput hook parses raw stdin data, detects key combinations,
 *        and triggers react state updates. this async chain requires a delay
 *        between stdin.write() and assertions for the component to re-render.
 *
 *        the official ink-text-input tests use 100ms delays between writes.
 *        ref: https://github.com/vadimdemedes/ink-text-input
 *
 *        this utility encapsulates the pattern so tests don't need to manually
 *        manage delays and escape sequences.
 *
 * .usage
 *        const { stdin, lastFrame } = render(<MyComponent />);
 *        const emit = emitInkStdin({ stdin });
 *
 *        await emit.text('hello');
 *        await emit.key('shiftTab');
 *        await emit.key('enter');
 *
 *        expect(lastFrame()).toContain('expected output');
 */

/**
 * escape sequences for keyboard input simulation
 * per ink-text-input official tests: https://github.com/vadimdemedes/ink-text-input
 * ref: https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797
 */
export const INK_KEYS = {
  enter: '\r',
  shiftEnter: '\u001B[13;2u',
  tab: '\t',
  shiftTab: '\u001B[Z',
  ctrlC: '\x03',
  ctrlZ: '\x1a',
  ctrlY: '\x19',
  escape: '\u001B',
  arrowUp: '\u001B[A',
  arrowDown: '\u001B[B',
  arrowLeft: '\u001B[D',
  arrowRight: '\u001B[C',
  backspace: '\u007F',
  delete: '\u001B[3~',
} as const;

export type InkKey = keyof typeof INK_KEYS;

/**
 * default delay between stdin writes
 * ink-text-input uses 100ms; we use the same for compatibility
 */
const DEFAULT_DELAY_MS = 100;

/**
 * .what = creates an emitter for stdin input to ink components
 *
 * .why = encapsulates the stdin.write + delay pattern required for
 *        ink's async input processing
 */
export const emitInkStdin = (input: {
  stdin: { write: (data: string) => void };
  delayMs?: number;
}) => {
  const delayMs = input.delayMs ?? DEFAULT_DELAY_MS;

  const delay = () => new Promise((resolve) => setTimeout(resolve, delayMs));

  return {
    /**
     * emit a special key (enter, shiftTab, ctrlC, etc.)
     */
    key: async (key: InkKey): Promise<void> => {
      await delay();
      input.stdin.write(INK_KEYS[key]);
      await delay();
    },

    /**
     * emit text input (types each character)
     */
    text: async (text: string): Promise<void> => {
      await delay();
      input.stdin.write(text);
      await delay();
    },

    /**
     * emit raw escape sequence (for custom keys not in INK_KEYS)
     */
    raw: async (sequence: string): Promise<void> => {
      await delay();
      input.stdin.write(sequence);
      await delay();
    },

    /**
     * emit multiple inputs in sequence
     */
    sequence: async (
      inputs: Array<{ key: InkKey } | { text: string } | { raw: string }>,
    ): Promise<void> => {
      for (const item of inputs) {
        if ('key' in item) {
          await delay();
          input.stdin.write(INK_KEYS[item.key]);
          await delay();
        } else if ('text' in item) {
          await delay();
          input.stdin.write(item.text);
          await delay();
        } else if ('raw' in item) {
          await delay();
          input.stdin.write(item.raw);
          await delay();
        }
      }
    },
  };
};
