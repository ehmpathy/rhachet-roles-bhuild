import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';

import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';

/**
 * .what = compute paths for radio task storage
 * .why = consistent path resolution for global and local radio dirs
 */
export const getRadioPath = (input: {
  repo: RadioTaskRepo;
  exid?: string;
  variant: 'global' | 'local';
  cwd?: string;
}): {
  radioDir: string;
  taskFile?: string;
  statusFlag?: (status: RadioTaskStatus) => string;
  backup?: (isoDate: IsoDateStamp) => string;
  readme?: string;
} => {
  const globalRadioDir = path.join(
    os.homedir(),
    'git',
    '.radio',
    input.repo.owner,
    input.repo.name,
  );

  const radioDir =
    input.variant === 'global'
      ? globalRadioDir
      : path.join(input.cwd ?? process.cwd(), '.radio');

  const result: ReturnType<typeof getRadioPath> = {
    radioDir,
    readme: path.join(radioDir, 'readme.md'),
  };

  if (input.exid) {
    result.taskFile = path.join(radioDir, `task.${input.exid}._.md`);
    result.statusFlag = (status: RadioTaskStatus) =>
      path.join(radioDir, `task.${input.exid}._.status=${status}.flag`);
    result.backup = (isoDate: IsoDateStamp) =>
      path.join(radioDir, `task.${input.exid}.bak.${isoDate}.md`);
  }

  return result;
};

/**
 * .what = get global radio root path
 * .why = for readme bootstrap at ~/git/.radio/readme.md
 */
export const getGlobalRadioRoot = (): string => {
  return path.join(os.homedir(), 'git', '.radio');
};
