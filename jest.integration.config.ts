/**
 * @jest-config-loader esbuild-register
 */
import type { Config } from 'jest';

// ensure tests run in utc, like they will on cicd and on server; https://stackoverflow.com/a/56277249/15593329
process.env.TZ = 'UTC';

// ensure tests run like on local machines, so snapshots are equal on local && cicd
process.env.FORCE_COLOR = 'true';

// https://jestjs.io/docs/configuration
const config: Config = {
  verbose: true,
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    // here's an example of how to ignore esm module transformation, when needed
    // 'node_modules/(?!(@octokit|universal-user-agent|before-after-hook)/)',
  ],
  // 🔴 `.temp/` is gitignored SCRATCH — a clone pulled down to read, a fixture
  //    staged by hand. a suite in there is not this repo's, and jest ran it:
  //    a `--scope path://ecowork` matched TWO files, one of them a checkout of
  //    another repo, and the run took 17 minutes instead of 8
  //
  // 🔴 `.agent/` holds rhachet's CACHE — rmsafe's trash among it. a suite
  //    removed from src/ lands there intact, and jest ran it as a live suite
  //    whose relative imports no longer point at a file
  //
  // 🔴 no suite is held out — `src/domain.roles/suitesGated.integration.test.ts`
  //    goes red if one is
  testMatch: [
    '**/*.integration.test.ts',
    '!**/.yalc/**',
    '!**/.temp/**',
    '!**/.agent/**',
  ],
  setupFilesAfterEnv: ['./jest.integration.env.ts'],

  // use 50% of threads to leave headroom for other processes
  maxWorkers: '50%', // https://stackoverflow.com/questions/71287710/why-does-jest-run-faster-with-maxworkers-50
};

// eslint-disable-next-line import/no-default-export
export default config;
