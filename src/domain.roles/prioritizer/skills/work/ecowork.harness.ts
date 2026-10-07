/**
 * .what = the shared harness of the `ecowork.db` suite — the store runner,
 *         the consumer repo factory, and the csv readers its clamps share
 *
 * .suite = clamps for ecowork.db.mjs — the store beneath `rhx eco.priority`
 *
 * .why  = every guarantee this store makes fails SILENTLY when broken:
 *
 *           a partial set PRESERVES      a broken one deletes the gain, the
 *                                        cost, the why, and the refs — on the
 *                                        cheapest, most frequent call there is
 *           each side owns its DURATION  a broken one totals a 5y cost over a
 *                                        3mo window and reports a net PROFIT
 *           cash is integer CENTS        a broken one drifts by a cent per
 *                                        operation, into a real invoice
 *           a quant only FLAGS an opine  a broken one rewrites sev or urg, and
 *                                        the human never learns their judgment
 *                                        was overruled
 *
 *         ⇒ not one of the four announces itself. so they are clamped, or they
 *         are hoped for (rule.require.clamp-edge-cases).
 *
 * .how  = the REAL store, on a real sqlite file in a temp dir, over its real
 *         stdin/stdout json contract. no mock — the whole subject here is
 *         whether the sql and the arithmetic agree (rule.forbid.integration.mocks)
 */
import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { tempDirs } from '../../../.test/tempDirs';

export const PATH_ECOWORK_DB = join(__dirname, 'ecowork.db.mjs');

/**
 * .what = the store module's text WHOLE — the entry, then every part it imports
 * .why  = the store is cut into `ecowork.db.<part>.mjs` so one reviewer can hold
 *         each part. a clamp on the store's CODE names the store, never the file
 *         a function sits in: read the entry alone and a `toMatch` goes red on a
 *         function that moved, while a `not.toMatch` goes green over code that
 *         still ships
 */
export const readEcoworkDbWhole = (): string =>
  [
    PATH_ECOWORK_DB,
    ...readdirSync(__dirname)
      .filter((f) => /^ecowork\.db\.[a-z]+\.mjs$/.test(f))
      .sort()
      .map((f) => join(__dirname, f)),
  ]
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
export const PATH_ECOWORK_SH = join(__dirname, 'ecowork.sh');
export const PATH_ECO_PRIORITY_SH = join(__dirname, '..', 'eco.priority.sh');

/**
 * .what = run one verb against one db, and hand back the parsed result
 * .why  = this IS the tactic that was run by hand, over and over, as a
 *         `printf | node` pipeline. it is a tool now, so the clamps below read
 *         as claims rather than as shell (rule.always.enskill-the-tactics-you-discover)
 * .note = the verb union mirrors the module's own dispatcher, `ecowork.db.mjs`
 *         `const verbs = { set, get, del, 'goal.mv' }`. it is a cache of that
 *         set, so it drifts the moment a verb lands there and not here — read
 *         the dispatcher, never this line, for the authoritative set.
 */
export const eco = (input: {
  db: string;
  verb: 'set' | 'get' | 'del' | 'goal.mv';
  payload: object;
}) =>
  JSON.parse(
    execFileSync('node', [PATH_ECOWORK_DB, input.verb, input.db], {
      input: JSON.stringify(input.payload),
      encoding: 'utf8',
      timeout: 30_000,
    }),
  );

/** .what = a db path nobody else holds, so no clamp can see another's rows */
export const genDbPath = (input: { slug: string }) =>
  join(tempDirs.genOne({ slug: input.slug }), 'priority.db');

/**
 * .what = a scratch CONSUMER repo, whose `.eco/` the store alone wrote, then committed
 *
 * .why  = the repo-bound axes — tracked, ignored, committable, carried — grade
 *         a consumer's `.eco/`. this package SHIPS the store and keeps none of
 *         its own, so a clamp that reads this repo's root grades a directory
 *         that does not exist. a consumer in which the store had the only say
 *         over `.eco/` is the subject those axes are about.
 *
 * .note = every table holds a row, so a claim "per table" cannot pass over an
 *         empty set. the rows mirror [case38]'s fixture: two roots, a gate, a
 *         serve edge, and a sponsorship
 */
export const genConsumerRepo = (input: { slug: string }) => {
  const root = tempDirs.genOne({ slug: input.slug });
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
    });
  git('init', '-q');
  git('config', 'user.email', 'probe@example.com');
  git('config', 'user.name', 'probe');

  // the store, driven through its own contract — never a hand-planted file
  const db = join(root, '.eco', 'priority.db');
  const set = (payload: object) => eco({ db, verb: 'set', payload });
  set({ slug: 'bigrock://coverage', what: 'a root', sev: 'p1', urg: '1w' });
  set({ slug: 'altrock://speed', what: 'a second root', sev: 'p2', urg: '1m' });
  set({ slug: 'bigrock://prereq', what: 'a gate', sev: 'p3', urg: '1m' });
  set({
    slug: 'subrock://coverage/part',
    what: 'a row with every axis populated',
    sev: 'p2',
    urg: '1m',
    gates: ['bigrock://prereq'],
    surgoal: ['altrock://speed'],
    sponsored: true,
    sponsorWho: 'the clamp',
    sponsorWhy: 'so the sponsorship table holds a row to mirror',
  });

  // no host hook or signer may veto the probe's own commit
  git('add', '-A');
  git(
    '-c',
    'core.hooksPath=/dev/null',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-q',
    '-m',
    'store',
  );
  return { root, dirEco: join(root, '.eco'), db, git };
};

/**
 * .what = split whole csv text into RECORDS, quote-aware across newlines
 * .why  = a value may HOLD a newline, and the codec quotes it rather than
 *         refuse it — so a split on '\n' tears the row. a record ends at a
 *         newline OUTSIDE a quoted field.
 *
 *         ⚠️ this is the READER twin of the codec in ecowork.db.mjs, a SECOND
 *         implementation on purpose. the two disagreed until 2026-09-16, and
 *         the disagreement made the store unreadable on the next call after a
 *         multi-line `--what` — exactly the class a shared reader hides
 */
export const asCsvRecords = (text: string): string[] => {
  const records: string[] = [];
  let record = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        record += '""';
        i += 1;
        continue;
      }
      quoted = !quoted;
      record += char;
      continue;
    }
    if (char === '\n' && !quoted) {
      records.push(record);
      record = '';
      continue;
    }
    record += char;
  }
  if (record) records.push(record);
  return records;
};

/**
 * .what = split one csv record into its fields, quote-aware (rfc4180)
 * .why  = 45 values in the live store hold a comma and 24 hold a quote, so a
 *         hand split on ',' tears them. this is the READER twin of the codec
 *         in ecowork.db.mjs — deliberately a SECOND implementation, so a clamp
 *         that says "the round trip survives" is not graded by the very code
 *         that wrote the line
 */
export const asCsvFields = (line: string): string[] => {
  const fields: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      fields.push(field);
      field = '';
    } else field += char;
  }
  fields.push(field);
  return fields;
};

/**
 * .what = read one csv store file back as rows, keyed on its header
 * .why  = every clamp below asks the same question — "what rows does the text
 *         hold?" — and each used to answer it with its own local reader. one
 *         tool, so a format change lands in one place
 *         (rule.always.entool-the-skills-you-touch)
 *
 * .note = an EMPTY field decodes to null, which is the store's own null encode:
 *         `''` is unstorable by construction, so the two are unambiguous
 *         (define.invariant.eco.the-csv-is-truth-the-db-is-a-cache)
 *
 * .note = an ABSENT field — a row shorter than the header — decodes to null on
 *         the same grounds. empty and absent carry one sense here, so the row
 *         holds one representation of it rather than two.
 */
export const asCsvRows = (text: string): Record<string, string | null>[] => {
  const lines = asCsvRecords(text);
  const header = lines.shift();
  if (!header || !header.trim()) return [];
  const columns = asCsvFields(header);
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const fields = asCsvFields(line);
      return Object.fromEntries(
        columns.map((column, index) => {
          const field = fields[index];
          return [column, field === '' || field === undefined ? null : field];
        }),
      );
    });
};

/** .what = read one csv store file off disk as rows; an absent file holds none */
export const getStoreRows = (file: string): Record<string, string | null>[] =>
  existsSync(file) ? asCsvRows(readFileSync(file, 'utf8')) : [];

/**
 * .what = every edge in one mirror, with its uuid endpoints looked up as uris
 * .why  = 🔴 an edge is stored by the goal's UUID, never by its uri — that is
 *         what lets a rename move one column and leave every edge untouched
 *         (define.invariant.eco.goal-is-uuid-primary-uri-unique).
 *
 *         so a clamp that reads an edge file raw grades a pair of uuids no
 *         human wrote and no assertion can name. each case used to do that
 *         lookup by hand; this is the one tool
 *         (rule.always.pave-on-second-repeat)
 */
export const getStoreEdges = (input: {
  dir: string;
  file: string;
  from: string;
  to: string;
}): [string, string][] => {
  const byUuid = new Map(
    getStoreRows(join(input.dir, 'goal.csv')).map((row) => [row.uuid, row.uri]),
  );
  return getStoreRows(join(input.dir, input.file)).map((edge) => [
    byUuid.get(edge[input.from] ?? '') ??
      `⛔ unknown:${String(edge[input.from])}`,
    byUuid.get(edge[input.to] ?? '') ?? `⛔ unknown:${String(edge[input.to])}`,
  ]);
};

/**
 * .what = one field, encoded for a csv line (rfc4180)
 * .why  = the WRITER twin of `asCsvFields`. a null rides as an EMPTY field,
 *         which is the store's own null encode — `''` is unstorable, so the
 *         two never collide
 */
export const asCsvField = (value: string | null): string => {
  if (value === null) return '';
  return /[",\n\r]/.test(value) ? `"${value.split('"').join('""')}"` : value;
};

/**
 * .what = rows back into one csv file's text, header first
 * .why  = several clamps EDIT the mirror to stage a state the dump cannot
 *         emit — an older schema, a duplicate key, a torn line. each used to
 *         hand-roll that write, and each broke when the format moved off
 *         jsonl. one tool, so the next format change lands in one place
 *         (rule.always.entool-the-skills-you-touch)
 *
 * .note = the COLUMN ORDER is taken from the first row, so a caller that adds
 *         a key adds a column — which is what the schema-drift clamps need
 */
export const asCsvText = (rows: Record<string, string | null>[]): string => {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]!);
  const lines = [columns.map((column) => asCsvField(column)).join(',')];
  for (const row of rows)
    lines.push(
      columns.map((column) => asCsvField(row[column] ?? null)).join(','),
    );
  return `${lines.join('\n')}\n`;
};

/**
 * .what = db rows, shaped the way the TEXT mirror can hold them
 * .why  = 🔴 a csv is stringly typed BY CONSTRUCTION, and the store says so
 *         itself: "a value is returned as a STRING or as null. the db's own
 *         column affinity coerces an INTEGER column back" (`asStoreRows`).
 *
 *         so a parity clamp that compares a raw db row against a raw csv row
 *         grades the TRANSPORT's type erasure, never the mirror's fidelity —
 *         it reads `quant_asks: 1` against `quant_asks: '1'` and calls the
 *         mirror wrong when the mirror is exactly right. measured 2026-09-16
 *         on [case38] t2 and [case40] t1, 3 failures, one cause.
 *
 *         ⇒ the honest claim is "the text holds the same VALUES, in the one
 *           representation text has". so the db side is rendered as text
 *           before the compare, and null stays null — `''` is unstorable, so
 *           the null encode and the empty-string encode never collide
 *
 * ⚠️ this does NOT weaken the parity claim. a dropped row, an extra row, a
 *    wrong value, a wrong column all still fail — only `1` vs `'1'` stops
 *    failing, and that one was never a defect (rule.forbid.failhide)
 */
export const asTextShape = (rows: object[]): Record<string, string | null>[] =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([column, value]) => [
        column,
        value === null || value === undefined ? null : String(value),
      ]),
    ),
  );
