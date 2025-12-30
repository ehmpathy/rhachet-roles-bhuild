import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import { applyPlan } from './applyPlan';

describe('applyPlan.integration', () => {
  given('[case1] valid plan with two proposed behaviors', () => {
    const testDir = path.join(os.tmpdir(), 'applyPlan-int-test-1');
    const behaviorRoot = path.join(testDir, '.behavior');
    const parentBehaviorPath = path.join(behaviorRoot, 'v2025_01_01.parent');

    beforeEach(async () => {
      // clean and recreate parent behavior directory for each test
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.mkdir(parentBehaviorPath, { recursive: true });
      await fs.writeFile(
        path.join(parentBehaviorPath, '0.wish.md'),
        'wish = implement large feature with multiple concerns',
      );
      await fs.writeFile(
        path.join(parentBehaviorPath, '2.criteria.md'),
        '# criteria\n\n## usecase.1\n...',
      );
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] applyPlan invoked with full plan', () => {
      const plan = new BehaviorDecompositionPlan({
        behaviorSource: {
          name: 'parent',
          path: parentBehaviorPath,
        },
        behaviorsProposed: [
          {
            name: 'data-layer',
            dependsOn: [],
            decomposed: {
              wish: 'implement the data access layer with persistence operations',
              vision: 'clean separation of data concerns from business logic',
            },
          },
          {
            name: 'business-logic',
            dependsOn: ['data-layer'],
            decomposed: {
              wish: 'implement core business rules and validations',
              vision: null,
            },
          },
        ],
        contextAnalysis: {
          usage: {
            characters: { quantity: 80000 },
            tokens: { estimate: 20000 },
            window: { percentage: 10 },
          },
          recommendation: 'DECOMPOSE_UNNEEDED',
        },
        generatedAt: '2025-01-01T12:00:00.000Z',
      });

      then('sub-behavior directories are created', async () => {
        const result = await applyPlan({ plan });
        expect(result.behaviorsCreated).toHaveLength(2);

        // verify directories exist
        for (const behaviorPath of result.behaviorsCreated) {
          const exists = await fs
            .access(behaviorPath)
            .then(() => true)
            .catch(() => false);
          expect(exists).toEqual(true);
        }
      });

      then('0.wish.md contains scoped wish for data-layer', async () => {
        const result = await applyPlan({ plan });
        const dataLayerPath = result.behaviorsCreated.find((p) =>
          p.includes('data-layer'),
        );
        const wishContent = await fs.readFile(
          path.join(dataLayerPath!, '0.wish.md'),
          'utf-8',
        );
        expect(wishContent).toContain('data access layer');
        expect(wishContent).toContain('decomposed from');
      });

      then('1.vision.md contains scoped vision for data-layer', async () => {
        const result = await applyPlan({ plan });
        const dataLayerPath = result.behaviorsCreated.find((p) =>
          p.includes('data-layer'),
        );
        const visionContent = await fs.readFile(
          path.join(dataLayerPath!, '1.vision.md'),
          'utf-8',
        );
        expect(visionContent).toContain('clean separation');
      });

      then(
        '1.vision.md is empty for business-logic (null vision)',
        async () => {
          const result = await applyPlan({ plan });
          const businessLogicPath = result.behaviorsCreated.find((p) =>
            p.includes('business-logic'),
          );
          const visionContent = await fs.readFile(
            path.join(businessLogicPath!, '1.vision.md'),
            'utf-8',
          );
          expect(visionContent.trim()).toEqual('');
        },
      );

      then(
        '2.criteria.md contains template (not parent criteria)',
        async () => {
          const result = await applyPlan({ plan });
          const dataLayerPath = result.behaviorsCreated.find((p) =>
            p.includes('data-layer'),
          );
          const criteriaContent = await fs.readFile(
            path.join(dataLayerPath!, '2.criteria.md'),
            'utf-8',
          );
          expect(criteriaContent).toContain('# criteria for data-layer');
          expect(criteriaContent).toContain('usecase.1');
          expect(criteriaContent).not.toContain(
            'implement large feature with multiple concerns',
          );
        },
      );

      then('z.decomposed.md lists all sub-behaviors', async () => {
        const result = await applyPlan({ plan });
        const decomposedContent = await fs.readFile(
          result.decomposedMarkerPath,
          'utf-8',
        );
        expect(decomposedContent).toContain('data-layer');
        expect(decomposedContent).toContain('business-logic');
        expect(decomposedContent).toContain('depends on');
      });
    });
  });
});
