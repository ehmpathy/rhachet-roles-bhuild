import { given, then, when } from 'test-fns';

import { asGhFaultTextSansEcho } from './asGhFaultTextSansEcho';

const COMMAND =
  'gh issue create --repo sandpine/svc-lessons --title read GH_TOKEN before gh auth login';

const TEST_CASES = [
  {
    description: 'the echoed command is cut, so its title cannot fake a 401',
    given: {
      message: `Command failed: ${COMMAND}\nHTTP 429: rate limit exceeded`,
      stderr: 'HTTP 429: rate limit exceeded',
      cmd: COMMAND,
      command: COMMAND,
    },
    expect: {
      output:
        'Command failed: \nHTTP 429: rate limit exceeded\nHTTP 429: rate limit exceeded',
    },
  },
  {
    description: 'with no exec cmd, the joined command is cut',
    given: {
      message: `Command failed: ${COMMAND}`,
      stderr: '',
      cmd: null,
      command: COMMAND,
    },
    expect: { output: 'Command failed: ' },
  },
  {
    description: 'a real 401 from gh survives the cut',
    given: {
      message: `Command failed: ${COMMAND}`,
      stderr: 'HTTP 401: Bad credentials',
      cmd: COMMAND,
      command: COMMAND,
    },
    expect: { output: 'Command failed: \nHTTP 401: Bad credentials' },
  },
];

describe('asGhFaultTextSansEcho', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the fault text is cut', () => {
        then('it yields what gh said, never the echo', () => {
          const output = asGhFaultTextSansEcho(thisCase.given);
          expect(output).toEqual(thisCase.expect.output);
          expect(output.toLowerCase()).not.toContain('gh_token');
        });
      });
    }),
  );
});
