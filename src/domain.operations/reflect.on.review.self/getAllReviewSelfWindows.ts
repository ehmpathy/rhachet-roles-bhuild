import type { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import {
  asRouteStoneSetBoundary,
  type RouteStoneSetBoundary,
} from './asRouteStoneSetBoundary';
import { computeReviewSelfExperience } from './computeReviewSelfExperience';
import { computeReviewSelfSignals } from './computeReviewSelfSignals';

/**
 * .what = a boundary marker paired with the transcript event index it sits at
 * .why = window bounds are computed from the ordered positions of boundaries
 */
interface BoundaryAtIndex {
  boundary: RouteStoneSetBoundary;
  eventIndex: number;
  transcriptPath: string;
}

/**
 * .what = reconstruct the chained self-review windows within one transcript
 * .why = the promise of review N closes N and starts N+1, so a review's window
 *        runs from the prior boundary (a `--as passed` trigger or the previous
 *        `--as promised`) to its own `--as promised`
 *
 * .scope = only init.behavior routes (route dir under `.behavior/`) are read;
 *          only `--as promised` boundaries (which carry a slug) become windows
 *
 * .note = abandoned reviews (triggered, never promised) carry no slug in the
 *         command stream, so they are not emitted in v1
 */
export const getAllReviewSelfWindows = (input: {
  events: ClaudeTranscriptEvent[];
}): ReflectOnReviewSelfWindow[] => {
  // collect every route.stone.set boundary, in event order, for behavior routes
  const boundaries = getAllBoundariesInOrder({ events: input.events });

  // keep only the first `--as promised` per (route, stone, slug) — each is one review
  const reviewClosers = getFirstPromisedBoundaries({ boundaries });

  // reconstruct each review's window from its closer + the ordered boundaries
  return reviewClosers.map((closer) =>
    asReflectOnReviewSelfWindow({ closer, boundaries, events: input.events }),
  );
};

/**
 * .what = a boundary tagged with its position in the ordered boundary list
 * .why = the window start lookup needs the closer's index among all boundaries
 */
interface BoundaryCloser {
  boundary: BoundaryAtIndex;
  boundaryIndex: number;
}

/**
 * .what = the first `--as promised` boundary per (route, stone, slug)
 * .why = later attempts of the same slug are blocked retries (wrong path,
 *        stillness nudge) — the review work sits in the first attempt's window,
 *        so we keep the first and drop the rest
 */
const getFirstPromisedBoundaries = (input: {
  boundaries: BoundaryAtIndex[];
}): BoundaryCloser[] => {
  const seen = new Set<string>();
  return input.boundaries
    .map((boundary, boundaryIndex) => ({ boundary, boundaryIndex }))
    .filter(({ boundary }) => isPromisedReviewBoundary({ boundary }))
    .filter(({ boundary }) => isFirstOfItsReview({ boundary, seen }));
};

/**
 * .what = whether a boundary is a `--as promised` that carries a review slug
 * .why = only slug-bearing promise boundaries close a self-review window
 */
const isPromisedReviewBoundary = (input: {
  boundary: BoundaryAtIndex;
}): boolean =>
  input.boundary.boundary.as === 'promised' && !!input.boundary.boundary.slug;

/**
 * .what = whether this is the first appearance of its (route, stone, slug) review
 * .why = dedupes retry attempts of the same review down to the first
 *
 * .note = deliberate mutation — the `seen` set accumulates across the filter to
 *         mark each review key once; scoped to this dedupe pass
 */
const isFirstOfItsReview = (input: {
  boundary: BoundaryAtIndex;
  seen: Set<string>;
}): boolean => {
  const key = asReviewKey({ boundary: input.boundary });
  if (input.seen.has(key)) return false;
  input.seen.add(key);
  return true;
};

/**
 * .what = the identity key of a review — its route, stone, and slug
 * .why = the unit of dedupe: retries share this key with their first attempt
 */
const asReviewKey = (input: { boundary: BoundaryAtIndex }): string =>
  `${input.boundary.boundary.route}::${input.boundary.boundary.stone}::${input.boundary.boundary.slug}`;

/**
 * .what = build one self-review window from its `--as promised` boundary
 * .why = the window spans the prior boundary (trigger or prior promise) to this
 *        promise; its events feed the deterministic signal computation
 */
const asReflectOnReviewSelfWindow = (input: {
  closer: BoundaryCloser;
  boundaries: BoundaryAtIndex[];
  events: ClaudeTranscriptEvent[];
}): ReflectOnReviewSelfWindow => {
  const boundary = input.closer.boundary.boundary;

  // the window starts just after the prior boundary for the same route+stone
  const priorEventIndex = getPriorBoundaryEventIndex({
    boundaries: input.boundaries,
    currentBoundaryIndex: input.closer.boundaryIndex,
  });

  // the window events lie strictly between the prior boundary and this promise
  const windowEvents = input.events.slice(
    priorEventIndex + 1,
    input.closer.boundary.eventIndex,
  );

  return new ReflectOnReviewSelfWindow({
    slug: boundary.slug!,
    stone: boundary.stone,
    route: boundary.route,
    transcriptPath: input.closer.boundary.transcriptPath,
    signals: computeReviewSelfSignals({
      events: windowEvents,
      route: boundary.route,
    }),
    experience: computeReviewSelfExperience({
      events: windowEvents,
      route: boundary.route,
    }),
    verdict: null,
  });
};

/**
 * .what = collect all behavior-route boundaries in event order
 * .why = a single ordered list lets each promise find its prior boundary
 */
const getAllBoundariesInOrder = (input: {
  events: ClaudeTranscriptEvent[];
}): BoundaryAtIndex[] =>
  input.events.flatMap((event, eventIndex) =>
    event.toolUses.flatMap((toolUse) => {
      if (toolUse.name !== 'Bash') return [];
      const command =
        typeof toolUse.input.command === 'string'
          ? toolUse.input.command
          : null;
      if (!command) return [];

      const boundary = asRouteStoneSetBoundary({ command });
      if (!boundary) return [];

      // scope to init.behavior routes only
      if (!boundary.route.startsWith('.behavior/')) return [];

      return [{ boundary, eventIndex, transcriptPath: event.transcriptPath }];
    }),
  );

/**
 * .what = find the event index of the boundary that came before this promise
 *         for the same route+stone; falls back to -1 (window starts at event 0)
 * .why = the window start is the prior trigger or promise in the same review chain
 */
const getPriorBoundaryEventIndex = (input: {
  boundaries: BoundaryAtIndex[];
  currentBoundaryIndex: number;
}): number => {
  const current = input.boundaries[input.currentBoundaryIndex]!;

  // the nearest earlier boundary of the same route+stone bounds the window start
  const priorsSameChain = input.boundaries
    .slice(0, input.currentBoundaryIndex)
    .filter(
      (prior) =>
        prior.boundary.route === current.boundary.route &&
        prior.boundary.stone === current.boundary.stone,
    );
  const nearestPrior = priorsSameChain[priorsSameChain.length - 1];

  // no prior boundary in this transcript — start from the first event
  return nearestPrior ? nearestPrior.eventIndex : -1;
};
