<<<<<<< HEAD
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
=======
import { readFileSync } from 'fs';
>>>>>>> 7b95a42 (prog: integration tests on imagine operations)

import Anthropic from '@anthropic-ai/sdk';
import type { RefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { GitFile } from 'rhachet-artifact-git';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * .what = invokes anthropic api for creative inference with structured output
 * .why = enables deptrace and measure skills to leverage ai for tasks
 *        requiring judgment (dependency inference, cost/gain estimation)
 *
 * @note uses anthropic sdk with json mode for guaranteed json
 * @note validates response against zod schema for type safety
 * @note supports model selection via options.model (defaults to sonnet)
 * @note briefs are loaded from disk and included in the prompt
 */
export const invokeBrainRepl = async <TOutput>(input: {
  prompt: string;
  briefs?: RefByUnique<typeof GitFile>[];
  schema: {
    ofOutput: ZodSchema<TOutput>;
  };
  options?: {
    model?: 'haiku' | 'sonnet' | 'opus';
  };
}): Promise<TOutput> => {
  // initialize anthropic client (uses ANTHROPIC_API_KEY env var)
  const client = new Anthropic();

  // load briefs content if provided
  const briefsContent = loadBriefsContent({ briefs: input.briefs });

  // convert zod schema to json schema for the prompt
  const jsonSchema = zodToJsonSchema(input.schema.ofOutput);

  // build full prompt with briefs and json schema instruction
  const fullPrompt = buildPrompt({
    briefsContent,
    taskPrompt: input.prompt,
    jsonSchema,
  });

  // map model name to anthropic model id
  const modelId = resolveModelId({ model: input.options?.model ?? 'sonnet' });

  // invoke anthropic api
  const response = await client.messages.create({
    model: modelId,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: fullPrompt,
      },
    ],
  });

  // extract text content from response
  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new UnexpectedCodePathError('brain.repl response missing text content', {
      response,
    });
  }

  // extract json from response (may include markdown code block)
  const rawText = textContent.text;
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch?.[1]?.trim() ?? rawText.trim();

  // parse json
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (parseError) {
    throw new UnexpectedCodePathError('brain.repl response is not valid json', {
      parseError: parseError instanceof Error ? parseError.message : String(parseError),
      rawTextPreview: rawText.slice(0, 500),
    });
  }

  // validate against zod schema (this gives us proper TOutput typing)
  const validated = input.schema.ofOutput.safeParse(parsed);
  if (!validated.success) {
    throw new UnexpectedCodePathError('brain.repl response failed schema validation', {
      issues: validated.error.issues,
      parsed,
    });
  }

  return validated.data;
};

/**
 * .what = builds the full prompt with briefs and json schema
 * .why = structures the prompt for reliable json output
 */
const buildPrompt = (input: {
  briefsContent: string | null;
  taskPrompt: string;
  jsonSchema: unknown;
}): string => {
  const parts: string[] = [];

  // add reference material if present
  if (input.briefsContent) {
    parts.push(`<reference_material>\n${input.briefsContent}\n</reference_material>`);
  }
<<<<<<< HEAD
>>>>>>> 706b3dd (prog: began integration test coverage)
=======

  // add the task with json schema requirement
  parts.push(`<task>
${input.taskPrompt}
</task>

<output_format>
respond ONLY with a valid json object matching this schema:
${JSON.stringify(input.jsonSchema, null, 2)}

do not include any text before or after the json. do not wrap in markdown code blocks.
</output_format>`);

  return parts.join('\n\n');
};

/**
 * .what = maps model shortname to anthropic model id
 * .why = provides simple interface while supporting full model ids
 */
const resolveModelId = (input: {
  model: 'haiku' | 'sonnet' | 'opus';
}): string => {
  const modelMap: Record<string, string> = {
    haiku: 'claude-3-5-haiku-latest',
    sonnet: 'claude-sonnet-4-20250514',
    opus: 'claude-opus-4-20250514',
  };
  return modelMap[input.model] ?? 'claude-sonnet-4-20250514';
};

/**
 * .what = loads brief file contents from disk
 * .why = enables brain.repl to receive domain knowledge via briefs
 */
const loadBriefsContent = (input: {
  briefs?: RefByUnique<typeof GitFile>[];
}): string | null => {
  if (!input.briefs || input.briefs.length === 0) return null;

  // load each brief file content
  const contents = input.briefs.map((brief) => {
    const content = readFileSync(brief.uri, 'utf-8');
    return `<brief path="${brief.uri}">\n${content}\n</brief>`;
  });

  return contents.join('\n\n');
>>>>>>> 7b95a42 (prog: integration tests on imagine operations)
};
