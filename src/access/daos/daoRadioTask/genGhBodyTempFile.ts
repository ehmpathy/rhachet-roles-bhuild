import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/**
 * .what = write an issue body into a private temp dir, for `gh --body-file`
 * .why = a body file keeps newlines intact; a private dir (mkdtemp) means two drains in two
 *        worktrees never share or swap a body, and its name cannot be guessed ahead of time
 *
 * .note = the caller must run `cleanup` in a finally, so the body never outlives the call
 */
export const genGhBodyTempFile = async (input: {
  body: string;
}): Promise<{ file: string; cleanup: () => Promise<void> }> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'radio-task-'));
  const file = path.join(dir, 'body.md');
  await fs.writeFile(file, input.body);
  return {
    file,
    cleanup: () => fs.rm(dir, { recursive: true, force: true }),
  };
};
