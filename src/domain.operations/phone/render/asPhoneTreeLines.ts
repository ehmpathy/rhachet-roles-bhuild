/**
 * .what = one node of a treestruct the phone prints
 * .note = `children` is absent on a leaf, the common case by far; a required `children: []` on
 *         every leaf literal would add noise to each render with no sense gained
 */
export interface PhoneTreeNode {
  text: string;
  children?: PhoneTreeNode[];
}

/**
 * .what = renders treestruct nodes as `├─` / `└─` branch lines under a root
 * .why = every phone output and refusal shares the radio's tree shape; one renderer keeps the
 *        branch glyphs and the `│` continuation consistent across them
 */
export const asPhoneTreeLines = (input: { nodes: PhoneTreeNode[] }): string[] =>
  asPhoneTreeLinesAtIndent({ nodes: input.nodes, indent: '   ' });

/**
 * .what = renders nodes at one indent, and their children one level deeper
 */
const asPhoneTreeLinesAtIndent = (input: {
  nodes: PhoneTreeNode[];
  indent: string;
}): string[] =>
  input.nodes.flatMap((node, index) => {
    const isLast = index === input.nodes.length - 1;
    const head = `${input.indent}${isLast ? '└─' : '├─'} ${node.text}`;
    const children = asPhoneTreeLinesAtIndent({
      nodes: node.children ?? [],
      indent: `${input.indent}${isLast ? '   ' : '│  '}`,
    });
    return [head, ...children];
  });
