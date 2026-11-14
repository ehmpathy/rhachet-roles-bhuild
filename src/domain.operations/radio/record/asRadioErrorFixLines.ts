import { asRadioErrorHeadline } from './asRadioErrorHeadline';
import { asRadioErrorHintLines } from './asRadioErrorHintLines';

/**
 * .what = the headline and hint lines a held write's `fix it:` branch shows for a fault
 * .why = an exec failure leads with `Command failed: <the command>`, which names our own call and
 *        a temp path, not what went wrong; the upstream's own first line under it is the headline
 *        a human can act on, as the queue's fault line already reads (asRadioFaultDetailLine)
 *
 * .note = any other message keeps its first line as the headline, class header and all
 */
export const asRadioErrorFixLines = (input: {
  message: string;
}): { headline: string; hints: string[] } => {
  // an exec header with an upstream line beneath it: promote the upstream line
  const lines = input.message.split('\n');
  const isExecHeader = (lines[0] ?? '').includes('Command failed:');
  const indexUpstream = lines.findIndex(
    (line, index) => index > 0 && line.trim().length > 0,
  );
  if (isExecHeader && indexUpstream > 0) {
    const rest = lines.slice(indexUpstream);
    return {
      headline: rest[0]!.trim(),
      hints: asRadioErrorHintLines({ message: rest.join('\n') }),
    };
  }

  // all else: the first line leads, the body follows as hints
  return {
    headline: asRadioErrorHeadline(input),
    hints: asRadioErrorHintLines(input),
  };
};
