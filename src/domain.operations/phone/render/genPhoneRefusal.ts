import { ConstraintError } from 'helpful-errors';

import { asPhoneTreeLines, type PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = a caller-fixable phone refusal, with the 🦫 vibe line its output leads with
 */
export type PhoneRefusal = ConstraintError & { phoneVibe: string };

/**
 * .what = builds a ConstraintError whose message is the headline plus a tree of the facts and fix
 * .why = every phone refusal reads the same way: a vibe line, a blank line, then
 *        `✋ ConstraintError: <headline>` with its tree — and it exits 2. the fix rides in the
 *        message, never in metadata, since helpful-errors prints metadata as a raw json block
 */
export const genPhoneRefusal = (input: {
  vibe: string;
  headline: string;
  nodes: PhoneTreeNode[];
}): PhoneRefusal => {
  const message = [
    input.headline,
    ...asPhoneTreeLines({ nodes: input.nodes }),
  ].join('\n');
  return Object.assign(new ConstraintError(message), {
    phoneVibe: input.vibe,
  });
};
