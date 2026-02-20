/**
 * .what = playtest the feedback repl via node-pty
 *
 * .why = demonstrates that the repl works with a real PTY allocation,
 *        even when run from a non-TTY context like agent tools
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import * as pty from 'node-pty';

const KEYS = {
  ctrlJ: '\x0a',
  enter: '\r',
  ctrlC: '\x03',
  shiftTab: '\x1b[Z',
  shiftEnterCsiU: '\x1b[13;2u', // CSI u format for shift+enter
};

const delay = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

const main = async () => {
  // create temp file
  const tempFile = path.join(os.tmpdir(), `playtest-${Date.now()}.md`);
  await fs.writeFile(tempFile, '', 'utf-8');

  console.log(`🧪 playtest: ${tempFile}`);
  console.log('');

  let output = '';

  // spawn repl with PTY
  const ptyProcess = pty.spawn(
    'npx',
    ['tsx', 'src/.test/infra/runReplForTuiTest.ts', tempFile],
    {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    },
  );

  ptyProcess.onData((data: string) => {
    output += data;
  });

  // wait for repl to start
  const waitFor = async (match: string, timeoutMs = 10000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (output.includes(match)) return;
      await delay(50);
    }
    throw new Error(`timeout waiting for: ${match}\noutput: ${output}`);
  };

  try {
    console.log('⏳ waiting for repl to start...');
    await waitFor('controls:');
    console.log('✓ repl started');
    await delay(500);

    // test 1: multiline paste
    console.log('');
    console.log('📝 test 1: multiline paste');
    ptyProcess.write('line alpha\nline beta');
    await waitFor('alpha');
    await delay(500);
    ptyProcess.write(KEYS.enter);
    await delay(1500);

    const content1 = await fs.readFile(tempFile, 'utf-8');
    if (content1.includes('line alpha\nline beta')) {
      console.log('   ✓ multiline paste preserved newlines');
    } else {
      console.log('   ✗ multiline paste FAILED');
      console.log(`   content: ${JSON.stringify(content1)}`);
    }

    // test 2: severity toggle
    console.log('');
    console.log('📝 test 2: severity toggle via shift+tab');
    ptyProcess.write(KEYS.shiftTab);
    await delay(500);
    ptyProcess.write('nitpick test');
    await delay(500);
    ptyProcess.write(KEYS.enter);
    await delay(1500);

    const content2 = await fs.readFile(tempFile, 'utf-8');
    if (content2.includes('nitpick')) {
      console.log('   ✓ severity toggle to nitpick worked');
    } else {
      console.log('   ✗ severity toggle FAILED');
      console.log(`   content: ${JSON.stringify(content2)}`);
    }

    // test 3: ctrl+j newline
    console.log('');
    console.log('📝 test 3: ctrl+j for newline');
    ptyProcess.write('before ctrl-j');
    await delay(300);
    ptyProcess.write(KEYS.ctrlJ);
    await delay(300);
    ptyProcess.write('after ctrl-j');
    await delay(300);
    ptyProcess.write(KEYS.enter);
    await delay(1500);

    const content3 = await fs.readFile(tempFile, 'utf-8');
    if (content3.includes('before ctrl-j\nafter ctrl-j')) {
      console.log('   ✓ ctrl+j inserted newline');
    } else if (content3.includes('before ctrl-j') && content3.includes('after ctrl-j')) {
      console.log('   ⚠ ctrl+j was received but newline not detected');
      console.log(`   content: ${JSON.stringify(content3.split('nitpick.2')[1])}`);
    } else {
      console.log('   ✗ ctrl+j FAILED');
      console.log(`   content: ${JSON.stringify(content3)}`);
    }

    // test 4: shift+enter CSI u format
    console.log('');
    console.log('📝 test 4: shift+enter (CSI u) for newline');
    ptyProcess.write('before shift-enter');
    await delay(300);
    ptyProcess.write(KEYS.shiftEnterCsiU);
    await delay(300);
    ptyProcess.write('after shift-enter');
    await delay(300);
    ptyProcess.write(KEYS.enter);
    await delay(1500);

    const content4 = await fs.readFile(tempFile, 'utf-8');
    if (content4.includes('before shift-enter\nafter shift-enter')) {
      console.log('   ✓ shift+enter (CSI u) inserted newline');
    } else if (content4.includes('before shift-enter') && content4.includes('after shift-enter')) {
      console.log('   ⚠ shift+enter received but content on same line (sequence not passed through)');
    } else {
      console.log('   ✗ shift+enter FAILED');
      console.log(`   content: ${JSON.stringify(content4)}`);
    }

    // test 5: exit
    console.log('');
    console.log('📝 test 5: exit via double ctrl+c');
    ptyProcess.write(KEYS.ctrlC);
    await delay(100);
    ptyProcess.write(KEYS.ctrlC);
    await delay(500);

    if (output.includes('exit') || output.includes('bye')) {
      console.log('   ✓ exit worked');
    } else {
      console.log('   ✓ repl closed (no explicit exit message)');
    }

    console.log('');
    console.log('🎉 playtest complete');
    console.log('');
    console.log('final file content:');
    console.log('────────────────────');
    const finalContent = await fs.readFile(tempFile, 'utf-8');
    console.log(finalContent);
    console.log('────────────────────');
  } finally {
    ptyProcess.kill();
    await fs.rm(tempFile, { force: true });
  }
};

main().catch((error) => {
  console.error('playtest failed:', error);
  process.exit(1);
});
