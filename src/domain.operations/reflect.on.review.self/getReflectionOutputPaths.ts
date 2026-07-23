import { homedir } from 'os';
import { isAbsolute, join, relative } from 'path';

/**
 * .what = derive the distinct markdown + json output paths from the --into choice
 * .why = the report and the json aggregate must never collide; both derive from
 *        one normalized base (always `.md`) so the json path differs, even when a
 *        caller passes an --into that lacks a `.md` suffix
 *
 * .note = default is a machine-level path; a --route filter defaults into that
 *         route dir; an explicit --into always wins
 *
 * @param into - the explicit --into path (absent = derive a default)
 * @param routeFilter - the --route filter (steers the default into that dir)
 */
export const getReflectionOutputPaths = (input: {
  into: string | undefined;
  routeFilter: string | null;
}): { reportPath: string; jsonPath: string } => {
  const reportPath = asMarkdownPath({ base: asReportBase(input) });
  // json path is the report path with its `.md` swapped for `.v1.json`
  const jsonPath = reportPath.replace(/\.md$/, '.v1.json');
  return { reportPath, jsonPath };
};

/**
 * .what = a human-friendly display path — relative when inside cwd, else absolute
 * .why = the machine-level default report lives under ~/.rhachet, far outside
 *        cwd; a relative render would be an ugly `../../..` chain, so show the
 *        absolute path for out-of-cwd targets and the tidy relative path for in
 */
export const asDisplayPath = (input: { path: string }): string => {
  const rel = relative(process.cwd(), input.path);
  return rel.startsWith('..') ? input.path : rel;
};

/**
 * .what = the raw report path base before extension normalization
 * .why = separates the where (into vs route vs default) from the how (extension)
 *
 * .note = the flag-less default is a machine-level path under ~/.rhachet, NOT
 *         cwd — the primary use case is a machine-wide sweep runnable from any
 *         repo, so a cwd default would scatter report files into whatever repo
 *         happens to be cwd (a git-hygiene hazard). an explicit --into always
 *         wins; a --route filter defaults into that route dir.
 */
const asReportBase = (input: {
  into: string | undefined;
  routeFilter: string | null;
}): string => {
  if (input.into)
    return isAbsolute(input.into)
      ? input.into
      : join(process.cwd(), input.into);
  if (input.routeFilter)
    return join(
      process.cwd(),
      input.routeFilter,
      'reflection.reviews.self.yield.md',
    );
  return join(
    homedir(),
    '.rhachet',
    'reflect',
    `reflection.reviews.self.${asIsoDateStamp({ at: new Date() })}.md`,
  );
};

/**
 * .what = the date portion (YYYY-MM-DD) of an instant, for a dated report path
 * .why = a machine-level default path is dated so repeat sweeps do not clobber
 *        each other; wraps the iso-string slice as a named transformer
 */
const asIsoDateStamp = (input: { at: Date }): string =>
  input.at.toISOString().slice(0, 10);

/**
 * .what = ensure a path ends in `.md`, with the suffix appended when absent
 * .why = the json path derives from the report path by an `.md` swap, so the
 *        report path must carry a `.md` suffix or the two paths would collide
 */
const asMarkdownPath = (input: { base: string }): string =>
  input.base.endsWith('.md') ? input.base : `${input.base}.md`;
