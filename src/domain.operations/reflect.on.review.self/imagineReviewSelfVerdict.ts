import type { BrainAtom, ContextBrain } from 'rhachet/brains';
import { z } from 'zod';

import type { ReflectOnReviewSelfFileTouch } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfFileTouch';
import { ReflectOnReviewSelfVerdict } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfVerdict';
import type { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

/**
 * .what = the max number of file touches to render in the prompt
 * .why = a review that touched dozens of files would overrun the cheap brain's
 *        budget; the first files carry the signal, the rest fold into a `+N more`
 */
const MAX_FILES_SHOWN = 12;

/**
 * .what = the structured output shape the brain returns for a verdict
 * .why = a schema keeps the brain's answer parseable and grounded
 */
const schemaOfVerdict = z.object({
  label: z.enum(['genuine-gain', 'genuine-noop', 'feigned-noop']),
  reason: z.string(),
});

/**
 * .what = ask the cheap brain to label one self-review window's utility
 * .why = the interpretive layer atop deterministic signals — it distinguishes a
 *        genuine-noop ("looked, found no gap") from a feigned-noop ("did not
 *        truly look"), the one call determinism cannot cleanly draw
 *
 * @param window - the reconstructed window, with its deterministic signals
 * @param context - a brain context bound (via choice) to the cheap judge atom
 */
export const imagineReviewSelfVerdict = async (
  input: { window: ReflectOnReviewSelfWindow },
  context: ContextBrain<BrainAtom>,
): Promise<ReflectOnReviewSelfVerdict> => {
  const prompt = asVerdictPrompt({ window: input.window });

  const { output } = await context.brain.choice.ask({
    role: { briefs: [] },
    prompt,
    schema: { output: schemaOfVerdict },
  });

  return new ReflectOnReviewSelfVerdict({ label: output.label, reason: output.reason });
};

/**
 * .what = build the judge prompt from a window's distilled experience
 * .why = the brain grades the review's ACTUAL work — the articulation it wrote, the
 *        files it changed and how, how long it took — not four compressed scalars.
 *        the articulation text is the single most decisive piece of evidence for
 *        whether the review was real or a rubber-stamp
 */
const asVerdictPrompt = (input: { window: ReflectOnReviewSelfWindow }): string => {
  const { window } = input;
  const { experience } = window;
  return [
    'you assess whether a self-review actually did useful work or just rubber-stamped.',
    '',
    `the self-review slug is "${window.slug}" on stone "${window.stone}".`,
    '',
    'this is what the reviewer wrote as its articulation (its critique of the work):',
    '"""',
    experience.articulation ?? '(no articulation was written)',
    '"""',
    '',
    `it spent ${asDurationPhrase({ durationMs: experience.durationMs })} on the review.`,
    '',
    'the artifact files it touched in the review:',
    ...asFileLines({ files: experience.files }),
    '',
    'classify the review into exactly one label:',
    '- "genuine-gain": the review led to a real upgrade (a substantive critique followed by real edits)',
    '- "genuine-noop": the review looked carefully but correctly found no gap (a substantive critique that reasoned the work was already right, so no edits)',
    '- "feigned-noop": the review promised without a real review (an empty or thin articulation that restates the task, no meaningful edits)',
    '',
    'weigh the ARTICULATION most: a real critique names specifics and reasons; a rubber-stamp',
    'restates the prompt or says "looks good". reply with the label and a one-line reason.',
  ].join('\n');
};

/**
 * .what = render each touched file as a `[mode] path` line, with its diff excerpt
 * .why = the per-file mode + diff shows the brain WHAT changed; the list is capped
 *        so a review that touched many files does not overrun the budget
 */
const asFileLines = (input: { files: ReflectOnReviewSelfFileTouch[] }): string[] => {
  if (input.files.length === 0) return ['- (no artifact files touched)'];

  const shown = input.files.slice(0, MAX_FILES_SHOWN);
  const overflow = input.files.length - shown.length;

  const lines = shown.map((file) => {
    const head = `- [${file.mode}] ${file.path}`;
    if (file.diff === null) return head;
    return `${head}\n    ${file.diff.replace(/\n/g, '\n    ')}`;
  });

  if (overflow > 0) lines.push(`- (+${overflow} more files)`);
  return lines;
};

/**
 * .what = a human phrase for the review duration, or an unknown marker
 * .why = an instant promise is a tell; a multi-minute review reads as real work
 */
const asDurationPhrase = (input: { durationMs: number | null }): string => {
  if (input.durationMs === null) return 'an unknown amount of time';
  const seconds = Math.round(input.durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
};
