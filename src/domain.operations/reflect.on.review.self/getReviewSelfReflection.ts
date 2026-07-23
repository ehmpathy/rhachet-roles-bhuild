import { readFileSync } from 'fs';
import { dirname } from 'path';

import type { ReflectOnReflectionAggregate } from '@src/domain.objects/reflect.on.review.self/ReflectOnReflectionAggregate';
import type { ReflectOnReviewSelfVerdict } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfVerdict';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import { computeReflectionAggregate } from './computeReflectionAggregate';
import { getAllReviewSelfWindows } from './getAllReviewSelfWindows';
import { getAllTranscriptEvents } from './getAllTranscriptEvents';
import { getAllTranscriptPaths } from './getAllTranscriptPaths';

/**
 * .what = a judge that assigns a utility verdict to one self-review window
 * .why = injected in apply mode (cheap brain); absent in plan mode
 */
export type ReviewSelfJudge = (input: {
  window: ReflectOnReviewSelfWindow;
}) => Promise<ReflectOnReviewSelfVerdict>;

/**
 * .what = node filesystem errno codes that mean an unreadable file to tolerate
 * .why = the allowlist that separates a skip-worthy fs error from a real defect
 */
const FS_ERRNO_CODES = new Set([
  'ENOENT',
  'EACCES',
  'EISDIR',
  'ENOTDIR',
  'ELOOP',
  'ENAMETOOLONG',
  'EPERM',
]);

/**
 * .what = sweep the corpus, reconstruct self-review windows, and roll them up
 * .why = the top-level reflection — reads every transcript (or a filtered
 *        subset), reconstructs windows, optionally judges them, and aggregates
 *
 * @param projectFilter - narrow to one project's transcripts (absent = all)
 * @param routeFilter - narrow to windows of one route (absent = all routes)
 * @param stoneFilter - narrow to windows of one stone (absent = all stones)
 * @param judge - optional per-window verdict assigner (apply mode)
 */
export const getReviewSelfReflection = async (
  input: {
    projectFilter: string | null;
    routeFilter: string | null;
    stoneFilter: string | null;
    judge: ReviewSelfJudge | null;
  },
  options?: { projectsDir?: string },
): Promise<{
  aggregate: ReflectOnReflectionAggregate;
  windows: ReflectOnReviewSelfWindow[];
}> => {
  // enumerate the corpus of transcripts to read
  const transcriptPaths = getAllTranscriptPaths(
    { projectFilter: input.projectFilter },
    { projectsDir: options?.projectsDir },
  );

  // read each transcript into windows; a null result marks a skipped file
  const perTranscript = transcriptPaths.map((transcriptPath) =>
    getWindowsFromTranscript({ transcriptPath }),
  );
  const transcriptsSkipped = perTranscript.filter(
    (windows) => windows === null,
  ).length;
  const transcriptsRead = perTranscript.length - transcriptsSkipped;
  const windowsAll = perTranscript.flatMap((windows) => windows ?? []);

  // apply the optional route + stone filters
  const windowsFiltered = windowsAll.filter((window) =>
    matchesFilters({
      window,
      routeFilter: input.routeFilter,
      stoneFilter: input.stoneFilter,
    }),
  );

  // in apply mode, judge each window and attach its verdict
  const windowsJudged = input.judge
    ? await judgeAllWindows({ windows: windowsFiltered, judge: input.judge })
    : windowsFiltered;

  return {
    aggregate: computeReflectionAggregate({
      windows: windowsJudged,
      transcriptsRead,
      transcriptsSkipped,
      projectsSwept: countDistinctProjects({ transcriptPaths }),
      routesFound: countDistinctRouteRuns({ windows: windowsJudged }),
    }),
    windows: windowsJudged,
  };
};

/**
 * .what = count the distinct projects a set of transcript paths spans
 * .why = the corpus breadth ("N projects swept") — a human who wants to confirm
 *        the sweep really covered the machine reads this in the stdout summary
 *
 * .note = a project is one dir under the corpus root, so its identity is the
 *         transcript's parent dir (e.g. ~/.claude/projects/<project-slug>/)
 */
const countDistinctProjects = (input: { transcriptPaths: string[] }): number =>
  new Set(input.transcriptPaths.map((path) => dirname(path))).size;

/**
 * .what = count the distinct route runs represented in a set of windows
 * .why = each (transcript, route) pair is one run; the aggregate reports the tally
 */
const countDistinctRouteRuns = (input: {
  windows: ReflectOnReviewSelfWindow[];
}): number => new Set(input.windows.map(asRouteRunKey)).size;

/**
 * .what = the identity key of the route run a window belongs to
 * .why = a run is one route within one transcript file
 */
const asRouteRunKey = (window: ReflectOnReviewSelfWindow): string =>
  `${window.transcriptPath}::${window.route}`;

/**
 * .what = read + parse one transcript into windows, or null if unreadable
 * .why = a single unreadable file is skipped, never fatal to the sweep; but a
 *        logic defect in the parse must still fail loud, not hide as a skip
 *
 * .note = only the filesystem read is tolerated (see readTranscriptContent);
 *         the parse itself is already corrupt-line tolerant per line
 */
const getWindowsFromTranscript = (input: {
  transcriptPath: string;
}): ReflectOnReviewSelfWindow[] | null => {
  // read the file; an unreadable file yields null (tolerated, tallied as skipped)
  const content = readTranscriptContent({ path: input.transcriptPath });
  if (content === null) return null;

  // parse + reconstruct outside the try — a defect here fails loud, not hides
  const events = getAllTranscriptEvents({
    content,
    transcriptPath: input.transcriptPath,
  });
  return getAllReviewSelfWindows({ events });
};

/**
 * .what = read a transcript file's text, or null on a filesystem read error
 * .why = the tolerant boundary — an unreadable file is skipped, but an
 *        unexpected (non-fs) error is a real defect and is re-thrown to fail loud
 */
const readTranscriptContent = (input: { path: string }): string | null => {
  try {
    return readFileSync(input.path, 'utf-8');
  } catch (error) {
    // allowlist known node filesystem errno codes — the tolerated skip
    if (isFsErrnoError(error)) return null;
    // any other error is not one we expected — fail loud
    throw error;
  }
};

/**
 * .what = whether an error is a node filesystem errno error we tolerate
 * .why = narrows the catch to the allowlisted fs codes, not any error with a code
 *
 * .note = duck-typed on the `code` field, NOT `instanceof Error` — node's fs
 *         SystemError does not reliably pass `instanceof Error` once the module is
 *         compiled through swc/jest, so an instanceof gate silently let a real
 *         EISDIR/EACCES escape the tolerated skip (the sweep would then abort on
 *         one unreadable file instead of a skip — the guarantee this restores)
 */
const isFsErrnoError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  if (!('code' in error)) return false;
  // the `in` check proves a `code` field exists; read it as unknown
  const code: unknown = error.code;
  return typeof code === 'string' && FS_ERRNO_CODES.has(code);
};

/**
 * .what = whether a window passes the optional route + stone filters
 * .why = the sweep is machine-wide; filters narrow to a route or stone on demand
 */
const matchesFilters = (input: {
  window: ReflectOnReviewSelfWindow;
  routeFilter: string | null;
  stoneFilter: string | null;
}): boolean => {
  if (
    input.routeFilter &&
    !isRouteScopeMatch({ route: input.window.route, filter: input.routeFilter })
  )
    return false;
  if (input.stoneFilter && input.window.stone !== input.stoneFilter)
    return false;
  return true;
};

/**
 * .what = whether a route falls within the scope of a route filter
 * .why = an anchored match, not a bare containment check — a `--route .behavior/v1`
 *        filter must NOT also capture `.behavior/v10-other`; it matches the exact
 *        route or a route nested beneath it (filter + path separator), so the many
 *        versioned `.behavior/vYYYY_MM_DD.*` dirs never cross-match by prefix
 */
const isRouteScopeMatch = (input: { route: string; filter: string }): boolean =>
  input.route === input.filter || input.route.startsWith(`${input.filter}/`);

/**
 * .what = judge every window in sequence; each verdict binds to its window
 * .why = apply mode enriches windows with the cheap-brain utility label
 *
 * .note = sequential on purpose — a machine-wide apply sweep can hold thousands
 *         of windows, and parallel brain calls would rate-limit the supplier
 *
 * .note = deliberate mutation — the `judged` accumulator is appended in the
 *         sequential await loop; scoped to this function, never shared
 */
const judgeAllWindows = async (input: {
  windows: ReflectOnReviewSelfWindow[];
  judge: ReviewSelfJudge;
}): Promise<ReflectOnReviewSelfWindow[]> => {
  const judged: ReflectOnReviewSelfWindow[] = [];
  for (const window of input.windows) {
    const verdict = await input.judge({ window });
    judged.push(new ReflectOnReviewSelfWindow({ ...window, verdict }));
  }
  return judged;
};
