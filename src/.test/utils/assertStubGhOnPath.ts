import { MalfunctionError } from 'helpful-errors';

import { asExecExitCode } from '@src/infra/shell/asExecExitCode';
import { shx } from '@src/infra/shell/shx';

/**
 * .what = the stdout of a probe command, or a stand-in on its one documented "none" exit
 * .why  = `command -v` exits 1 when the name is not found, and `ls` exits 2 when the path
 *         is absent; any other exit, or a rejection with no exit code, rethrows, so a real
 *         shell fault is never misread as a lost stub
 */
const getProbeStdoutOrStandIn = async (input: {
  command: string;
  exitForNone: number;
  standIn: string;
}): Promise<string> => {
  try {
    const { stdout } = await shx(input.command);
    return stdout.trim();
  } catch (error) {
    if (asExecExitCode({ error }) !== input.exitForNone) throw error;
    return input.standIn;
  }
};

/**
 * .what = prove `gh`, as the subprocess resolves it, is the stub
 * .why  = a stub that is not first on the PATH the shell runs under lets the real gh
 *         answer. this runs first, so a lost stub fails loud before any token is read
 *
 * .note = on a miss it names the PATH the shell saw and the stub's mode, so the cause
 *         reads off the error, not a debug session
 * .note = a lost stub is a harness defect, not a caller's config, so it throws a
 *         MalfunctionError
 */
export const assertStubGhOnPath = async (input: {
  stubPath: string;
}): Promise<void> => {
  const resolved = await getProbeStdoutOrStandIn({
    command: 'command -v gh',
    exitForNone: 1,
    standIn: '',
  });
  if (resolved === input.stubPath) return;
  const pathSeen = await shx('echo "$PATH"').then((r) => r.stdout.trim());
  const stubSeen = await getProbeStdoutOrStandIn({
    command: `ls -l "${input.stubPath}"`,
    exitForNone: 2,
    standIn: '(absent)',
  });
  throw new MalfunctionError('stub gh not on the subprocess PATH', {
    expected: input.stubPath,
    resolved: resolved || '(none)',
    pathSeen,
    stubSeen,
  });
};
