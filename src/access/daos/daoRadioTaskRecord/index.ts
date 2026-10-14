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
import { z } from 'zod';

import { IdempotencyMode } from '../../../domain.objects/IdempotencyMode';
import { RadioChannel } from '../../../domain.objects/RadioChannel';
import { RadioTaskRecord } from '../../../domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '../../../domain.objects/RadioTaskRecordStatus';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';

/**
 * .what = the cause of a record fault, minus the class header an inner helpful-error carries
 * .why = the outer fault already names its class on its first line; a second
 *        `💥 MalfunctionError:` inside its `why:` line repeats it as noise
 */
const asRecordFaultCause = (input: { error: unknown }): string =>
  asExecErrorMessage({ error: input.error }).replace(
    /^(💥|✋) [A-Za-z]+Error: /u,
    '',
  );

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
        `   ${context.fix ? '├' : '└'}─ why:   ${asRecordFaultCause({ error })}`,
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
 * .what = the shape a record file must hold
 * .why = a record file is read back from disk, where a hand edit or a prior version can leave any
 *        blob. a wrong `repo`, `via`, or `recordStatus` must fail loud at the read, which names
 *        the file, not later in the send, far from it
 *
 * .note = keys outside the shape are stripped, so the clock fields a prior version wrote
 *         (`heldAt`, `settledAt`) never reach the domain object, nor the next write
 */
const schemaOfRecordFile = z.object({
  key: z.string(),
  kind: z.enum(['create', 'update']),
  repo: z.object({ owner: z.string(), name: z.string() }),
  via: z.nativeEnum(RadioChannel),
  auth: z.string().nullable(),
  idem: z.nativeEnum(IdempotencyMode).nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  exid: z.string().nullable(),
  status: z.nativeEnum(RadioTaskStatus).nullable(),
  recordStatus: z.nativeEnum(RadioTaskRecordStatus),
  reason: z.string().nullable(),
  heldSeq: z.number(),
  deliveredExid: z.string().nullable(),
});

/**
 * .what = each field a record file holds out of shape, as one line a human reads
 * .why = the fault names the field and the gap, so a repair needs no guess
 */
const asRecordShapeGaps = (input: { issues: z.core.$ZodIssue[] }): string =>
  input.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');

/**
 * .what = the record a file holds, checked whole against its shape
 * .why = the read is the boundary: a record that passes it is fit for the drain to act on
 *
 * .note = heldSeq is the drain order, minted as a positive integer; a record without one cannot be
 *         placed in line, so it fails loud here rather than sort as NaN or jump the line
 */
const asRecordFromFileJson = (input: { json: unknown }): RadioTaskRecord => {
  // a record must hold its place in line
  const heldSeq: unknown =
    typeof input.json === 'object' && input.json !== null
      ? (input.json as { heldSeq?: unknown }).heldSeq // note: parsed json is untyped; read the one field the line rests on before the whole-shape parse
      : undefined;
  if (!Number.isInteger(heldSeq) || (heldSeq as number) < 1)
    throw new MalfunctionError(
      `the record lacks a positive integer heldSeq, its place in line (found: ${JSON.stringify(heldSeq) ?? 'absent'})`,
    ); // note: no metadata object; helpful-errors would print it as a json block inside the wrapper's `why:` line, a repeat of the value named here

  // the rest of the record must fit its shape
  const parsed = schemaOfRecordFile.safeParse(input.json);
  if (!parsed.success)
    throw new MalfunctionError(
      `the record does not fit its shape (${asRecordShapeGaps({ issues: parsed.error.issues })})`,
    );
  return new RadioTaskRecord(
    asRecordFieldsInFileOrder({
      json: input.json as Record<string, unknown>, // note: the parse above proved it an object
      parsed: parsed.data,
    }),
  );
};

/**
 * .what = the parsed fields, in the key order the file held them
 * .why = the parse emits keys in schema order. a record read and written back must keep its bytes,
 *        or each drain churns the diff of a tracked record file with no change in sense
 */
const asRecordFieldsInFileOrder = <
  TParsed extends Record<string, unknown>,
>(input: {
  json: Record<string, unknown>;
  parsed: TParsed;
}): TParsed =>
  Object.fromEntries(
    Object.keys(input.json)
      .filter((key) => key in input.parsed)
      .map((key) => [key, input.parsed[key]]),
  ) as TParsed; // note: the same keys as parsed, since the parse strips only keys the file holds beyond the shape

/**
 * .what = does a record file still hold a clock field a prior version wrote
 * .why = the read sheds them, so only the raw json can tell which files still need a rewrite
 */
const isRecordJsonClockHeld = (input: { json: unknown }): boolean =>
  typeof input.json === 'object' &&
  input.json !== null &&
  ('heldAt' in input.json || 'settledAt' in input.json);

/**
 * .what = the bytes of one record file
 * .why = a file the fs cannot read (a permission, a dir in its place) is a fault apart from a
 *        file whose bytes are bad: no read can skip it, since its task and its place in line are
 *        both unknown
 */
const readRecordText = withRecordMalfunction(
  (input: { path: string }): string => readFileSync(input.path, 'utf-8'),
  {
    message: 'radio task record could not be read',
    context: (input) => ({
      where: input.path,
      fix: 'make the record file readable: a file, with read permission. do not remove it: that drops its task unsent',
    }),
  },
);

/**
 * .what = the record a file's bytes hold, and whether they still hold a clock field
 * .why = shared by every read; a malformed file names its path
 */
const asRecordFromText = withRecordMalfunction(
  (input: {
    path: string;
    text: string;
  }): { record: RadioTaskRecord; isClockHeld: boolean } => {
    const json: unknown = JSON.parse(input.text);
    return {
      record: asRecordFromFileJson({ json }),
      isClockHeld: isRecordJsonClockHeld({ json }),
    };
  },
  {
    message: 'radio task record could not be read',
    context: (input) => ({
      where: input.path,
      fix: 'repair the record file: valid json, in the shape named above. do not remove it: that drops its task unsent',
    }),
  },
);

/**
 * .what = read one record file, and say whether its bytes still hold a clock field
 * .why = the strict reads fail loud on any fault, fs or parse, and name the path
 */
const readRecordFileWithClockFlag = (input: {
  path: string;
}): { record: RadioTaskRecord; isClockHeld: boolean } =>
  asRecordFromText({ path: input.path, text: readRecordText(input) });

/**
 * .what = read one record file
 * .why = the by-unique and the list reads need the record alone
 */
const readRecordFile = (input: { path: string }): RadioTaskRecord =>
  readRecordFileWithClockFlag(input).record;

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
 * .what = list every record whose file still holds a clock field, clock fields shed
 * .why = a record the drain never rewrites (one already DELIVERED or REFUSED) would keep a prior
 *        version's clock on disk forever; this finds them so a drain can write each back once
 *
 * .note = strict like getAll: an unreadable file fails loud and names its path
 */
const getAllClockHeld = (input: {
  dirs: string[];
}): { record: RadioTaskRecord; dir: string }[] =>
  input.dirs.flatMap((dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((name) => isRecordFileName({ name }))
      .map((name) => ({
        ...readRecordFileWithClockFlag({ path: join(dir, name) }),
        dir,
      }))
      .filter(({ isClockHeld }) => isClockHeld)
      .map(({ record }) => ({ record, dir }));
  });

/**
 * .what = list every record whose bytes parse across the given dirs; skip a file whose bytes do not
 * .why = the heldSeq mint runs before a push is recorded. a malformed record in another route must
 *        not stop this push from its transcription, or a push the help calls "never lost" is lost
 *
 * .note = only a parse or shape fault is skipped. a file the fs cannot read fails loud here: it is
 *         an environment fault, not a bad record, and a skip would let the mint miss a seq it holds
 * .note = only for the mint. the drain reads the same dirs strictly via getAll right after the
 *         push is on disk, so a skipped file still fails loud and names its path
 */
const getAllReadable = (input: {
  dirs: string[];
}): { record: RadioTaskRecord; dir: string }[] =>
  input.dirs.flatMap((dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((name) => isRecordFileName({ name }))
      .flatMap((name) => {
        // an fs fault fails loud, outside the skip
        const path = join(dir, name);
        const text = readRecordText({ path });

        // skip a parse or shape fault only; an unwrapped error (a defect in this code) still throws
        try {
          return [{ record: asRecordFromText({ path, text }).record, dir }];
        } catch (error) {
          if (error instanceof MalfunctionError) return [];
          throw error;
        }
      });
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
    allReadable: getAllReadable,
    allClockHeld: getAllClockHeld,
    dirs: getAllDirs,
  },
  set: { upsert },
};
