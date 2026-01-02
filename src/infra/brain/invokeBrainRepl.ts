import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import type { BrainReplRole } from './BrainReplContext';

/**
 * .what = invokes anthropic api for creative inference with structured output
 * .why = enables deptrace and measure skills to leverage ai for tasks
 *        requiring judgment (dependency inference, cost/gain estimation)
 *
 * @note uses anthropic structured outputs beta for guaranteed json schema compliance
 * @note validates response against zod schema for type safety
 * @note supports model selection via options.model (defaults to sonnet)
 * @note briefs are loaded from disk via role.briefs file refs
 */
export const invokeBrainRepl = async <TOutput>(input: {
  prompt: string;
  role?: BrainReplRole;
  schema: {
    ofOutput: ZodSchema<TOutput>;
  };
  options?: {
    model?: 'haiku' | 'sonnet' | 'opus';
  };
}): Promise<TOutput> => {
  // initialize anthropic client (uses ANTHROPIC_API_KEY env var)
  const client = new Anthropic();

  // load briefs content from role
  const briefsContent = loadBriefsContent({ role: input.role });

  // convert zod schema to json schema for structured output
  const jsonSchema = zodToJsonSchema(input.schema.ofOutput, {
    $refStrategy: 'none',
  });

  // build full prompt with briefs
  const fullPrompt = buildPrompt({
    briefsContent,
    taskPrompt: input.prompt,
  });

  // map model name to anthropic model id
  const modelId = resolveModelId({ model: input.options?.model ?? 'sonnet' });

  // invoke anthropic api with structured outputs beta
  const response = await client.messages.create(
    {
      model: modelId,
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      // @ts-expect-error - output_format is part of structured-outputs beta
      output_format: {
        type: 'json_schema',
        schema: jsonSchema,
      },
    },
    {
      headers: {
        'anthropic-beta': 'structured-outputs-2025-11-13',
      },
    },
  );

  // extract text content from response
  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new UnexpectedCodePathError(
      'brain.repl response missing text content',
      {
        response,
      },
    );
  }

  // parse json (guaranteed valid by structured outputs)
  const parsed: unknown = JSON.parse(textContent.text);

  // validate against zod schema (this gives us proper TOutput typing)
  const validated = input.schema.ofOutput.safeParse(parsed);
  if (!validated.success) {
    throw new UnexpectedCodePathError(
      'brain.repl response failed schema validation',
      {
        issues: validated.error.issues,
        parsed,
      },
    );
  }

  return validated.data;
};

/**
 * .what = builds the full prompt with briefs
 * .why = structures the prompt for the task
 */
const buildPrompt = (input: {
  briefsContent: string | null;
  taskPrompt: string;
}): string => {
  const parts: string[] = [];

  // add reference material if present
  if (input.briefsContent) {
    parts.push(`<briefs>\n${input.briefsContent}\n</briefs>`);
  }

  // add the task
  parts.push(`<task>\n${input.taskPrompt}\n</task>`);

  return parts.join('\n\n');
};

/**
 * .what = maps model shortname to anthropic model id
 * .why = provides simple interface while supporting full model ids
 */
const resolveModelId = (input: {
  model: 'haiku' | 'sonnet' | 'opus';
}): string => {
  // structured outputs requires claude 4.5+ models
  const modelMap: Record<string, string> = {
    haiku: 'claude-haiku-4-5',
    sonnet: 'claude-sonnet-4-5',
    opus: 'claude-opus-4-5',
  };
  return modelMap[input.model] ?? 'claude-sonnet-4-5';
};

/**
 * .what = loads brief contents from role file refs
 * .why = enables brain.repl to receive domain knowledge via briefs
 */
const loadBriefsContent = (input: { role?: BrainReplRole }): string | null => {
  if (!input.role?.briefs || input.role.briefs.length === 0) return null;

  // load each brief file content
  const contents = input.role.briefs.map((brief) => {
    const content = readFileSync(brief.uri, 'utf-8');
    return `<brief path="${brief.uri}">\n${content}\n</brief>`;
  });

  return contents.join('\n\n');
};
