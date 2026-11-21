import { asPhoneTreeLines, type PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = one phone skill output: a 🦫 vibe line, a blank line, then the 💧 root and its tree
 * .why = every phone view reads the radio's way — the vibe says what the call did, the tree says
 *        the facts — so one shape serves them all
 */
export const asPhoneOutput = (input: {
  vibe: string;
  root: string;
  nodes: PhoneTreeNode[];
}): string =>
  [
    `🦫 ${input.vibe}`,
    '',
    `💧 ${input.root}`,
    ...asPhoneTreeLines({ nodes: input.nodes }),
  ].join('\n');
