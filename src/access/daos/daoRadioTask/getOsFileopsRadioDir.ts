import * as os from 'os';
import * as path from 'path';

import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { asOsFileopsPathSegment } from './asOsFileopsPathSegment';

/**
 * .what = the global os.fileops radio dir for a repo
 * .why = the task dao and the comment dao read one dir, so a comment log always sits beside
 *        its task file
 */
export const getOsFileopsRadioDir = (input: { repo: RadioTaskRepo }): string =>
  path.join(
    os.homedir(),
    'git',
    '.radio',
    asOsFileopsPathSegment({ value: input.repo.owner, of: 'owner' }),
    asOsFileopsPathSegment({ value: input.repo.name, of: 'name' }),
  );
