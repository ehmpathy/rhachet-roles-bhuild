import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';
import type { BrainReplContext } from '../../../infra/brain/BrainReplContext';
import { imaginePlan } from './imaginePlan';

describe('imaginePlan', () => {
  given('[case1] behavior with multiple usecases', () => {
    const testDir = path.join(os.tmpdir(), 'imaginePlan-test-1');
    const behaviorPath = path.join(testDir, '.behavior', 'v2025_01_01.parent');

    beforeAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.mkdir(behaviorPath, { recursive: true });
      await fs.writeFile(
        path.join(behaviorPath, '0.wish.md'),
        'wish = implement auth and data persistence',
      );
      await fs.writeFile(path.join(behaviorPath, '1.vision.md'), '');
      await fs.writeFile(
        path.join(behaviorPath, '2.criteria.md'),
        `# usecase.1 = auth\ngiven('user')\n  when('login')\n    then('authenticated')\n\n# usecase.2 = data\ngiven('entity')\n  when('save')\n    then('persisted')`,
      );
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] brain.repl returns valid decomposition', () => {
      const mockBrainRepl: BrainReplContext = {
        imagine: jest.fn().mockResolvedValue({
          behaviorsProposed: [
            {
              name: 'auth-service',
              dependsOn: [],
              decomposed: {
                wish: 'implement authentication and session management',
                vision: null,
              },
            },
            {
              name: 'data-layer',
              dependsOn: [],
              decomposed: {
                wish: 'implement data persistence',
                vision: null,
              },
            },
          ],
        }),
      };

      then('returns BehaviorDecompositionPlan', async () => {
        const behavior = new BehaviorPersisted({
          name: 'parent',
          path: behaviorPath,
        });
        const role = { briefs: [] };
        const context = { brain: { repl: mockBrainRepl } };

        const plan = await imaginePlan({ behavior, role }, context);

        expect(plan).toBeInstanceOf(BehaviorDecompositionPlan);
      });

      then('plan contains proposed behaviors from brain output', async () => {
        const behavior = new BehaviorPersisted({
          name: 'parent',
          path: behaviorPath,
        });
        const role = { briefs: [] };
        const context = { brain: { repl: mockBrainRepl } };

        const plan = await imaginePlan({ behavior, role }, context);

        expect(plan.behaviorsProposed).toHaveLength(2);
        expect(plan.behaviorsProposed[0]?.name).toEqual('auth-service');
        expect(plan.behaviorsProposed[1]?.name).toEqual('data-layer');
      });

      then('plan includes context analysis', async () => {
        const behavior = new BehaviorPersisted({
          name: 'parent',
          path: behaviorPath,
        });
        const role = { briefs: [] };
        const context = { brain: { repl: mockBrainRepl } };

        const plan = await imaginePlan({ behavior, role }, context);

        expect(plan.contextAnalysis).toBeDefined();
        expect(plan.contextAnalysis.usage.characters.quantity).toBeGreaterThan(
          0,
        );
      });

      then('plan includes generatedAt timestamp', async () => {
        const behavior = new BehaviorPersisted({
          name: 'parent',
          path: behaviorPath,
        });
        const role = { briefs: [] };
        const context = { brain: { repl: mockBrainRepl } };

        const plan = await imaginePlan({ behavior, role }, context);

        expect(plan.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });

  given('[case2] behavior with vision content', () => {
    const testDir = path.join(os.tmpdir(), 'imaginePlan-test-2');
    const behaviorPath = path.join(
      testDir,
      '.behavior',
      'v2025_01_01.visioned',
    );

    beforeAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.mkdir(behaviorPath, { recursive: true });
      await fs.writeFile(
        path.join(behaviorPath, '0.wish.md'),
        'wish = something',
      );
      await fs.writeFile(
        path.join(behaviorPath, '1.vision.md'),
        'vision = clean architecture with separation of concerns',
      );
      await fs.writeFile(
        path.join(behaviorPath, '2.criteria.md'),
        '# usecase.1\ngiven/when/then',
      );
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] imaginePlan invoked', () => {
      const mockBrainRepl: BrainReplContext = {
        imagine: jest.fn().mockResolvedValue({
          behaviorsProposed: [
            {
              name: 'sub-a',
              dependsOn: [],
              decomposed: {
                wish: 'sub wish',
                vision: 'sub vision',
              },
            },
          ],
        }),
      };

      then('prompt includes vision content', async () => {
        const behavior = new BehaviorPersisted({
          name: 'visioned',
          path: behaviorPath,
        });
        const role = { briefs: [] };
        const context = { brain: { repl: mockBrainRepl } };

        await imaginePlan({ behavior, role }, context);

        const imagineCall = mockBrainRepl.imagine as jest.Mock;
        const prompt = imagineCall.mock.calls[0][0].prompt;
        expect(prompt).toContain('clean architecture');
      });
    });
  });

  given('[case3] brain.repl receives role with briefs', () => {
    const testDir = path.join(os.tmpdir(), 'imaginePlan-test-3');
    const behaviorPath = path.join(testDir, '.behavior', 'v2025_01_01.briefed');
    const briefsDir = path.join(testDir, 'briefs');

    beforeAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.mkdir(behaviorPath, { recursive: true });
      await fs.mkdir(briefsDir, { recursive: true });
      await fs.writeFile(path.join(behaviorPath, '0.wish.md'), 'wish');
      await fs.writeFile(path.join(behaviorPath, '1.vision.md'), '');
      await fs.writeFile(path.join(behaviorPath, '2.criteria.md'), 'criteria');
      // create brief files
      await fs.writeFile(
        path.join(briefsDir, 'rule.require.bounded.md'),
        'keep contexts bounded',
      );
      await fs.writeFile(
        path.join(briefsDir, 'rule.require.naming.md'),
        'use ubiquitous language',
      );
    });

    afterAll(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    when('[t0] role has briefs', () => {
      const mockBrainRepl: BrainReplContext = {
        imagine: jest.fn().mockResolvedValue({
          behaviorsProposed: [],
        }),
      };

      then('role with briefs is passed to brain.repl', async () => {
        const behavior = new BehaviorPersisted({
          name: 'briefed',
          path: behaviorPath,
        });
        const role = {
          briefs: [
            { uri: path.join(briefsDir, 'rule.require.bounded.md') },
            { uri: path.join(briefsDir, 'rule.require.naming.md') },
          ],
        };
        const context = { brain: { repl: mockBrainRepl } };

        await imaginePlan({ behavior, role }, context);

        const imagineCall = mockBrainRepl.imagine as jest.Mock;
        expect(imagineCall.mock.calls[0][0].role).toEqual(role);
      });
    });
  });
});
