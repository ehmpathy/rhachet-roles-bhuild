/**
 * .what = render branches (each with optional children) as treestruct lines
 * .why = the held and drain outputs share one tree shape; the corners are decode-friction
 *
 * .note = a child that spans lines (joined by newline) renders its extra lines on the
 *         child's rail, so an inner tree nests under the child rather than beside it
 */
export const asRadioTreeLines = (input: {
  branches: { line: string; children: string[] }[];
}): string[] =>
  input.branches.flatMap((branch, index) => {
    const isLast = index === input.branches.length - 1;
    const corner = isLast ? '└─' : '├─';
    const rail = isLast ? '   ' : '│  ';
    const children = branch.children.flatMap((child, childIndex) => {
      const isChildLast = childIndex === branch.children.length - 1;
      const [head, ...rest] = child.split('\n');
      const railChild = isChildLast ? '   ' : '│  ';
      return [
        `   ${rail}${isChildLast ? '└─' : '├─'} ${head}`,
        ...rest.map((line) => `   ${rail}${railChild}${line}`),
      ];
    });
    return [`   ${corner} ${branch.line}`, ...children];
  });
