import { given, then, when } from 'test-fns';
import { z } from 'zod';

import { invokeBrainRepl } from './invokeBrainRepl';

/**
 * .what = integration test for invokeBrainRepl with briefs
 * .why = verifies claude cli invocation with briefs produces valid output
 */
describe('invokeBrainRepl', () => {
  given('[case2] schema with briefs', () => {
    const schema = z.object({
      upfront: z.number(),
      recurrent: z.number(),
      rationale: z.string(),
    });

    when('[t0] invoking with briefs', () => {
      then('should return valid structured output', async () => {
        const result = await invokeBrainRepl({
          prompt: 'Estimate time: upfront=100 mins, recurrent=5 mins/wk. Explain.',
          briefs: [], // empty briefs for now
          schema: { ofOutput: schema },
          options: { model: 'haiku' },
        });

        expect(typeof result.upfront).toBe('number');
        expect(typeof result.recurrent).toBe('number');
        expect(typeof result.rationale).toBe('string');
      });
    });
  });
});
