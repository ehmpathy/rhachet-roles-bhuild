import * as path from 'path';
import type { ContextLogTrail } from 'simple-log-methods';

import type { BehaviorDispatchContext } from '../../../domain.objects/BehaviorDispatchContext';
import { invokeBrainRepl } from '../../../infra/brain/invokeBrainRepl';
import { findsertBehaviorDispatchDir } from './findsertBehaviorDispatchDir';
import { loadBehaviorDispatchConfig } from './loadBehaviorDispatchConfig';

/**
 * .what = generates a dispatch context from config path
 * .why = provides runtime context with config, cache dir, and logging
 */
export const genBehaviorDispatchContext = async (
  input: {
    configPath: string;
    repoDir: string;
  },
  context: ContextLogTrail,
): Promise<BehaviorDispatchContext> => {
  // load config
  const config = await loadBehaviorDispatchConfig({
    configPath: input.configPath,
  });

  // resolve output directory relative to repo
  const outputDir = path.isAbsolute(config.output)
    ? config.output
    : path.join(input.repoDir, config.output);

  // ensure dispatch directory exists
  await findsertBehaviorDispatchDir({ outputDir });

  // construct dispatch context
  const dispatchContext: BehaviorDispatchContext = {
    config,
    cacheDir: {
      mounted: {
        path: outputDir,
      },
    },
    brain: {
      repl: {
        imagine: invokeBrainRepl,
      },
    },
    log: context.log,
  };

  return dispatchContext;
};
