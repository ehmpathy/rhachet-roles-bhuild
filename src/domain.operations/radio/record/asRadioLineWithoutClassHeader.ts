/**
 * .what = a line with its `✋ ConstraintError:` / `💥 MalfunctionError:` prefix cut off
 * .why = a held row labels its line (`fault:`, `fix it:`); a class header after the label reads
 *        as a second error and drags an emoji into the tree, so every label shows the bare message
 */
export const asRadioLineWithoutClassHeader = (input: {
  line: string;
}): string => input.line.replace(/^(✋|💥)\s+\w+Error:\s*/u, '');
