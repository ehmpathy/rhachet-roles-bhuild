import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import { computePlanFromFile } from './computePlanFromFile';

describe('computePlanFromFile', () => {
  given('[case1] valid plan file', () => {
    const planPath = path.join(os.tmpdir(), 'valid-plan.json');

    beforeAll(async () => {
      const plan = {
        behaviorSource: {
          name: 'test-behavior',
          path: '/tmp/test-behavior',
        },
        behaviorsProposed: [
          {
            name: 'sub-behavior-a',
            dependsOn: [],
            decomposed: {
              wish: 'focus on A',
              vision: null,
            },
          },
          {
            name: 'sub-behavior-b',
            dependsOn: ['sub-behavior-a'],
            decomposed: {
              wish: 'focus on B',
              vision: 'architectural vision for B',
            },
          },
        ],
        contextAnalysis: {
          usage: {
            characters: { quantity: 10000 },
            tokens: { estimate: 2500 },
            window: { percentage: 2 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: '2025-01-01T00:00:00.000Z',
      };
      await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    });

    afterAll(async () => {
      await fs.rm(planPath, { force: true });
    });

    when('[t0] computePlanFromFile invoked', () => {
      then('returns BehaviorDecompositionPlan instance', async () => {
        const result = await computePlanFromFile({ planPath });
        expect(result).toBeInstanceOf(BehaviorDecompositionPlan);
      });

      then('behaviorSource is populated', async () => {
        const result = await computePlanFromFile({ planPath });
        expect(result.behaviorSource.name).toEqual('test-behavior');
      });

      then('behaviorsProposed is populated', async () => {
        const result = await computePlanFromFile({ planPath });
        expect(result.behaviorsProposed).toHaveLength(2);
        expect(result.behaviorsProposed[0]?.name).toEqual('sub-behavior-a');
      });

      then('contextAnalysis is populated', async () => {
        const result = await computePlanFromFile({ planPath });
        expect(result.contextAnalysis.recommendation).toEqual(
          'DECOMPOSE_UNNEEDED',
        );
      });
    });
  });

  given('[case2] invalid JSON file', () => {
    const planPath = path.join(os.tmpdir(), 'invalid-json-plan.json');

    beforeAll(async () => {
      await fs.writeFile(planPath, 'not valid json { broken');
    });

    afterAll(async () => {
      await fs.rm(planPath, { force: true });
    });

    when('[t0] computePlanFromFile invoked', () => {
      then('throws BadRequestError about invalid JSON', async () => {
        const error = await getError(computePlanFromFile({ planPath }));
        expect(error.message).toContain('not valid JSON');
      });
    });
  });

  given('[case3] plan file missing behaviorSource', () => {
    const planPath = path.join(os.tmpdir(), 'missing-source-plan.json');

    beforeAll(async () => {
      const plan = {
        behaviorsProposed: [],
        contextAnalysis: { usage: {}, recommendation: 'DECOMPOSE_UNNEEDED' },
        generatedAt: '2025-01-01T00:00:00.000Z',
      };
      await fs.writeFile(planPath, JSON.stringify(plan));
    });

    afterAll(async () => {
      await fs.rm(planPath, { force: true });
    });

    when('[t0] computePlanFromFile invoked', () => {
      then('throws BadRequestError about missing behaviorSource', async () => {
        const error = await getError(computePlanFromFile({ planPath }));
        expect(error.message).toContain('missing behaviorSource');
      });
    });
  });

  given('[case4] plan file missing behaviorsProposed', () => {
    const planPath = path.join(os.tmpdir(), 'missing-proposed-plan.json');

    beforeAll(async () => {
      const plan = {
        behaviorSource: { name: 'test', path: '/tmp/test' },
        contextAnalysis: { usage: {}, recommendation: 'DECOMPOSE_UNNEEDED' },
        generatedAt: '2025-01-01T00:00:00.000Z',
      };
      await fs.writeFile(planPath, JSON.stringify(plan));
    });

    afterAll(async () => {
      await fs.rm(planPath, { force: true });
    });

    when('[t0] computePlanFromFile invoked', () => {
      then(
        'throws BadRequestError about missing behaviorsProposed',
        async () => {
          const error = await getError(computePlanFromFile({ planPath }));
          expect(error.message).toContain('missing behaviorsProposed');
        },
      );
    });
  });

  given('[case5] plan file not found', () => {
    when('[t0] computePlanFromFile invoked with nonexistent path', () => {
      then('throws error', async () => {
        const error = await getError(
          computePlanFromFile({ planPath: '/tmp/nonexistent-plan-12345.json' }),
        );
        expect(error).toBeDefined();
      });
    });
  });
});
