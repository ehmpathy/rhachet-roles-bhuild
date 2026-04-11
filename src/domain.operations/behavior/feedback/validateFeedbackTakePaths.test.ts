import { getError } from 'helpful-errors';

import { validateFeedbackTakePaths } from './validateFeedbackTakePaths';

describe('validateFeedbackTakePaths', () => {
  describe('valid paths', () => {
    const VALID_CASES = [
      {
        description: 'accepts matched [given] and [taken] paths',
        given: {
          fromPath: 'feedback/execution.[feedback].v1.[given].by_human.md',
          intoPath: 'feedback/execution.[feedback].v1.[taken].by_robot.md',
        },
      },
      {
        description: 'accepts paths with behavior dir prefix',
        given: {
          fromPath:
            '.behavior/v2026_04_09.my-feature/feedback/vision.[feedback].v1.[given].by_human.md',
          intoPath:
            '.behavior/v2026_04_09.my-feature/feedback/vision.[feedback].v1.[taken].by_robot.md',
        },
      },
      {
        description: 'accepts feedback v2',
        given: {
          fromPath: 'feedback/criteria.[feedback].v2.[given].by_human.md',
          intoPath: 'feedback/criteria.[feedback].v2.[taken].by_robot.md',
        },
      },
    ];

    VALID_CASES.map((thisCase) =>
      test(thisCase.description, () => {
        expect(() => validateFeedbackTakePaths(thisCase.given)).not.toThrow();
      }),
    );
  });

  describe('invalid --from path', () => {
    test('rejects fromPath without [given]', async () => {
      const error = await getError(async () =>
        validateFeedbackTakePaths({
          fromPath: 'feedback/execution.[feedback].v1.[taken].by_human.md',
          intoPath: 'feedback/execution.[feedback].v1.[taken].by_robot.md',
        }),
      );
      expect(error.message).toContain('--from path must be a [given]');
    });

    test('rejects fromPath without by_human', async () => {
      const error = await getError(async () =>
        validateFeedbackTakePaths({
          fromPath: 'feedback/execution.[feedback].v1.[given].by_robot.md',
          intoPath: 'feedback/execution.[feedback].v1.[taken].by_robot.md',
        }),
      );
      expect(error.message).toContain('--from path must be a by_human');
    });
  });

  describe('invalid --into path', () => {
    test('rejects intoPath without [taken]', async () => {
      const error = await getError(async () =>
        validateFeedbackTakePaths({
          fromPath: 'feedback/execution.[feedback].v1.[given].by_human.md',
          intoPath: 'feedback/execution.[feedback].v1.[given].by_robot.md',
        }),
      );
      expect(error.message).toContain('--into path must be a [taken]');
    });

    test('rejects intoPath without by_robot', async () => {
      const error = await getError(async () =>
        validateFeedbackTakePaths({
          fromPath: 'feedback/execution.[feedback].v1.[given].by_human.md',
          intoPath: 'feedback/execution.[feedback].v1.[taken].by_human.md',
        }),
      );
      expect(error.message).toContain('--into path must be a by_robot');
    });
  });

  describe('path mismatch', () => {
    test('rejects when --into does not match --from derivation', async () => {
      const error = await getError(async () =>
        validateFeedbackTakePaths({
          fromPath: 'feedback/execution.[feedback].v1.[given].by_human.md',
          intoPath: 'feedback/vision.[feedback].v1.[taken].by_robot.md',
        }),
      );
      expect(error.message).toContain('--into path does not match --from');
    });

    test('rejects when version mismatches', async () => {
      const error = await getError(async () =>
        validateFeedbackTakePaths({
          fromPath: 'feedback/execution.[feedback].v1.[given].by_human.md',
          intoPath: 'feedback/execution.[feedback].v2.[taken].by_robot.md',
        }),
      );
      expect(error.message).toContain('--into path does not match --from');
    });
  });
});
