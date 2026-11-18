import { asCommentKeptNote } from './asCommentKeptNote';

/**
 * .what = format one delivered comment as tree-struct output
 * .why = a comment lands on a thread, not as a task, so it reads as the act and where it went
 *
 * .note = os.fileops has no url, so that line is left out there
 */
export const asCommentDetailOutput = (input: {
  label: string;
  url: string | null;
  via: string;
  outcome: 'posted' | 'kept';
  recorded: string;
}): string => {
  const outcomeLine =
    input.outcome === 'kept'
      ? `${input.label} (${asCommentKeptNote({ via: input.via })})`
      : input.label;
  return [
    `🎙️ ${input.outcome}: ${outcomeLine}`,
    ...(input.url !== null ? [`   ├─ url: ${input.url}`] : []),
    `   ├─ via: ${input.via}`,
    `   └─ recorded: ${input.recorded}`,
  ].join('\n');
};
