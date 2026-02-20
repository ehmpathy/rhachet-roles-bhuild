/**
 * .what = minimal stdin test to verify terminal input works
 * .why = diagnose whether stdin is properly connected through tsx
 *
 * usage:
 *   npx tsx src/.test/infra/testStdinRaw.ts
 *
 * expected: should log each keypress with hex codes
 */

console.log('stdin test - press keys (ctrl+c to exit)');
console.log('stdin.isTTY:', process.stdin.isTTY);
console.log('stdin.isRaw:', process.stdin.isRaw);

// set raw mode to capture keys
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  console.log('stdin.isRaw (after setRawMode):', process.stdin.isRaw);
}

process.stdin.resume();

process.stdin.on('data', (data: Buffer) => {
  const hex = [...data].map((b) => b.toString(16).padStart(2, '0')).join(' ');
  const str = data.toString().replace(/\r/g, '\\r').replace(/\n/g, '\\n');

  console.log(`key: hex=[${hex}] str="${str}"`);

  // ctrl+c to exit
  if (data.length === 1 && data[0] === 3) {
    console.log('ctrl+c detected, exit');
    process.exit(0);
  }
});

console.log('ready - type any key...');
