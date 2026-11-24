/**
 * .what = the tree that names each kept stone whose text differs from its template
 * .why  = a findsert skip reads as success, so a route in flight never learns its stone
 *         changed upstream. a stone holds no review slugs to diff, so the drift is named whole
 */
export const computeStonesStaleOutput = (input: {
  stonesStale: string[];
  behaviorDirRel: string;
}): string | null => {
  // a route whose stones are current owes no notice
  if (input.stonesStale.length === 0) return null;

  // one branch per stale stone, then the one way to adopt the template text
  const branches = input.stonesStale.map((stone) => `   ├─ ${stone}`);

  // a stone is edit-locked to the driver, so the adopt is a human grant, then a remove of each
  // drifted stone, then a re-init. a raw template copy would skip the $BEHAVIOR_DIR_REL fill,
  // so the re-init is the one write that yields the text this check compares against
  const removes = input.stonesStale.map(
    (stone) => `      ├─ rhx rmsafe --path ${input.behaviorDirRel}/${stone}`,
  );
  const adopt = [
    '   └─ adopt, by a human: the route seals its stones against a driver edit',
    `      ├─ rhx route.mutate grant allow --route ${input.behaviorDirRel}`,
    ...removes,
    '      └─ then re-run this same init.behavior; it writes each removed stone from its template',
  ];

  // one stale stone reads singular; the count stays a digit either way. a stone holds no
  // slugs to list, so the header says the drift is its whole text
  const count = input.stonesStale.length;
  const subject =
    count === 1
      ? 'kept stone drifted from its template, in its whole text'
      : 'kept stones drifted from their templates, in their whole text';
  return [`🟡 ${count} ${subject}`, ...branches, ...adopt].join('\n');
};
