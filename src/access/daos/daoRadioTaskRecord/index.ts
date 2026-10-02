import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { join } from 'path';

import { RadioTaskRecord } from '../../../domain.objects/RadioTaskRecord';
import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';

/**
 * .what = wrap a record io op so any fault throws a MalfunctionError with the call's context
 * .why = a record the dao cannot read or write must fail loud, and name the file it hit.
 *        helpful-errors' .wrap fixes its metadata at wrap time and passes a cross-realm
 *        fs error through raw, so this wrapper names the call's own context per call
 *
 * .note = the context rides in the message, never in metadata — helpful-errors prints metadata
 *         as a raw json block. only the cause rides as metadata (helpful-errors omits it from
 *         that block), and only when it is a same-realm Error
 */
const withRecordMalfunction =
  <TInput, TOutput>(
    logic: (input: TInput) => TOutput,
    options: {
      message: string;
      context: (input: TInput) => { where: string; fix: string | null };
    },
  ) =>
  (input: TInput): TOutput => {
    try {
      return logic(input);
    } catch (error) {
      const context = options.context(input);
      const lines = [
        options.message,
        `   ├─ where: ${context.where}`,
        `   ${context.fix ? '├' : '└'}─ why:   ${asExecErrorMessage({ error })}`,
        ...(context.fix ? [`   └─ fix:   ${context.fix}`] : []),
      ];
      throw new MalfunctionError(
        lines.join('\n'),
        error instanceof Error ? { cause: error } : undefined,
      );
    }
  };

/**
 * .what = file name of a record, keyed by its identity
 * .why = one file per push identity makes the local findsert a path lookup
 */
const asRecordFileName = (input: { key: string }): string =>
  `record.${input.key}.json`;

/**
 * .what = is this dir entry a record file
 * .why = the record dir may hold other files; read only records
 */
const isRecordFileName = (input: { name: string }): boolean =>
  input.name.startsWith('record.') && input.name.endsWith('.json');

/**
 * .what = read one record file
 * .why = shared by the by-unique and the list reads; a malformed file names its path
 */
const readRecordFile = withRecordMalfunction(
  (input: { path: string }): RadioTaskRecord =>
    new RadioTaskRecord(JSON.parse(readFileSync(input.path, 'utf-8'))),
  {
    message: 'radio task record could not be read',
    context: (input) => ({
      where: input.path,
      fix: 'repair the json of the record file, or remove it',
    }),
  },
);

/**
 * .what = find one record by key within a record dir
 * .why = the transcribe findserts on the push identity
 */
const getOneByUnique = (input: {
  dir: string;
  key: string;
}): RadioTaskRecord | null => {
  const path = join(input.dir, asRecordFileName({ key: input.key }));
  if (!existsSync(path)) return null;
  return readRecordFile({ path });
};

/**
 * .what = list every record across the given dirs, each with the dir it lives in
 * .why = the drain and the stop reminder sweep every record dir in the worktree
 */
const getAll = (input: {
  dirs: string[];
}): { record: RadioTaskRecord; dir: string }[] =>
  input.dirs.flatMap((dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((name) => isRecordFileName({ name }))
      .map((name) => ({
        record: readRecordFile({ path: join(dir, name) }),
        dir,
      }));
  });

/**
 * .what = the record dir each route under .behavior holds
 * .why = a route keeps its records in its own `.radio/`; the `.radio/` beside
 *        the routes is the unbound home, never a route
 */
const getAllRouteRecordDirs = (input: { behaviorRoot: string }): string[] =>
  readdirSync(input.behaviorRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '.radio')
    .map((entry) => join(input.behaviorRoot, entry.name, '.radio'));

/**
 * .what = every record dir that exists in this worktree: the unbound home, then each route's
 * .why = the drain and the stop reminder reach every held task, whichever
 *        route (or none) held it
 */
const getAllDirs = (input: { cwd: string }): string[] => {
  // no .behavior dir, no records
  const behaviorRoot = join(input.cwd, '.behavior');
  if (!existsSync(behaviorRoot)) return [];

  // the unbound home plus each route's home, where present
  const dirsCandidate = [
    join(behaviorRoot, '.radio'),
    ...getAllRouteRecordDirs({ behaviorRoot }),
  ];
  return dirsCandidate.filter((dir) => existsSync(dir));
};

/**
 * .what = write a record whole
 * .why = temp file + rename, so a concurrent reader sees the old record or the new one, never half
 * .note = a temp left by a failed write is removed, so no partial file lingers in the dir
 */
const _upsert = (input: {
  dir: string;
  record: RadioTaskRecord;
}): RadioTaskRecord => {
  mkdirSync(input.dir, { recursive: true });
  const path = join(input.dir, asRecordFileName({ key: input.record.key }));
  const pathTemp = `${path}.tmp.${process.pid}`;
  try {
    writeFileSync(pathTemp, JSON.stringify(input.record, null, 2) + '\n');
    renameSync(pathTemp, path);
    return input.record;
  } finally {
    rmSync(pathTemp, { force: true });
  }
};

/**
 * .what = write a record whole, or fail loud
 * .why = a failed write is a loud malfunction (X3): the push is not recorded, so it must not proceed
 */
const upsert = withRecordMalfunction(_upsert, {
  message: 'radio task record could not be written',
  context: (input) => ({
    where: join(input.dir, asRecordFileName({ key: input.record.key })),
    fix: null,
  }),
});

export const daoRadioTaskRecord = {
  get: {
    one: { byUnique: getOneByUnique },
    all: getAll,
    dirs: getAllDirs,
  },
  set: { upsert },
};
