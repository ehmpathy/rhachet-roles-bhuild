import type { RefByUnique } from 'domain-objects';
import type { GitFile } from 'rhachet-artifact-git';
import type { VisualogicContext } from 'visualogic';
import type { ZodSchema } from 'zod';

import type { BehaviorDispatchConfig } from './BehaviorDispatchConfig';

/**
 * .what = context type for behavior dispatch operations
 * .why = provides runtime context with config, cache, brain.repl, and logging
 */
export interface BehaviorDispatchContext extends VisualogicContext {
  config: BehaviorDispatchConfig;
  cacheDir: {
    mounted: {
      path: string;
    };
  };
  /**
   * brain.repl for creative inference tasks (deptrace, measure)
   * invokes claude-code cli for ai-powered analysis
   */
  brain: {
    repl: {
      imagine: <TOutput>(input: {
        prompt: string;
        briefs?: RefByUnique<typeof GitFile>[];
        schema: {
          ofOutput: ZodSchema<TOutput>;
        };
        options?: {
          model?: 'haiku' | 'sonnet' | 'opus';
        };
      }) => Promise<TOutput>;
    };
  };
}
