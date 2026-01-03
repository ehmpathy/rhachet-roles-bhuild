import type { RefByUnique } from 'domain-objects';
import type { GitFile } from 'rhachet-artifact-git';
import type { ZodSchema } from 'zod';

/**
 * .what = role with briefs for brain.repl
 * .why = bundles domain knowledge for a specific skill invocation
 */
export interface BrainReplRole {
  briefs: RefByUnique<typeof GitFile>[];
}

/**
 * .what = context interface for brain.repl dependency injection
 * .why = enables probabilistic operations to receive LLM access via context
 *
 * @note uses zod schema for type-safe structured output
 * @note briefs are loaded from disk via role.briefs file refs
 */
export interface BrainReplContext {
  imagine: <TOutput>(input: {
    prompt: string;
    role?: BrainReplRole;
    schema: {
      ofOutput: ZodSchema<TOutput>;
    };
    options?: {
      model?: 'haiku' | 'sonnet' | 'opus';
    };
  }) => Promise<TOutput>;
}
