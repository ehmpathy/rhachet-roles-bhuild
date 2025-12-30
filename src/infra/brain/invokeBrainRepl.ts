import { execSync } from 'child_process';

import type { BrainReplRole } from './BrainReplContext';

/**
 * .what = invokes brain.repl claude-code with role briefs as context
 * .why = centralizes LLM invocation with consistent brief injection
 * .todo = liftout generalized into rhachet repo
 */
export const invokeBrainRepl = async (input: {
  prompt: string;
  role: BrainReplRole;
  outputFormat: 'json' | 'text';
}): Promise<string> => {
  // format briefs as system context
  const briefsFormatted = input.role.briefs
    .map((brief) => `<brief name="${brief.name}">\n${brief.content}\n</brief>`)
    .join('\n\n');

  // build full prompt with briefs
  const promptFull = `
<briefs>
${briefsFormatted}
</briefs>

<task>
${input.prompt}
</task>

important: output ONLY the requested format, no additional text.
`.trim();

  // escape prompt for shell
  const promptEscaped = promptFull.replace(/'/g, "'\\''");

  // invoke claude-code cli
  const output = execSync(`claude --print -p '${promptEscaped}'`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  return output;
};
