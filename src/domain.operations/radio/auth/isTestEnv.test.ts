import { isTestEnv } from './isTestEnv';

const TEST_CASES: {
  description: string;
  env: NodeJS.ProcessEnv;
  expect: boolean;
}[] = [
  {
    description: 'NODE_ENV=test is a test env',
    env: { NODE_ENV: 'test' },
    expect: true,
  },
  {
    description: 'a jest worker is a test env, whatever NODE_ENV says',
    env: { NODE_ENV: 'production', JEST_WORKER_ID: '1' },
    expect: true,
  },
  {
    description: 'neither marker is not a test env',
    env: { NODE_ENV: 'production' },
    expect: false,
  },
  {
    description: 'an empty env is not a test env',
    env: {},
    expect: false,
  },
];

describe('isTestEnv', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isTestEnv({ env: thisCase.env })).toEqual(thisCase.expect);
    }),
  );
});
