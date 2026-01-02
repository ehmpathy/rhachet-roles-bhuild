import type { ContextLogTrail } from 'simple-log-methods';

import type { BrainReplContext } from '../infra/brain/BrainReplContext';
import type { BehaviorDispatchConfig } from './BehaviorDispatchConfig';

/**
 * .what = context type for behavior dispatch operations
 * .why = provides runtime context with config, cache, brain.repl, and logging
 */
export interface BehaviorDispatchContext extends ContextLogTrail {
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
    repl: BrainReplContext;
  };
}
