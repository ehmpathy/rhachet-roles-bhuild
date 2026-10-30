// diagnose: ask the pinned claude cli per brain with the ehmpath/test key; print the verdict, never the key
import { spawnSync } from 'child_process';

const sourced = spawnSync('rhx', ['keyrack', 'source', '--owner', 'ehmpath', '--env', 'test', '--key', 'ANTHROPIC_API_KEY', '--lenient'], { encoding: 'utf-8' });
const match = /ANTHROPIC_API_KEY=['"]?([^'"\n]+)/.exec(sourced.stdout ?? '');
if (!match) {
  console.log('no key sourced', { exit: sourced.status, stderr: (sourced.stderr ?? '').slice(0, 400) });
  process.exit(1);
}
const apiKey = match[1];
console.log('key sourced, length', apiKey.length);

const brains = process.argv.slice(2);
for (const brain of brains) {
  const answer = spawnSync('npx', ['--yes', '@anthropic-ai/claude-code@2.1.280', '-p', '--model', brain, '--output-format', 'json', 'reply with exactly the word: ok'], {
    encoding: 'utf-8',
    timeout: 180000,
    env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
  });
  let parsed = null;
  try { parsed = JSON.parse(answer.stdout); } catch { /* not json */ }
  console.log('\n=== brain', brain, 'exit', answer.status);
  console.log('stderr:', (answer.stderr ?? '').split(apiKey).join('<key>').slice(0, 800));
  if (parsed) {
    const { is_error, subtype, result, modelUsage, usage, api_error_status } = parsed;
    console.log(JSON.stringify({ is_error, subtype, api_error_status, result, modelUsage: Object.keys(modelUsage ?? {}), output_tokens: usage?.output_tokens }, null, 2));
  } else {
    console.log('stdout:', (answer.stdout ?? '').split(apiKey).join('<key>').slice(0, 1500));
  }
}
