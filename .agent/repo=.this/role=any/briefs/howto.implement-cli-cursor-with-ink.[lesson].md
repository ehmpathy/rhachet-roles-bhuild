# howto: implement a cli cursor with react ink

## .what

implement a text input cursor in react ink that:
- tracks position within the input text
- renders as inverted text (like terminal cursors)
- blinks after inactivity (like claude code)
- supports left/right arrow navigation

## .why

- users expect cursor feedback in text inputs
- blinking draws attention to the input focus
- position tracking enables mid-text editing
- matches familiar terminal/ide behavior

## .how

### cursor position tracking

maintain cursor position as state, separate from the input value:

```tsx
const [cursorPosition, setCursorPosition] = useState(0);
```

update position on:
- character insert: `setCursorPosition(pos + 1)`
- backspace: `setCursorPosition(pos - 1)`
- left arrow: `setCursorPosition(Math.max(0, pos - 1))`
- right arrow: `setCursorPosition(Math.min(value.length, pos + 1))`
- clear/submit: `setCursorPosition(0)`

### cursor rendering via inverted text

ink's `<Text inverse>` applies terminal inverse video, matching how `ink-text-input` uses `chalk.inverse()`:

```tsx
<Box>
  <Text>{value.slice(0, cursorPosition)}</Text>
  {cursorVisible ? (
    <Text inverse>{value[cursorPosition] ?? ' '}</Text>
  ) : (
    <Text>{value[cursorPosition] ?? ' '}</Text>
  )}
  <Text>{value.slice(cursorPosition + 1)}</Text>
</Box>
```

key points:
- split text into: before cursor | cursor char | after cursor
- use `inverse` prop for the character at cursor position
- show space ` ` when cursor is at end of text
- toggle `cursorVisible` state for blink effect

### blinking with inactivity timer

start blinking after N seconds of no input, stop on activity:

```tsx
const [cursorVisible, setCursorVisible] = useState(true);
const lastActivityRef = useRef(Date.now());
const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

const markActivity = useCallback(() => {
  lastActivityRef.current = Date.now();
  setCursorVisible(true); // always show on activity
}, []);

useEffect(() => {
  const BLINK_DELAY_MS = 5000;  // start blinking after 5s idle
  const BLINK_INTERVAL_MS = 530; // toggle every 530ms

  const checkActivity = () => {
    const idle = Date.now() - lastActivityRef.current;
    if (idle >= BLINK_DELAY_MS) {
      // start blink interval if not already running
      if (!blinkIntervalRef.current) {
        blinkIntervalRef.current = setInterval(() => {
          setCursorVisible((v) => !v);
        }, BLINK_INTERVAL_MS);
      }
    } else {
      // stop blinking, ensure cursor visible
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
        blinkIntervalRef.current = null;
      }
      setCursorVisible(true);
    }
  };

  const activityCheck = setInterval(checkActivity, 1000);
  checkActivity();

  return () => {
    clearInterval(activityCheck);
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
  };
}, []);
```

call `markActivity()` at the start of every input handler.

### insert at cursor position

don't just append characters - insert at cursor position:

```tsx
// insert character at cursor
const before = value.slice(0, cursorPosition);
const after = value.slice(cursorPosition);
setValue(before + char + after);
setCursorPosition(cursorPosition + 1);

// backspace removes char before cursor
if (cursorPosition > 0) {
  const before = value.slice(0, cursorPosition - 1);
  const after = value.slice(cursorPosition);
  setValue(before + after);
  setCursorPosition(cursorPosition - 1);
}

// delete removes char at cursor
if (cursorPosition < value.length) {
  const before = value.slice(0, cursorPosition);
  const after = value.slice(cursorPosition + 1);
  setValue(before + after);
}
```

## .constraints

### ink v3 vs v4

- ink v4+ is esm-only
- ink v3.2.0 is cjs-compatible
- `<Text inverse>` works in both versions

### no native cursor blink in ink

ink does not provide native cursor blinking. the `ink-text-input` package uses a static inverted character without blinking. implement blinking manually via interval-based state toggle.

## .reference

the official `ink-text-input` implementation:
- uses `chalk.inverse()` for cursor display
- tracks `cursorOffset` in state
- does not implement blinking
- source: https://github.com/vadimdemedes/ink-text-input/blob/master/source/index.tsx

## .sources

- [ink-text-input source](https://github.com/vadimdemedes/ink-text-input/blob/master/source/index.tsx)
- [ink github](https://github.com/vadimdemedes/ink)
- [ink-text-input readme](https://github.com/vadimdemedes/ink-text-input/blob/master/readme.md)
- [logrocket: add interactivity to clis with react](https://blog.logrocket.com/add-interactivity-to-your-clis-with-react/)
