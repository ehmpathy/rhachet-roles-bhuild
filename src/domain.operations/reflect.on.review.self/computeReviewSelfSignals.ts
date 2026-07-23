import type { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';
import { ReflectOnReviewSelfSignals } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfSignals';

import { asRouteStoneSetBoundary } from './asRouteStoneSetBoundary';

/**
 * .what = one tool_use invocation from a transcript event
 * .why = the unit each deterministic signal is derived from
 */
type ToolUse = ClaudeTranscriptEvent['toolUses'][number];

/**
 * .what = tool names that count as a file edit
 * .why = a real review that upgrades an artifact leaves an edit behind
 */
const EDIT_TOOL_NAMES = ['Edit', 'Write', 'NotebookEdit'];

/**
 * .what = the path segment that marks a self-review articulation file
 * .why = each promised review is REQUIRED to write its articulation to
 *        `<route>/review/self/…`; that mandatory write is not artifact work.
 *        when tallied as an edit it saturates editCount to ~100% and destroys
 *        the signal, so the reflection excludes it (and any re-read of it) and
 *        measures only edits to the reviewed artifact
 */
const SELF_REVIEW_ARTICULATION_DIR = '/review/self/';

/**
 * .what = compute the deterministic signals for one self-review window
 * .why = these signals are the trustworthy backbone of the utility verdict —
 *        derived purely from the transcript, with no brain
 *
 * @param events - the transcript events strictly within the window
 * @param route - the route dir the review belongs to (for the read signal)
 */
export const computeReviewSelfSignals = (input: {
  events: ClaudeTranscriptEvent[];
  route: string;
}): ReflectOnReviewSelfSignals => {
  // flatten every tool_use across the window's events
  const toolUses = input.events.flatMap((event) => event.toolUses);

  return new ReflectOnReviewSelfSignals({
    editCount: toolUses.filter((toolUse) => isArtifactEditToolUse({ toolUse }))
      .length,
    bashCount: toolUses.filter(isNonBoundaryBashToolUse).length,
    readReviewedArtifact: toolUses.some((toolUse) =>
      isRouteArtifactReadToolUse({ toolUse, route: input.route }),
    ),
    articulationChars: computeArticulationChars({ events: input.events }),
  });
};

/**
 * .what = whether a tool_use edits an ARTIFACT (not the articulation file)
 * .why = the mandatory self-review articulation write happens for every promised
 *        review, so it makes editCount a constant rather than a signal; only edits
 *        to the reviewed artifact reveal whether the review changed real work
 */
const isArtifactEditToolUse = (input: { toolUse: ToolUse }): boolean => {
  if (!EDIT_TOOL_NAMES.includes(input.toolUse.name)) return false;
  const path = asEditToolUsePath({ toolUse: input.toolUse });
  // a pathless edit can't be proven to be the articulation, so it still counts
  if (path === null) return true;
  return !isReviewSelfArticulationPath({ path });
};

/**
 * .what = the target file path of an edit tool_use, across its input shapes
 * .why = Edit/Write carry `file_path`; NotebookEdit carries `notebook_path`
 */
const asEditToolUsePath = (input: { toolUse: ToolUse }): string | null =>
  asStringInput({ input: input.toolUse.input, key: 'file_path' }) ??
  asStringInput({ input: input.toolUse.input, key: 'notebook_path' });

/**
 * .what = whether a path points at a self-review articulation file
 * .why = the articulation lives under `<route>/review/self/`; edits and reads
 *        there are the promise ritual, not work on the reviewed artifact
 */
const isReviewSelfArticulationPath = (input: { path: string }): boolean =>
  input.path.includes(SELF_REVIEW_ARTICULATION_DIR);

/**
 * .what = whether a tool_use is a Bash run that is not a route.stone.set boundary
 * .why = boundary commands drive the review flow; they are not review work
 */
const isNonBoundaryBashToolUse = (toolUse: ToolUse): boolean => {
  if (toolUse.name !== 'Bash') return false;
  const command = asStringInput({ input: toolUse.input, key: 'command' });
  if (command === null) return true;
  return asRouteStoneSetBoundary({ command }) === null;
};

/**
 * .what = whether a tool_use is a Read of an artifact under the review's route
 * .why = a read of the reviewed artifact is the "it actually looked" signal
 */
const isRouteArtifactReadToolUse = (input: {
  toolUse: ToolUse;
  route: string;
}): boolean => {
  if (input.toolUse.name !== 'Read') return false;
  const filePath = asStringInput({
    input: input.toolUse.input,
    key: 'file_path',
  });
  if (filePath === null) return false;

  // a read of the articulation file is not a read of the reviewed artifact
  if (isReviewSelfArticulationPath({ path: filePath })) return false;

  return filePath.includes(input.route);
};

/**
 * .what = total assistant text volume across the window
 * .why = articulation substance separates a real critique from a one-line promise
 */
const computeArticulationChars = (input: {
  events: ClaudeTranscriptEvent[];
}): number =>
  input.events
    .filter((event) => event.role === 'assistant' && event.text !== null)
    .reduce((sum, event) => sum + (event.text?.length ?? 0), 0);

/**
 * .what = read a string value from a tool_use input record, or null
 * .why = tool inputs are untyped records; this narrows one field safely
 */
const asStringInput = (input: {
  input: Record<string, unknown>;
  key: string;
}): string | null => {
  const value = input.input[input.key];
  return typeof value === 'string' ? value : null;
};
