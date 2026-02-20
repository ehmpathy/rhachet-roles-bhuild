/**
 * .what = minimal ink component to debug useInput behavior
 * .why = understand what ink actually passes to useInput for various keys
 *
 * usage:
 *   npx tsx src/.test/infra/debugInkInput.tsx
 *
 * then press keys:
 *   - ctrl+j (should show hex=0a)
 *   - shift+enter
 *   - alt+enter
 *   - paste multiline text
 *   - ctrl+c to exit
 */
import { Box, render, Text, useInput } from 'ink';
import React, { useState } from 'react';

const DebugComponent = (): React.ReactNode => {
  const [logs, setLogs] = useState<string[]>(['press keys to see what ink receives...']);

  useInput((inputChar, key) => {
    // build hex representation
    const hex = [...inputChar]
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(' ');

    // build key flags
    const flags = Object.entries(key)
      .filter(([, v]) => v)
      .map(([k]) => k);

    // escape special chars for display
    const display = inputChar
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\x1b/g, '\\x1b');

    const log = `char="${display}" hex=[${hex}] keys=[${flags.join(',')}]`;

    setLogs((prev) => [...prev.slice(-10), log]);

    // ctrl+c to exit
    if (key.ctrl && inputChar === 'c') {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>ink useInput debug</Text>
      <Text dimColor>press ctrl+c to exit</Text>
      <Text> </Text>
      {logs.map((log, i) => (
        <Text key={i}>{log}</Text>
      ))}
    </Box>
  );
};

// check TTY
if (!process.stdin.isTTY) {
  console.error('error: requires TTY stdin');
  console.error('run directly in terminal: npx tsx src/.test/infra/debugInkInput.tsx');
  process.exit(1);
}

render(React.createElement(DebugComponent, {}));
