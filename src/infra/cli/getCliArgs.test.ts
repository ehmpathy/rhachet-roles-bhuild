import { z } from 'zod';

import { genCliArgsErrorStdout } from './getCliArgs';

/**
 * helper to extract real Zod issues from schema validation
 */
const getIssues = <T extends z.ZodSchema>(
  schema: T,
  input: unknown,
): z.ZodIssue[] => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error('expected validation to fail');
  return result.error.issues;
};

describe('genCliArgsErrorStdout', () => {
  describe('required field errors', () => {
    test('formats undefined field as "is required"', () => {
      const schema = z.object({
        named: z.object({ name: z.string() }),
      });
      const issues = getIssues(schema, { named: {} });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('⛈️  error: input invalid');
      expect(output).toContain('--name');
      expect(output).toMatchSnapshot();
    });

    test('formats multiple required fields', () => {
      const schema = z.object({
        named: z.object({ name: z.string(), email: z.string() }),
      });
      const issues = getIssues(schema, { named: {} });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('⛈️  error: input invalid');
      expect(output).toContain('--name');
      expect(output).toContain('--email');
      expect(output).toMatchSnapshot();
    });
  });

  describe('type mismatch errors', () => {
    test('formats type mismatch with expected and received', () => {
      const schema = z.object({
        named: z.object({ count: z.number() }),
      });
      const issues = getIssues(schema, { named: { count: 'not-a-number' } });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('⛈️  error: input invalid');
      expect(output).toContain('--count');
      expect(output).toMatchSnapshot();
    });
  });

  describe('enum errors', () => {
    test('formats enum error with available options', () => {
      const schema = z.object({
        named: z.object({ level: z.enum(['debug', 'info', 'warn', 'error']) }),
      });
      const issues = getIssues(schema, { named: { level: 'verbose' } });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('⛈️  error: input invalid');
      expect(output).toContain('--level');
      expect(output).toMatchSnapshot();
    });
  });

  describe('string length errors', () => {
    test('formats too short error', () => {
      const schema = z.object({
        named: z.object({ tag: z.string().min(3) }),
      });
      const issues = getIssues(schema, { named: { tag: 'ab' } });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('⛈️  error: input invalid');
      expect(output).toContain('--tag');
      expect(output).toMatchSnapshot();
    });

    test('formats too long error', () => {
      const schema = z.object({
        named: z.object({ description: z.string().max(10) }),
      });
      const issues = getIssues(schema, {
        named: { description: 'this is way too long' },
      });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('⛈️  error: input invalid');
      expect(output).toContain('--description');
      expect(output).toMatchSnapshot();
    });
  });

  describe('path to flag conversion', () => {
    test('handles nested path', () => {
      const schema = z.object({
        named: z.object({ config: z.object({ apiKey: z.string() }) }),
      });
      const issues = getIssues(schema, { named: { config: {} } });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('--config.apiKey');
      expect(output).toMatchSnapshot();
    });

    test('handles ordered array path', () => {
      const schema = z.object({
        ordered: z.tuple([z.string()]),
      });
      const issues = getIssues(schema, { ordered: [123] });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('argument[0]');
      expect(output).toMatchSnapshot();
    });

    test('handles empty path', () => {
      const schema = z.object({});
      const issues = getIssues(schema, null);

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('argument');
      expect(output).toMatchSnapshot();
    });
  });

  describe('fallback message', () => {
    test('uses lowercase zod message for unhandled codes', () => {
      const schema = z.object({
        named: z.object({
          special: z.string().refine(() => false, 'Custom Validation Failed'),
        }),
      });
      const issues = getIssues(schema, { named: { special: 'test' } });

      const output = genCliArgsErrorStdout({ issues });

      expect(output).toContain('--special');
      expect(output).toMatchSnapshot();
    });
  });

  describe('integration with real cli schema', () => {
    test('parses real schema errors correctly', () => {
      const schema = z.object({
        named: z.object({
          name: z.string(),
          count: z.number().optional(),
          mode: z.enum(['fast', 'slow']).optional(),
        }),
        ordered: z.array(z.string()).default([]),
      });

      const result = schema.safeParse({ named: {}, ordered: [] });

      expect(result.success).toBe(false);
      if (!result.success) {
        const output = genCliArgsErrorStdout({ issues: result.error.issues });
        expect(output).toContain('⛈️  error: input invalid');
        expect(output).toContain('--name');
        expect(output).toMatchSnapshot();
      }
    });
  });
});
