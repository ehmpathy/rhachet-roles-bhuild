import { execSync } from 'child_process';

import { OpenerUnavailableError } from './OpenerUnavailableError';

/**
 * .what = open a file with specified editor/opener
 * .why = streamline user workflow by auto-open of wish file
 */
export const openFileWithOpener = (input: {
  opener: string;
  filePath: string;
}): void => {
  // build command with quoted path for safety
  const command = `${input.opener} "${input.filePath}"`;

  // execute and let errors propagate as OpenerUnavailableError
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    throw new OpenerUnavailableError(
      `opener '${input.opener}' unavailable or failed`,
      { cause: error instanceof Error ? error : undefined },
    );
  }
};
