import { MalfunctionError } from 'helpful-errors';

import { asPhoneTreeLines, type PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = a system-side phone fault, with the 🦫 vibe line its output leads with
 */
export type PhoneMalfunction = MalfunctionError & { phoneVibe: string };

/**
 * .what = builds a MalfunctionError whose message is the headline plus a tree of the facts and cure
 * .why = a phone malfunction reads as its refusals do: a vibe line, a blank line, then
 *        `💥 MalfunctionError: <headline>` with its tree — and it exits 1. the cure rides in the
 *        message, never in metadata, since helpful-errors prints metadata as a raw json block
 */
export const genPhoneMalfunction = (input: {
  vibe: string;
  headline: string;
  nodes: PhoneTreeNode[];
}): PhoneMalfunction => {
  const message = [
    input.headline,
    ...asPhoneTreeLines({ nodes: input.nodes }),
  ].join('\n');
  return Object.assign(new MalfunctionError(message), {
    phoneVibe: input.vibe,
  });
};
