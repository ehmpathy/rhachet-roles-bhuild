/**
 * .what = the tree that names each kept guard which lacks a review its template holds
 * .why  = a findsert skip reads as success. this makes it loud, and prints the command that
 *         adopts the absent reviews, so a route in flight can choose to take them
 */
export const computeGuardsStaleOutput = (input: {
  guardsStale: Array<{ guard: string; slugsAbsent: string[] }>;
  behaviorDirRel: string;
}): string | null => {
  // a route whose guards are current owes no notice
  if (input.guardsStale.length === 0) return null;

  // one branch per stale guard: what it lacks, and how to adopt it
  const branches = input.guardsStale.flatMap(
    ({ guard, slugsAbsent }, index) => {
      const isLast = index === input.guardsStale.length - 1;
      const stem = isLast ? '   ' : '│  ';
      const stone = guard.replace(/\.guard$/, '');
      return [
        `   ${isLast ? '└─' : '├─'} ${guard}`,
        `   ${stem}├─ lacks: ${slugsAbsent.join(', ')}`,
        `   ${stem}└─ adopt: rhx route.guard.upgrade --stone ${stone} --route ${input.behaviorDirRel}`,
      ];
    },
  );

  // one stale guard reads singular; the count stays a digit either way
  const count = input.guardsStale.length;
  const subject =
    count === 1
      ? 'kept guard lacks reviews its template holds'
      : 'kept guards lack reviews their templates hold';
  return [`🟡 ${count} ${subject}`, ...branches].join('\n');
};
