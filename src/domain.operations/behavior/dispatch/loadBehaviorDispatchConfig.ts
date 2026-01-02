import * as fs from 'fs/promises';
import * as yaml from 'yaml';

import { BehaviorDispatchConfig } from '../../../domain.objects/BehaviorDispatchConfig';

/**
 * .what = shape of rhachet.dispatch.yml configuration file
 * .why = enables type-safe parsing of yaml config
 */
interface DispatchConfigYaml {
  output?: string;
  sources?: {
    local?: {
      enabled?: boolean;
    };
    remote?: Array<{
      org: string;
      repo: string;
      branch: string;
    }>;
  };
  criteria?: {
    gain?: {
      leverage?: {
        weights?: {
          author?: number;
          support?: number;
        };
      };
    };
    convert?: {
      equate?: {
        cash?: { dollars?: number };
        time?: { hours?: number };
      };
    };
  };
  cost?: {
    horizon?: number;
  };
  constraints?: {
    maxConcurrency?: number;
  };
}

/**
 * .what = loads and parses rhachet.dispatch.yml configuration
 * .why = provides centralized config for gather/prioritize/coordinate skills
 */
export const loadBehaviorDispatchConfig = async (input: {
  configPath: string;
}): Promise<BehaviorDispatchConfig> => {
  // read config file
  const configContent = await fs.readFile(input.configPath, 'utf-8');

  // parse yaml
  const parsed = yaml.parse(configContent) as DispatchConfigYaml;

  // construct config with defaults
  const config = new BehaviorDispatchConfig({
    output: parsed.output ?? '.dispatch',
    sources: {
      local: {
        enabled: parsed.sources?.local?.enabled ?? true,
      },
      remote: parsed.sources?.remote ?? [],
    },
    criteria: {
      gain: {
        leverage: {
          weights: {
            author: parsed.criteria?.gain?.leverage?.weights?.author ?? 0.5,
            support: parsed.criteria?.gain?.leverage?.weights?.support ?? 0.5,
          },
        },
      },
      convert: {
        equate: {
          cash: {
            dollars: parsed.criteria?.convert?.equate?.cash?.dollars ?? 150,
          },
          time: { hours: parsed.criteria?.convert?.equate?.time?.hours ?? 1 },
        },
      },
    },
    cost: {
      horizon: { weeks: parsed.cost?.horizon ?? 24 },
    },
    constraints: {
      maxConcurrency: parsed.constraints?.maxConcurrency ?? 3,
    },
  });

  return config;
};
