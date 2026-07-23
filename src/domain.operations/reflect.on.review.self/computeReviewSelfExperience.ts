import type { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';
import { ReflectOnReviewSelfExperience } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfFileTouch } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfFileTouch';

/**
 * .what = one tool_use invocation from a transcript event
 */
type ToolUse = ClaudeTranscriptEvent['toolUses'][number];

/**
 * .what = tool names that write a file (vs. read one)
 * .why = the touch mode is 'write' for these, 'read' for a Read
 */
const WRITE_TOOL_NAMES = ['Edit', 'Write', 'NotebookEdit'];

/**
 * .what = the path segment that marks the self-review articulation file
 * .why = the mandatory `<route>/review/self/…` write is captured as the
 *        experience's `articulation`, not as a file touch — so touches and
 *        the artifact-read signal both leave it out
 */
const SELF_REVIEW_ARTICULATION_DIR = '/review/self/';

/**
 * .what = the per-file diff length cap, in chars
 * .why = a single large edit must not blow the cheap brain's context budget;
 *        the head of the diff carries the intent, the tail is truncated
 */
const MAX_DIFF_CHARS = 1200;

/**
 * .what = distill the full experience of one self-review from its window events
 * .why = the scalar signals reveal behavior but discard the articulation FILE and
 *        the actual diffs — the evidence the apply-mode brain needs to grade whether
 *        the critique was real. this retains that evidence, purely and bounded
 *
 * @param events - the transcript events strictly within the review's window
 * @param route - the route dir the review belongs to (marks the articulation path)
 */
export const computeReviewSelfExperience = (input: {
  events: ClaudeTranscriptEvent[];
  route: string;
}): ReflectOnReviewSelfExperience => {
  const toolUses = input.events.flatMap((event) => event.toolUses);

  return new ReflectOnReviewSelfExperience({
    articulation: asArticulationContent({ toolUses }),
    durationMs: asWindowDurationMs({ events: input.events }),
    files: asArtifactFileTouches({ toolUses }),
  });
};

/**
 * .what = the content of the in-window articulation write, or null
 * .why = the articulation file is the review's real critique; its `content` is
 *        the single most decisive piece of evidence for the grade
 */
const asArticulationContent = (input: {
  toolUses: ToolUse[];
}): string | null => {
  const articulationWrite = input.toolUses.find((toolUse) => {
    if (toolUse.name !== 'Write') return false;
    const path = asToolUsePath({ toolUse });
    return path !== null && isArticulationPath({ path });
  });
  if (!articulationWrite) return null;
  return asStringInput({ input: articulationWrite.input, key: 'content' });
};

/**
 * .what = the wall-clock span of the window, in ms, or null
 * .why = a genuine review takes time; an instant promise is a tell. null when
 *        the boundary events carry no timestamp (older/partial transcripts)
 */
const asWindowDurationMs = (input: {
  events: ClaudeTranscriptEvent[];
}): number | null => {
  const stamps = input.events
    .map((event) => event.timestamp)
    .filter((stamp): stamp is string => stamp !== null)
    .map((stamp) => Date.parse(stamp))
    .filter((ms) => !Number.isNaN(ms));
  if (stamps.length < 2) return null;
  return Math.max(...stamps) - Math.min(...stamps);
};

/**
 * .what = one file touch per artifact tool_use, in event order
 * .why = the per-file mode + diff shows the brain WHAT the review changed; the
 *        articulation write is left out (it is captured as `articulation`)
 */
const asArtifactFileTouches = (input: {
  toolUses: ToolUse[];
}): ReflectOnReviewSelfFileTouch[] =>
  input.toolUses.flatMap((toolUse) => {
    if (!isArtifactFileToolUse({ toolUse })) return [];
    const path = asToolUsePath({ toolUse })!;
    return [
      new ReflectOnReviewSelfFileTouch({
        path,
        mode: WRITE_TOOL_NAMES.includes(toolUse.name) ? 'write' : 'read',
        diff: asToolUseDiff({ toolUse }),
      }),
    ];
  });

/**
 * .what = whether a tool_use is a read/edit/write of an artifact file
 * .why = only Read + the write tools touch a file; the articulation write and
 *        pathless tool_uses are left out of the file list
 */
const isArtifactFileToolUse = (input: { toolUse: ToolUse }): boolean => {
  const isFileTool =
    input.toolUse.name === 'Read' ||
    WRITE_TOOL_NAMES.includes(input.toolUse.name);
  if (!isFileTool) return false;
  const path = asToolUsePath({ toolUse: input.toolUse });
  if (path === null) return false;
  return !isArticulationPath({ path });
};

/**
 * .what = the bounded diff a write tool_use made, or null for a read
 * .why = Write carries `content`, Edit carries `old → new`; both are capped so a
 *        large change does not overrun the brain's budget
 */
const asToolUseDiff = (input: { toolUse: ToolUse }): string | null => {
  const { toolUse } = input;

  // a read makes no change
  if (toolUse.name === 'Read') return null;

  // a Write carries the whole written content
  if (toolUse.name === 'Write') {
    const content = asStringInput({ input: toolUse.input, key: 'content' });
    return content === null ? null : asBoundedDiff({ diff: content });
  }

  // a NotebookEdit carries the new cell source
  if (toolUse.name === 'NotebookEdit') {
    const source = asStringInput({ input: toolUse.input, key: 'new_source' });
    return source === null ? null : asBoundedDiff({ diff: source });
  }

  // an Edit carries an old → new pair
  const oldString = asStringInput({ input: toolUse.input, key: 'old_string' });
  const newString = asStringInput({ input: toolUse.input, key: 'new_string' });
  if (oldString === null && newString === null) return null;
  return asBoundedDiff({ diff: `${oldString ?? ''} → ${newString ?? ''}` });
};

/**
 * .what = cap a diff to MAX_DIFF_CHARS with a truncation marker
 * .why = the head of a diff carries the intent; the tail is dispensable and would
 *        only cost brain tokens
 */
const asBoundedDiff = (input: { diff: string }): string => {
  if (input.diff.length <= MAX_DIFF_CHARS) return input.diff;
  return `${input.diff.slice(0, MAX_DIFF_CHARS)}…(truncated)`;
};

/**
 * .what = whether a path points at a self-review articulation file
 * .why = the articulation lives under `<route>/review/self/`; touches there are
 *        the promise ritual, not work on the reviewed artifact
 */
const isArticulationPath = (input: { path: string }): boolean =>
  input.path.includes(SELF_REVIEW_ARTICULATION_DIR);

/**
 * .what = the target file path of a tool_use, across its input shapes
 * .why = Read/Edit/Write carry `file_path`; NotebookEdit carries `notebook_path`
 */
const asToolUsePath = (input: { toolUse: ToolUse }): string | null =>
  asStringInput({ input: input.toolUse.input, key: 'file_path' }) ??
  asStringInput({ input: input.toolUse.input, key: 'notebook_path' });

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
