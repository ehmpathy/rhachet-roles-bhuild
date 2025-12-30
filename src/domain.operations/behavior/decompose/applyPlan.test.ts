import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import { applyPlan } from './applyPlan';

describe('applyPlan', () => {
  given('[case1] valid plan with two proposed behaviors', () => {
    const testDir = path.join(os.tmpdir(), 'applyPlan-test-1');
    const behaviorRoot = path.join(testDir, '.behavior');
    const parentBehaviorPath = path.join(behaviorRoot, 'v2025_01_01.parent');

    beforeEach(async () => {
      // clean and recreate parent behavior directory for each test
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.mkdir(parentBehaviorPath, { recursive: true });
      await fs.writeFile(
        path.join(parentBehaviorPath, '0.wish.md'),
        'wish = parent wish',
      );
      await fs.writeFile(
        path.join(parentBehaviorPath, '2.criteria.md'),
        '# criteria',
      );
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] applyPlan invoked', () => {
      const plan = new BehaviorDecompositionPlan({
        behaviorSource: {
          name: 'parent',
          path: parentBehaviorPath,
        },
        behaviorsProposed: [
          {
            name: 'sub-a',
            dependsOn: [],
            decomposed: {
              wish: 'focus on A functionality',
              vision: 'architectural vision for A',
            },
          },
          {
            name: 'sub-b',
            dependsOn: ['sub-a'],
            decomposed: {
              wish: 'focus on B functionality',
              vision: null,
            },
          },
        ],
        contextAnalysis: {
          usage: {
            characters: { quantity: 50000 },
            tokens: { estimate: 12500 },
            window: { percentage: 6 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: '2025-01-01T00:00:00.000Z',
      });

      then('creates behavior directories', async () => {
        const result = await applyPlan({ plan });
        expect(result.behaviorsCreated).toHaveLength(2);
      });

      then('creates z.decomposed.md in parent', async () => {
        await applyPlan({ plan });
        const markerExists = await fs
          .access(path.join(parentBehaviorPath, 'z.decomposed.md'))
          .then(() => true)
          .catch(() => false);
        expect(markerExists).toEqual(true);
      });
    });
  });

  given('[case2] plan for already decomposed behavior', () => {
    const testDir = path.join(os.tmpdir(), 'applyPlan-test-2');
    const behaviorRoot = path.join(testDir, '.behavior');
    const parentBehaviorPath = path.join(
      behaviorRoot,
      'v2025_01_01.decomposed',
    );

    beforeAll(async () => {
      await fs.mkdir(parentBehaviorPath, { recursive: true });
      await fs.writeFile(
        path.join(parentBehaviorPath, 'z.decomposed.md'),
        '# already decomposed',
      );
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] applyPlan invoked', () => {
      const plan = new BehaviorDecompositionPlan({
        behaviorSource: {
          name: 'decomposed',
          path: parentBehaviorPath,
        },
        behaviorsProposed: [
          {
            name: 'sub-x',
            dependsOn: [],
            decomposed: {
              wish: 'wish x',
              vision: null,
            },
          },
        ],
        contextAnalysis: {
          usage: {
            characters: { quantity: 10000 },
            tokens: { estimate: 2500 },
            window: { percentage: 1 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: '2025-01-01T00:00:00.000Z',
      });

      then('throws BadRequestError about already decomposed', async () => {
        const error = await getError(applyPlan({ plan }));
        expect(error.message).toContain('already decomposed');
      });
    });
  });

  given('[case3] plan with name conflict', () => {
    const testDir = path.join(os.tmpdir(), 'applyPlan-test-3');
    const behaviorRoot = path.join(testDir, '.behavior');
    const parentBehaviorPath = path.join(behaviorRoot, 'v2025_01_01.parent3');

    beforeAll(async () => {
      await fs.mkdir(parentBehaviorPath, { recursive: true });
      // pre-create a conflicting directory
      const today = new Date().toISOString().split('T')[0]?.replace(/-/g, '_');
      const conflictPath = path.join(behaviorRoot, `v${today}.conflict-name`);
      await fs.mkdir(conflictPath, { recursive: true });
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] applyPlan invoked with conflicting name', () => {
      const plan = new BehaviorDecompositionPlan({
        behaviorSource: {
          name: 'parent3',
          path: parentBehaviorPath,
        },
        behaviorsProposed: [
          {
            name: 'conflict-name',
            dependsOn: [],
            decomposed: {
              wish: 'this conflicts',
              vision: null,
            },
          },
        ],
        contextAnalysis: {
          usage: {
            characters: { quantity: 10000 },
            tokens: { estimate: 2500 },
            window: { percentage: 1 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: '2025-01-01T00:00:00.000Z',
      });

      then('throws BadRequestError about name conflict', async () => {
        const error = await getError(applyPlan({ plan }));
        expect(error.message).toContain('already exists');
      });
    });
  });

  given('[case4] plan with nonexistent parent', () => {
    when('[t0] applyPlan invoked', () => {
      const plan = new BehaviorDecompositionPlan({
        behaviorSource: {
          name: 'nonexistent',
          path: '/tmp/nonexistent-parent-behavior-12345',
        },
        behaviorsProposed: [],
        contextAnalysis: {
          usage: {
            characters: { quantity: 10000 },
            tokens: { estimate: 2500 },
            window: { percentage: 1 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: '2025-01-01T00:00:00.000Z',
      });

      then('throws BadRequestError about parent not found', async () => {
        const error = await getError(applyPlan({ plan }));
        expect(error.message).toContain('parent behavior directory not found');
      });
    });
  });
});
