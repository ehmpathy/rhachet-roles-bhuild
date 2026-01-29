import { z } from 'zod';

describe('catch.dream CLI', () => {
  // schema validation tests (unit level)

  const schemaOfArgs = z.object({
    named: z.object({
      name: z.string(),
      open: z.string().optional(),
      repo: z.string().optional(),
      role: z.string().optional(),
      skill: z.string().optional(),
      s: z.string().optional(),
    }),
    ordered: z.array(z.string()).default([]),
  });

  test('schema accepts valid args with name only', () => {
    const input = {
      named: { name: 'config-reload' },
      ordered: [],
    };

    const result = schemaOfArgs.safeParse(input);
    expect(result.success).toBe(true);
  });

  test('schema accepts valid args with name and open', () => {
    const input = {
      named: { name: 'config-reload', open: 'codium' },
      ordered: [],
    };

    const result = schemaOfArgs.safeParse(input);
    expect(result.success).toBe(true);
  });

  test('schema accepts rhachet passthrough args', () => {
    const input = {
      named: {
        name: 'config-reload',
        repo: 'ehmpathy',
        role: 'dreamer',
        skill: 'catch.dream',
      },
      ordered: [],
    };

    const result = schemaOfArgs.safeParse(input);
    expect(result.success).toBe(true);
  });

  test('schema rejects when name is absent', () => {
    const input = {
      named: { open: 'codium' },
      ordered: [],
    };

    const result = schemaOfArgs.safeParse(input);
    expect(result.success).toBe(false);
  });

  test('schema accepts empty open as valid (validation happens in CLI)', () => {
    const input = {
      named: { name: 'config-reload', open: '' },
      ordered: [],
    };

    // schema accepts empty string, validation happens in CLI logic
    const result = schemaOfArgs.safeParse(input);
    expect(result.success).toBe(true);
  });
});
