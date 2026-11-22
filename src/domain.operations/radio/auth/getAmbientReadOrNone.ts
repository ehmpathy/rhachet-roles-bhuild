import { ConstraintError, MalfunctionError } from 'helpful-errors';

import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';
import { asExecExitCode } from '../../../infra/shell/asExecExitCode';
import { isAmbientReadAllowed } from './isAmbientReadAllowed';

/**
 * .what = the exit code each ambient read uses to say "none"
 * .why = `git config user.email` exits 1 when the key is unset (git-config docs: ret=1), and
 *        `gh auth token` exits 1 with no login. every other exit is a fault, never "none":
 *        git exits 3 on an invalid config file, and a shell exits 127 when gh is not installed
 *
 * .note = both reads are local: `gh auth token` prints the token gh stored at login and
 *         makes no network call, so no transient network fault can surface as its exit 1
 */
const EXIT_CODE_FOR_NONE = 1;

/**
 * .what = run one read of the box's ambient identity: its stdout, or null on the documented
 *         "none" exit
 * .why = every ambient read (the git email, the gh token) shares one guard and one exit rule,
 *        so no caller can read the host's gh login past the test guard, and no broken config
 *        is ever read as "unset"
 *
 * .note = a test may never reach a real gh login. in a test env this refuses unless the test
 *         declared a stub gh on the subprocess PATH via RADIO_GH_STUB=1, so a test that forgot
 *         the stub fails loud before any shell runs
 *
 * .note = the guard reads context.env, and the real shx runs under process.env, so a caller
 *         that passes the real shx must pass `env: process.env` with it. every entry does
 *         (radioTaskPush, radioTaskPull, radioTaskQueue), and the record replay forwards that
 *         same context; a unit test pairs a fake env with a fake shx that never execs
 *
 * .note = a fault throws a MalfunctionError that names the command and its exit, so the
 *         cause reads off the error
 */
export const getAmbientReadOrNone = async (
  input: { command: 'git config user.email' | 'gh auth token' },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<string | null> => {
  // refuse a test that did not declare a stub gh
  if (!isAmbientReadAllowed({ env: context.env }))
    throw new ConstraintError(
      'the ambient gh login is forbidden in a test env without a stub gh. put a stub gh on the subprocess PATH and set RADIO_GH_STUB=1',
      {
        radioGhStub: context.env.RADIO_GH_STUB ?? null,
        hint: 'wrap the test in withAmbientStub (src/.test/utils/withAmbientStub.ts)',
      },
    );

  // read; the documented "none" exit is an answer, any other exit is a fault
  try {
    const { stdout } = await context.shx(input.command);
    return stdout.trim() || null;
  } catch (error) {
    const exitCode = asExecExitCode({ error });
    if (exitCode === EXIT_CODE_FOR_NONE) return null;
    throw new MalfunctionError(`the ambient read \`${input.command}\` failed`, {
      command: input.command,
      exitCode,
      execError: asExecErrorMessage({ error }),
    });
  }
};
