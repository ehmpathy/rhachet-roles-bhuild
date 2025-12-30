import * as path from 'path';
import { given, then, when } from 'test-fns';

import { invokeDecomposeSkill } from '../../../.test/utils/invokeDecomposeSkill';

// extend timeout for brain-powered tests
jest.setTimeout(120000);

const ASSETS_DIR = path.join(__dirname, '.test/assets/example.repo');

describe('decompose.behavior.brain.case1.integration', () => {
  given('[case1] behavior that needs decomposition', () => {
    when('[t0] --mode plan invoked with brain', () => {
      // invoke brain once, reuse result across assertions
      let result: { stdout: string; exitCode: number };

      then('exit code is 0', () => {
        result = invokeDecomposeSkill({
          behaviorName: 'large-feature',
          mode: 'plan',
          dir: path.join(ASSETS_DIR, 'needs-decomposition'),
          timeout: 120000,
        });
        expect(result.exitCode).toEqual(0);
      });

      then('output contains plan generated message', () => {
        expect(result.stdout).toContain('plan generated');
      });

      then('output reports behaviors proposed count', () => {
        expect(result.stdout).toMatch(/behaviors proposed = \d+/);
      });

      then('output reports context window percentage', () => {
        expect(result.stdout).toMatch(/context window = [\d.]+%/);
      });

      then('output lists proposed behavior names', () => {
        expect(result.stdout).toContain('proposed behaviors');
      });

      then('output shows next step command', () => {
        expect(result.stdout).toContain('--mode apply');
      });
    });
  });
});
