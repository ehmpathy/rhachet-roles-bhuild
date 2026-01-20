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
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    // ink and yoga-layout use ESM and need to be transpiled
    // pattern handles both npm and pnpm node_modules structures
    'node_modules/(?!(\\.pnpm/)?(ink|ink-testing-library|yoga-layout|cli-cursor|restore-cursor|onetime|mimic-function|signal-exit|cli-truncate|slice-ansi|string-width|is-fullwidth-code-point|ansi-regex|strip-ansi|ansi-styles|wrap-ansi|emoji-regex|widest-line))',
  ],
  testMatch: [
    // note: order matters
    '**/*.test.ts',
    '**/*.test.tsx',
    '!**/*.acceptance.test.ts',
    '!**/*.acceptance.test.tsx',
    '!**/*.integration.test.ts',
    '!**/*.integration.test.tsx',
    '!**/.yalc/**',
  ],
  setupFilesAfterEnv: ['./jest.unit.env.ts'],

  // use 50% of threads to leave headroom for other processes
  maxWorkers: '50%', // https://stackoverflow.com/questions/71287710/why-does-jest-run-faster-with-maxworkers-50
};

// eslint-disable-next-line import/no-default-export
export default config;
