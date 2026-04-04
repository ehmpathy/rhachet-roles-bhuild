/**
 * .what = configuration and utilities for behavior size levels
 *
 * .why  = single source of truth for which templates belong to each size level.
 *         type derived from config keys ensures compiler-enforced completeness.
 */

/**
 * .what = config for behavior size levels
 *
 * .why  = single source of truth:
 *         - type derived from keys (can't have type without config entry)
 *         - order encoded in config (no separate array to maintain)
 *         - adds array defines which templates this size contributes
 *
 * .note = sizes are cumulative: mini includes nano + mini adds, etc.
 *         giga is reserved for future decomposition subroutes.
 */
const BEHAVIOR_SIZE_CONFIG = {
  nano: {
    order: 0,
    adds: [
      '0.wish.md',
      'refs/template.[feedback].v1.[given].by_human.md',
      '1.vision.stone',
      '1.vision.guard', // .light or .heavy variant
      '5.1.execution.from_vision.v1.stone', // vision → done (no blueprint/roadmap)
      '5.1.execution.from_vision.v1.guard',
      '5.3.verification.v1.stone', // tests should never be forgotten
      '5.3.verification.v1.guard',
    ],
    dels: [],
  },
  mini: {
    order: 1,
    adds: [
      '2.1.criteria.blackbox.stone',
      '2.1.criteria.blackbox.guard', // .heavy only (light has no criteria guard)
      '2.2.criteria.blackbox.matrix.stone',
      '3.1.3.research.internal.product.code.prod._.v1.stone',
      '3.1.3.research.internal.product.code.test._.v1.stone',
      '3.3.1.blueprint.product.v1.stone',
      '3.3.1.blueprint.product.v1.guard', // .light or .heavy variant
      '4.1.roadmap.v1.stone',
      '5.1.execution.phase0_to_phaseN.v1.stone', // roadmap → phased execution
      '5.1.execution.phase0_to_phaseN.v1.guard',
    ],
    dels: [
      '5.1.execution.from_vision.v1.stone', // replaced by phased version
      '5.1.execution.from_vision.v1.guard',
    ],
  },
  medi: {
    order: 2,
    adds: [
      '2.3.criteria.blueprint.stone',
      '3.1.1.research.external.product.access._.v1.stone',
      '3.1.1.research.external.product.claims._.v1.stone',
      '3.1.5.research.reflection.product.premortem._.v1.stone',
      '3.1.5.research.reflection.product.rootcause._.v1.stone',
      '3.1.5.research.reflection.product.audience._.v1.stone',
      '3.2.distill.repros.experience._.v1.stone',
      '3.2.distill.repros.experience._.v1.guard',
      '5.2.evaluation.v1.stone',
      '5.2.evaluation.v1.guard',
      '5.5.playtest.v1.stone',
      '5.5.playtest.v1.guard',
    ],
    dels: [],
  },
  mega: {
    order: 3,
    adds: [
      '3.1.1.research.external.product.domain._.v1.stone',
      '3.1.1.research.external.product.domain.terms.v1.stone',
      '3.1.1.research.external.product.references._.v1.stone',
      '3.1.2.research.external.factory.testloops._.v1.stone',
      '3.1.2.research.external.factory.oss.levers._.v1.stone',
      '3.1.2.research.external.factory.templates._.v1.stone',
      '3.1.4.research.internal.factory.blockers._.v1.stone',
      '3.1.4.research.internal.factory.opports._.v1.stone',
      '3.2.distill.domain._.v1.stone',
      '3.2.distill.domain._.v1.guard',
      '3.2.distill.factory.upgrades._.v1.stone',
      '3.3.0.blueprint.factory.v1.stone',
    ],
    dels: [],
  },
  giga: {
    order: 4,
    adds: [], // same as mega; reserved for future decomposition subroutes
    dels: [],
  },
} as const satisfies Record<
  string,
  { order: number; adds: readonly string[]; dels: readonly string[] }
>;

// type derived from config keys - compiler enforces completeness
export type BehaviorSizeLevel = keyof typeof BEHAVIOR_SIZE_CONFIG;

// order derived from config - no separate array to maintain
const BEHAVIOR_SIZE_ORDER = (
  Object.keys(BEHAVIOR_SIZE_CONFIG) as BehaviorSizeLevel[]
).sort((a, b) => BEHAVIOR_SIZE_CONFIG[a].order - BEHAVIOR_SIZE_CONFIG[b].order);

/**
 * .what = get all templates for a given size level (cumulative)
 *
 * .why  = sizes are additive: mini = nano + mini adds, medi = nano + mini + medi adds, etc.
 *         dels allow larger sizes to replace smaller size templates (e.g., mini replaces
 *         nano's from_vision execution with phased execution)
 */
export const getAllTemplatesBySize = (input: {
  size: BehaviorSizeLevel;
}): string[] => {
  const index = BEHAVIOR_SIZE_ORDER.indexOf(input.size);
  const sizesUpTo = BEHAVIOR_SIZE_ORDER.slice(0, index + 1);

  const adds = sizesUpTo.flatMap((s) => BEHAVIOR_SIZE_CONFIG[s].adds);
  const dels: readonly string[] = sizesUpTo.flatMap(
    (s) => BEHAVIOR_SIZE_CONFIG[s].dels,
  );

  return adds.filter((t) => !dels.includes(t));
};

/**
 * .what = check if a template is included in a given size level
 *
 * .why  = used to filter templates in behavior initialization
 *
 * .note = handles guard variants: '1.vision.guard' matches '1.vision.guard.light'
 */
export const isTemplateInSize = (input: {
  templateName: string;
  size: BehaviorSizeLevel;
}): boolean => {
  const templates = getAllTemplatesBySize({ size: input.size });

  // direct match
  if (templates.includes(input.templateName)) {
    return true;
  }

  // check for guard variant match (e.g., '1.vision.guard.light' matches '1.vision.guard')
  const baseName = input.templateName.replace(/\.(light|heavy)$/, '');
  if (baseName !== input.templateName && templates.includes(baseName)) {
    return true;
  }

  return false;
};

// export config for test assertions
export { BEHAVIOR_SIZE_CONFIG, BEHAVIOR_SIZE_ORDER };
