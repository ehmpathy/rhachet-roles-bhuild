# howto: test ink components

## .what

ink is a react renderer for cli apps. ink-testing-library provides test utilities for ink components.

## .why

- snapshot tests verify cli output appearance
- behavior tests verify key handling and state transitions
- keeps tests fast by avoiding real terminal i/o

## .key insight: async input processing

ink processes stdin asynchronously:

1. `stdin.write()` sends raw data to the component
2. ink's `useInput` hook parses the data and detects key combinations
3. react state updates trigger a re-render
4. `lastFrame()` returns the new rendered output

this async chain requires a **delay between stdin.write() and assertions**.

the official [ink-text-input](https://github.com/vadimdemedes/ink-text-input) tests use **100ms delays** between writes. this is the proven pattern.

## .constraints

### ink v3 vs v4

- ink v4+ is esm-only, incompatible with commonjs projects
- ink v3.2.0 is commonjs and works with standard typescript/jest setups
- use `ink-testing-library@3` with `ink@3.2.0`

### jest config for pnpm

pnpm uses a different node_modules structure. update `transformIgnorePatterns`:

```ts
// jest.unit.config.ts
transformIgnorePatterns: [
  // pattern handles both npm and pnpm node_modules structures
  'node_modules/(?!(\\.pnpm/)?(ink|ink-testing-library|yoga-layout|cli-cursor|restore-cursor|onetime|mimic-function|signal-exit|cli-truncate|slice-ansi|string-width|is-fullwidth-code-point|ansi-regex|strip-ansi|ansi-styles|wrap-ansi|emoji-regex|widest-line))',
],
```

## .how

### use the emitInkStdin utility (recommended)

this project provides `src/.test/infra/emitInkStdin.ts` which encapsulates the stdin.write + delay pattern:

```ts
import { render } from 'ink-testing-library';
import React from 'react';

import { emitInkStdin } from '@src/.test/infra/emitInkStdin';
import { MyComponent } from './MyComponent';

test('severity toggles on shift+tab', async () => {
  const { stdin, lastFrame } = render(
    React.createElement(MyComponent, { onSubmit: jest.fn() }),
  );
  const emit = emitInkStdin({ stdin });

  await emit.key('shiftTab');

  expect(lastFrame()).toContain('nitpick');
});

test('user can type and submit', async () => {
  const onSubmit = jest.fn();
  const { stdin } = render(
    React.createElement(MyComponent, { onSubmit }),
  );
  const emit = emitInkStdin({ stdin });

  await emit.text('my feedback');
  await emit.key('enter');

  expect(onSubmit).toHaveBeenCalledWith({ text: 'my feedback' });
});

test('sequence of inputs', async () => {
  const { stdin, lastFrame } = render(
    React.createElement(MyComponent, {}),
  );
  const emit = emitInkStdin({ stdin });

  await emit.sequence([
    { key: 'shiftTab' },
    { text: 'hello' },
    { key: 'enter' },
  ]);

  expect(lastFrame()).toContain('submitted');
});
```

### available keys

the utility exports `INK_KEYS` with these escape sequences:

| key | usage | escape sequence |
|-----|-------|-----------------|
| enter | `emit.key('enter')` | `'\r'` |
| shiftEnter | `emit.key('shiftEnter')` | `'\u001B[13;2u'` |
| tab | `emit.key('tab')` | `'\t'` |
| shiftTab | `emit.key('shiftTab')` | `'\u001B[Z'` |
| ctrlC | `emit.key('ctrlC')` | `'\x03'` |
| ctrlZ | `emit.key('ctrlZ')` | `'\x1a'` |
| ctrlY | `emit.key('ctrlY')` | `'\x19'` |
| escape | `emit.key('escape')` | `'\u001B'` |
| arrowUp | `emit.key('arrowUp')` | `'\u001B[A'` |
| arrowDown | `emit.key('arrowDown')` | `'\u001B[B'` |
| arrowLeft | `emit.key('arrowLeft')` | `'\u001B[D'` |
| arrowRight | `emit.key('arrowRight')` | `'\u001B[C'` |
| backspace | `emit.key('backspace')` | `'\u007F'` |
| delete | `emit.key('delete')` | `'\u001B[3~'` |

### manual approach (if not using utility)

```ts
const KEYS = {
  enter: '\r',
  shiftTab: '\u001B[Z',
  ctrlC: '\x03',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('manual stdin.write pattern', async () => {
  const { stdin, lastFrame } = render(
    React.createElement(MyComponent, {}),
  );

  await delay(100);
  stdin.write(KEYS.shiftTab);
  await delay(100);

  expect(lastFrame()).toContain('expected');
});
```

### snapshot tests

```ts
test('output matches snapshot', () => {
  const { lastFrame } = render(
    React.createElement(MyComponent, {}),
  );
  expect(lastFrame()).toMatchSnapshot();
});

test('post-toggle snapshot', async () => {
  const { stdin, lastFrame } = render(
    React.createElement(MyComponent, {}),
  );
  const emit = emitInkStdin({ stdin });

  await emit.key('shiftTab');

  expect(lastFrame()).toMatchSnapshot();
});
```

### testing callbacks

```ts
test('onSubmit called with correct args', async () => {
  const onSubmit = jest.fn();
  const { stdin } = render(
    React.createElement(MyComponent, { onSubmit }),
  );
  const emit = emitInkStdin({ stdin });

  await emit.text('my feedback');
  await emit.key('enter');

  expect(onSubmit).toHaveBeenCalledWith({
    severity: 'blocker',
    index: 1,
    text: 'my feedback',
  });
});
```

## .sources

- [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library)
- [ink-text-input tests](https://github.com/vadimdemedes/ink-text-input) — official pattern with 100ms delays
- [ink useInput docs](https://github.com/vadimdemedes/ink#useinputinputhandler-options)
- [ink v3.2.0 npm](https://www.npmjs.com/package/ink/v/3.2.0)
- [ansi escape sequences](https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797)
