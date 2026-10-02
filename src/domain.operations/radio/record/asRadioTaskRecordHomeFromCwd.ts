import { relative } from 'path';

/**
 * .what = a record home with its dir as the human reads it, relative to cwd
 * .why = the push output names where the record went in the path the human typed from
 */
export const asRadioTaskRecordHomeFromCwd = <THome extends { dir: string }>(
  input: { home: THome },
  context: { cwd: string },
): THome => ({ ...input.home, dir: relative(context.cwd, input.home.dir) });
