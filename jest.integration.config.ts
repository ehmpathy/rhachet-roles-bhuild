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
    // shim esm-only packages for cjs interop with cli-test-library
    '^strip-ansi$': '<rootDir>/src/.test/mocks/stripAnsiMock.cjs',
    '^strip-final-newline$': '<rootDir>/src/.test/mocks/stripFinalNewlineMock.cjs',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [
    // cli-testing-library has ESM-only deps that need to be transformed
    // pattern handles pnpm structure: node_modules/.pnpm/pkg@version/node_modules/pkg/
    'node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?(strip-ansi|ansi-regex|cli-testing-library|strip-final-newline|slice-ansi|ansi-styles|string-width|is-fullwidth-code-point|wrap-ansi|emoji-regex|get-east-asian-width)/)',
  ],
  testMatch: ['**/*.integration.test.ts', '!**/.yalc/**'],
  setupFilesAfterEnv: ['./jest.integration.env.ts'],

  // use 50% of threads to leave headroom for other processes
  maxWorkers: '50%', // https://stackoverflow.com/questions/71287710/why-does-jest-run-faster-with-maxworkers-50
};

// eslint-disable-next-line import/no-default-export
export default config;
