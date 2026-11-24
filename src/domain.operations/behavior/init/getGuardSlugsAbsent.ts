/**
 * .what = the review slugs a guard template holds that an extant guard lacks
 * .why  = a re-init keeps an extant guard (findsert), so a template's new reviews never reach
 *         a route in flight. the absent slugs make that skip visible, and name what an upgrade adds
 */
export const getGuardSlugsAbsent = (input: {
  template: string;
  extant: string;
}): string[] => {
  const slugsExtant = new Set(asGuardSlugs({ guard: input.extant }));
  return asGuardSlugs({ guard: input.template }).filter(
    (slug) => !slugsExtant.has(slug),
  );
};

/**
 * .what = every `- slug: x` a guard declares, self and peer alike, in order
 * .why  = a guard names each review by its slug, one per line
 */
const asGuardSlugs = (input: { guard: string }): string[] =>
  [...input.guard.matchAll(/^\s*-\s*slug:\s*(\S+)\s*$/gm)].map(
    (match) => match[1]!,
  );
