import { promises as fs } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { basename, join } from 'path';
import { z } from 'zod';

import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';
import { PHONE_TEXT_STATUSES } from '@src/domain.objects/phone/PhoneTextStatus';
import { delFileIfUnchanged } from '@src/infra/fs/delFileIfUnchanged';
import { genFileExclusive } from '@src/infra/fs/genFileExclusive';
import { isPidAlive } from '@src/infra/process/isPidAlive';

import { genPhoneCacheDir } from '../genPhoneCacheDir';
import { getOnePhoneCacheDir } from '../getOnePhoneCacheDir';

/**
 * .what = one record as the mailbox holds it, with the path it lives at
 * .why = the ordinal in the path orders the mailbox; the caller never names a text by it
 */
export interface PhoneMailboxEntry {
  path: string;
  record: PhoneTextRecord;
}

/**
 * .what = the format version every record file carries
 * .why = each tree runs its own installed rhachet-roles-bhuild, and a daemon writes `in` copies
 *        into another tree's mailbox, so a reader meets records a newer writer wrote. a version
 *        it does not know reads as unreadable, named and skipped, never a crash
 */
const PHONE_TEXT_RECORD_VERSION = 1;

const schemaOfRecord = z
  .object({
    v: z.literal(PHONE_TEXT_RECORD_VERSION),
    uuid: z.string(),
    way: z.enum(['out', 'in']),
    group: z.string().nullable(),
    re: z.string().nullable(),
    from: z.string(),
    to: z.string(),
    what: z.string(),
    status: z.enum(PHONE_TEXT_STATUSES),
    reason: z.string().nullable(),
  })
  // an `in` copy is the receipt of a said text, so it is only ever DELIVERED
  .refine((record) => record.way === 'out' || record.status === 'DELIVERED', {
    message: 'an in copy must be DELIVERED',
    path: ['status'],
  });

const PATTERN_FILE = /^text\.(\d+)\.(out|in)\.json$/;

/**
 * .what = the storage ordinal a record file name carries; 0 for a name that holds none
 */
const asMailboxOrdinal = (input: { path: string }): number =>
  Number(PATTERN_FILE.exec(basename(input.path))?.[1] ?? 0);

/**
 * .what = the dir one seat's mailbox lives in
 * .why = a mailbox keys by the clone's name — its slug, or its serial where it has none — so a
 *        seat outlives a respawn: a text sent to a seat reaches whatever clone sits there next
 */
const getMailboxDir = (input: { treeDir: string; clone: string }): string =>
  join(
    getOnePhoneCacheDir({ treeDir: input.treeDir }),
    'skill=phone.text',
    `clone=${input.clone}`,
  );

/**
 * .what = every mailbox dir in a tree, one per clone that ever sent or received a text
 * .why = the daemon is per tree and serves every clone mailbox in it
 */
const getAllMailboxClones = async (input: {
  treeDir: string;
}): Promise<string[]> => {
  const root = join(getOnePhoneCacheDir(input), 'skill=phone.text');
  const dirents = await fs
    .readdir(root, { withFileTypes: true })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
  return dirents
    .filter(
      (dirent) => dirent.isDirectory() && dirent.name.startsWith('clone='),
    )
    .map((dirent) => dirent.name.slice('clone='.length))
    .sort();
};

/**
 * .what = the path of every record file in one clone's mailbox, in write order
 */
const getAllRecordPaths = async (input: {
  treeDir: string;
  clone: string;
}): Promise<string[]> => {
  const dir = getMailboxDir(input);
  const names = await fs.readdir(dir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return names
    .filter((name) => PATTERN_FILE.test(name))
    .map((name) => join(dir, name))
    .sort(
      (a, b) => asMailboxOrdinal({ path: a }) - asMailboxOrdinal({ path: b }),
    );
};

/**
 * .what = reads every record in one clone's mailbox that parses, in write order, and names each
 *         file that does not
 * .why = the one read of a mailbox: one record a reader can not read (a file a newer
 *        rhachet-roles-bhuild wrote, a half-copied file) must not halt a send, a thread read, a
 *        withdraw, or a delivery. the bad file is named back, so the caller says so, never drops
 *        it in silence
 */
const getAllReadable = async (input: {
  treeDir: string;
  clone: string;
}): Promise<{
  entries: PhoneMailboxEntry[];
  unreadable: { path: string; reason: string }[];
}> => {
  const paths = await getAllRecordPaths(input);
  const reads = await Promise.all(
    paths.map(async (path) => {
      // only a record this dao refused to parse is tolerated; an fs fault still throws
      const read = await getOneRecordReadFromPath({ path });
      return { path, read };
    }),
  );
  return {
    entries: reads.flatMap((one) =>
      one.read.record ? [{ path: one.path, record: one.read.record }] : [],
    ),
    unreadable: reads.flatMap((one) =>
      one.read.reason ? [{ path: one.path, reason: one.read.reason }] : [],
    ),
  };
};

/**
 * .what = reads and validates one record file; a bad file fails loud with its path
 */
const getOneRecordFromPath = async (input: {
  path: string;
}): Promise<PhoneTextRecord> => {
  const read = await getOneRecordReadFromPath(input);
  if (read.record) return read.record;
  throw new MalfunctionError(read.reason, {
    path: input.path,
    issues: read.issues,
  });
};

/**
 * .what = reads one record file, and names in one plain line why it can not be used
 * .why = a reader that skips a bad file prints that line beside the file name; the line must not
 *        carry the error's metadata block, nor an absolute path the caller already holds
 */
const getOneRecordReadFromPath = async (input: {
  path: string;
}): Promise<
  | { record: PhoneTextRecord; reason: null; issues: null }
  | { record: null; reason: string; issues: string[] }
> => {
  const text = await fs.readFile(input.path, 'utf8');
  const json = ((): { value: unknown } | null => {
    try {
      return { value: JSON.parse(text) };
    } catch {
      return null;
    }
  })();
  if (!json)
    return {
      record: null,
      reason: 'phone text record is not json',
      issues: [],
    };
  const parsed = schemaOfRecord.safeParse(json.value);
  if (!parsed.success)
    return {
      record: null,
      reason: 'phone text record has an unknown shape',
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  const { v: _version, ...record } = parsed.data;
  return { record: new PhoneTextRecord(record), reason: null, issues: null };
};

/**
 * .what = the bytes a record is written as, in a fixed key order
 * .why = a record the reader would skip as unreadable is refused at write, so the writer can not
 *        leave a record no reader can use (an `in` copy that is not DELIVERED, say)
 */
const asRecordJson = (record: PhoneTextRecord): string => {
  const shape = {
    v: PHONE_TEXT_RECORD_VERSION,
    uuid: record.uuid,
    way: record.way,
    group: record.group,
    re: record.re,
    from: record.from,
    to: record.to,
    what: record.what,
    status: record.status,
    reason: record.reason,
  };
  const parsed = schemaOfRecord.safeParse(shape);
  if (!parsed.success)
    throw new MalfunctionError('phone text record is not writable as is', {
      uuid: record.uuid,
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  return `${JSON.stringify(shape, null, 2)}\n`;
};

/**
 * .what = findserts a record into one clone's mailbox, by (uuid, way)
 * .why = a re-run of a delivery must not write a second `in` copy; the next free ordinal is
 *        claimed by an exclusive create, so two writers that race cannot both win it
 */
const gen = async (input: {
  treeDir: string;
  clone: string;
  record: PhoneTextRecord;
}): Promise<PhoneMailboxEntry> => {
  // return the extant copy, if this text already sits here; a record this dao can not read is
  // not this one, and must not block a write into a mailbox another tree's daemon shares
  const { entries } = await getAllReadable(input);
  const found = entries.find(
    (entry) =>
      entry.record.uuid === input.record.uuid &&
      entry.record.way === input.record.way,
  );
  if (found) return found;

  // claim the next ordinal by an exclusive create; a lost race takes the next
  await genPhoneCacheDir({ treeDir: input.treeDir });
  const dir = getMailboxDir(input);
  await fs.mkdir(dir, { recursive: true });
  const ordinalMax = Math.max(
    0,
    ...(await getAllRecordPaths(input)).map((path) =>
      asMailboxOrdinal({ path }),
    ),
  );
  const bytes = asRecordJson(input.record);
  for (let attempt = 1; attempt <= 64; attempt++) {
    const ordinal = String(ordinalMax + attempt).padStart(4, '0');
    const path = join(dir, `text.${ordinal}.${input.record.way}.json`);
    const claimed = await genFileExclusive({ path, bytes });
    if (claimed) return { path, record: input.record };
  }
  throw new MalfunctionError('could not claim a mailbox ordinal', {
    dir,
    attempts: 64,
  });
};

/**
 * .what = overwrites the status and reason of a record already in a mailbox
 * .why = a status change rewrites the same file via temp + rename, so a crash mid-write never
 *        leaves a half record
 * .note = the caller holds the record's claim (`genClaim`), and passes the entry it read under
 *         that claim; a write from a read taken before the claim could undo a withdraw
 */
const set = async (input: {
  entry: PhoneMailboxEntry;
  status: PhoneTextRecord['status'];
  reason: string | null;
}): Promise<PhoneMailboxEntry> => {
  const record = new PhoneTextRecord({
    ...input.entry.record,
    status: input.status,
    reason: input.reason,
  });
  const temp = `${input.entry.path}.tmp.${process.pid}`;
  await fs.writeFile(temp, asRecordJson(record));
  await fs.rename(temp, input.entry.path);
  return { path: input.entry.path, record };
};

/**
 * .what = re-reads one record at its path
 * .why = the daemon re-reads a text just before it says it, so a withdraw that landed after the
 *        tick began is honored
 */
const getOne = async (input: { path: string }): Promise<PhoneMailboxEntry> => ({
  path: input.path,
  record: await getOneRecordFromPath(input),
});

/**
 * .what = claims one record for a read-modify-write; false when a live holder has it
 * .why = the daemon's say and a sender's withdraw each read a QUEUED text, act, then rewrite
 *        it. without one claim between them, a withdraw that lands mid-say is overwritten by
 *        DELIVERED, and a text the sender was told is never said was in fact said
 *
 * .note = the claim file names its holder's pid and act; a claim whose pid is dead is stale. it
 *         is removed only if it still holds the bytes read (`delFileIfUnchanged`), so a reclaimer
 *         that lost the race never removes the winner's fresh claim, then claimed again. the act
 *         of a stale claim is returned, since a dead `say` holder may have said the text already
 */
const genClaim = async (input: {
  path: string;
  act: PhoneMailboxClaimAct;
}): Promise<{
  isClaimed: boolean;
  actStale: PhoneMailboxClaimAct | null;
}> => {
  const path = `${input.path}.claim`;
  const bytes = `${process.pid} ${input.act}\n`;
  const isClaimed = await genFileExclusive({ path, bytes });
  if (isClaimed) return { isClaimed, actStale: null };

  // read who holds it
  const text = await getClaimText({ path });
  // the holder released it between the two reads: try once more, with no stale act
  if (text === null)
    return {
      isClaimed: await genFileExclusive({ path, bytes }),
      actStale: null,
    };

  // a live holder keeps it
  const holder = asClaimHolder({ text });
  if (holder && isPidAlive({ pid: holder.pid }))
    return { isClaimed: false, actStale: null };

  // a dead holder's claim is stale: remove it only if it is still the one read, then try once more
  const isStaleRemoved = await delFileIfUnchanged({
    path,
    bytesExpected: text,
  });
  if (!isStaleRemoved) return { isClaimed: false, actStale: null };
  const isReclaimed = await genFileExclusive({ path, bytes });
  return {
    isClaimed: isReclaimed,
    actStale: isReclaimed ? (holder?.act ?? 'say') : null,
  };
};

/**
 * .what = the act a claim is held for
 * .note = `prep` = the daemon readies a delivery, no say fired yet; `say` = the daemon's say has
 *         fired, or may have; `withdraw` = a sender's take-back. a stale `prep` is a safe retake,
 *         a stale `say` is not
 */
export type PhoneMailboxClaimAct = 'prep' | 'say' | 'withdraw';

/**
 * .what = the holder a claim file names, or null for a file that names no pid
 * .why = each tree runs its own installed rhachet-roles-bhuild, so a claim may be written by a
 *        newer writer with an act this reader does not know. the pid alone decides liveness, so a
 *        live holder's claim is never taken for an unknown act; that act reads as `say`, the act
 *        whose loss costs more if misread
 * .note = a file that names no pid is stale to `genClaim`, and its act reads as `say` there too
 */
const asClaimHolder = (input: {
  text: string | null;
}): { pid: number; act: PhoneMailboxClaimAct } | null => {
  const match = input.text?.trim().match(/^(\d+)(?:\s+(\S+))?/);
  if (!match) return null;
  const act = PHONE_MAILBOX_CLAIM_ACTS.find((one) => one === match[2]) ?? 'say';
  return { pid: Number(match[1]), act };
};

const PHONE_MAILBOX_CLAIM_ACTS = ['prep', 'say', 'withdraw'] as const;

/**
 * .what = rewrites the act of a claim this process holds
 * .why = the daemon claims a text as `prep`, then marks `say` the instant before the say fires,
 *        and back to `prep` once the say is known not to have landed. so a crash leaves on disk
 *        exactly what a reclaimer must know: whether a say may have fired
 */
const setClaimAct = async (input: {
  path: string;
  act: PhoneMailboxClaimAct;
}): Promise<void> => {
  const path = `${input.path}.claim`;
  const holder = asClaimHolder({ text: await getClaimText({ path }) });
  if (holder?.pid !== process.pid)
    throw new MalfunctionError('a claim act was set on a claim not held', {
      path,
      holder,
      pid: process.pid,
    });
  const temp = `${path}.tmp.${process.pid}`;
  await fs.writeFile(temp, `${process.pid} ${input.act}\n`);
  await fs.rename(temp, path);
};

/**
 * .what = the act of the claim this process holds on one record, or null when it holds none
 */
const getClaimAct = async (input: {
  path: string;
}): Promise<PhoneMailboxClaimAct | null> => {
  const holder = asClaimHolder({
    text: await getClaimText({ path: `${input.path}.claim` }),
  });
  return holder?.pid === process.pid ? holder.act : null;
};

/**
 * .what = the act of whoever holds the claim on one record, or null when none holds it
 * .why = a refusal says what the holder does: a say may have fired, a status write has not
 */
const getClaimActOfHolder = async (input: {
  path: string;
}): Promise<PhoneMailboxClaimAct | null> =>
  asClaimHolder({
    text: await getClaimText({ path: `${input.path}.claim` }),
  })?.act ?? null;

/**
 * .what = the bytes of a claim file, or null when there is none
 */
const getClaimText = (input: { path: string }): Promise<string | null> =>
  fs.readFile(input.path, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

/**
 * .what = releases this process's claim on one record; a no-op when it holds none
 */
const delClaim = async (input: { path: string }): Promise<void> => {
  const path = `${input.path}.claim`;
  const text = await getClaimText({ path });
  if (asClaimHolder({ text })?.pid !== process.pid) return;
  await fs.rm(path, { force: true });
};

export const daoPhoneMailbox = {
  getOne,
  getAllReadable,
  getAllMailboxClones,
  gen,
  set,
  genClaim,
  getClaimAct,
  getClaimActOfHolder,
  setClaimAct,
  delClaim,
};
