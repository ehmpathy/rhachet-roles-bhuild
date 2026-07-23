import { asRouteStoneSetBoundary } from './asRouteStoneSetBoundary';

const TEST_CASES = [
  {
    description: 'parses a promised boundary with a slug',
    given: {
      command:
        'rhx route.stone.set --stone 1.vision --route .behavior/my-feature --as promised --that has-questioned-assumptions',
    },
    expect: {
      as: 'promised',
      stone: '1.vision',
      route: '.behavior/my-feature',
      slug: 'has-questioned-assumptions',
    },
  },
  {
    description: 'parses a passed trigger with no slug',
    given: {
      command:
        'rhx route.stone.set --stone 1.vision --route .behavior/my-feature --as passed',
    },
    expect: {
      as: 'passed',
      stone: '1.vision',
      route: '.behavior/my-feature',
      slug: null,
    },
  },
  {
    description: 'parses the npx rhachet run invocation form',
    given: {
      command:
        'npx rhachet run --repo bhrain --skill route.stone.set --stone 5.1.execution --route .behavior/x --as promised --that has-pruned-yagni',
    },
    expect: {
      as: 'promised',
      stone: '5.1.execution',
      route: '.behavior/x',
      slug: 'has-pruned-yagni',
    },
  },
  {
    description: 'returns null for a non route.stone.set command',
    given: { command: 'rhx route.drive' },
    expect: null,
  },
  {
    description: 'returns null when stone is absent',
    given: {
      command: 'rhx route.stone.set --route .behavior/x --as passed',
    },
    expect: null,
  },
  {
    description: 'strips wrapper quotes so a quoted route still matches',
    given: {
      command:
        'rhx route.stone.set --stone 1.vision --route ".behavior/my-feature" --as promised --that "has-questioned-assumptions"',
    },
    expect: {
      as: 'promised',
      stone: '1.vision',
      route: '.behavior/my-feature',
      slug: 'has-questioned-assumptions',
    },
  },
] as const;

describe('asRouteStoneSetBoundary', () => {
  TEST_CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      const output = asRouteStoneSetBoundary({
        command: thisCase.given.command,
      });
      expect(output).toEqual(thisCase.expect);
    }),
  );
});
