import { given, then, when } from 'test-fns';
import { z } from 'zod';

import { invokeBrainRepl } from './invokeBrainRepl';

/**
 * .what = integration tests for invokeBrainRepl
 * .why = verifies claude cli invocation with json-schema produces valid output
 */
describe('invokeBrainRepl', () => {
  given('[case1] simple schema with number and string', () => {
    const schema = z.object({
      value: z.number(),
      rationale: z.string(),
    });

    when('[t0] invoking with basic prompt', () => {
      then('should return valid structured output', async () => {
        const result = await invokeBrainRepl({
          prompt: 'Return the number 42 and explain why it is the answer.',
          schema: { ofOutput: schema },
          options: { model: 'haiku' },
        });

        expect(typeof result.value).toBe('number');
        expect(typeof result.rationale).toBe('string');
        expect(result.rationale.length).toBeGreaterThan(0);
      });
    });
  });

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
