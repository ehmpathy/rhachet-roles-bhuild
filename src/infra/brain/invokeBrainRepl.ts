<<<<<<< HEAD
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
=======
import { execSync, spawnSync } from 'child_process';

import { UnexpectedCodePathError } from 'helpful-errors';
import type { ZodSchema } from 'zod';

/**
 * .what = invokes brain.repl via claude-code cli for creative inference
 * .why = enables deptrace and measure skills to leverage ai for tasks
 *        requiring judgment (dependency inference, cost/gain estimation)
 *
 * @note uses `claude --print` for non-interactive single-shot prompts
 * @note supports model selection via options.model (defaults to sonnet)
 */
export const invokeBrainRepl = async <TOutput>(input: {
  prompt: string;
  schema: {
    ofOutput: ZodSchema<TOutput>;
  };
  options?: {
    model?: 'haiku' | 'sonnet' | 'opus';
  };
}): Promise<TOutput> => {
  // resolve claude binary path
  const claudeBin = resolveClaudeBin();

  // build args for claude cli
  const args = ['--print'];
  if (input.options?.model) args.push('--model', input.options.model);

  // invoke claude-code cli with prompt via stdin (avoids shell escaping issues)
  const result = spawnSync(claudeBin, args, {
    input: input.prompt,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    shell: true,
  });

  // fail fast on spawn errors
  if (result.error) {
    throw new UnexpectedCodePathError('brain.repl spawn failed', {
      error: result.error.message,
    });
  }

  const rawOutput = result.stdout;

  // extract json from response (claude may include markdown or prose)
  const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch?.[1]?.trim() ?? rawOutput.trim();

  // parse and validate against schema
  const parsed = JSON.parse(jsonString);
  const validated = input.schema.ofOutput.safeParse(parsed);

  // fail fast if validation fails
  if (!validated.success) {
    throw new UnexpectedCodePathError('brain.repl response failed schema validation', {
      issues: validated.error.issues,
      rawOutput,
      parsed,
    });
  }

  return validated.data;
};

/**
 * .what = resolves the claude binary path
 * .why = supports both global install and local node_modules
 */
const resolveClaudeBin = (): string => {
  // check global install first
  try {
    execSync('which claude', { encoding: 'utf-8' });
    return 'claude';
  } catch {
    // fallback to npx
    return 'npx @anthropic-ai/claude-code';
  }
>>>>>>> 706b3dd (prog: began integration test coverage)
};
