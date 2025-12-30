import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import { assignBehaviorMeasuredPriority } from './assignBehaviorMeasuredPriority';
import { computeBehaviorMeasuredCostComposite } from './computeBehaviorMeasuredCostComposite';
import { computeBehaviorMeasuredGainComposite } from './computeBehaviorMeasuredGainComposite';
import { imagineBehaviorMeasuredCostAttend } from './imagineBehaviorMeasuredCostAttend';
import { imagineBehaviorMeasuredCostExpend } from './imagineBehaviorMeasuredCostExpend';
import { imagineBehaviorMeasuredGainLeverage } from './imagineBehaviorMeasuredGainLeverage';
import { imagineBehaviorMeasuredGainYieldage } from './imagineBehaviorMeasuredGainYieldage';

/**
 * .what = computes full measurement for a single behavior
 * .why = enables prioritization by effect = gain - cost
 *
 * @note uses brain.repl.imagine via suboperations for creative inference
 * @note composites are computed deterministically
 */
export const getOneBehaviorMeasured = async (
  input: {
    gathered: BehaviorGathered;
    deptraced: BehaviorDeptraced;
    basket: BehaviorGathered[];
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorMeasured> => {
  // extract config values with defaults
  const leverageWeights = context.config.criteria.gain?.leverage?.weights ?? {
    author: 0.5,
    support: 0.5,
  };
  const convertEquate = context.config.criteria.convert?.equate ?? {
    cash: { dollars: 150 },
    time: { hours: 1 },
  };
  const hourlyRate = convertEquate.cash.dollars / convertEquate.time.hours;
  const costHorizon = context.config.cost?.horizon ?? 24;

  // imagine all dimensions in parallel (brain.repl.imagine)
  const [leverage, yieldage, attend, expend] = await Promise.all([
    imagineBehaviorMeasuredGainLeverage(
      {
        gathered: input.gathered,
        deptraced: input.deptraced,
        basket: input.basket,
        config: { weights: leverageWeights },
      },
      context,
    ),
    imagineBehaviorMeasuredGainYieldage(
      {
        gathered: input.gathered,
        deptraced: input.deptraced,
        basket: input.basket,
        config: {
          defaults: { baseYieldage: 500, transitiveMultiplier: 0.3 },
        },
      },
      context,
    ),
    imagineBehaviorMeasuredCostAttend(
      {
        gathered: input.gathered,
        config: { cost: { horizon: costHorizon } },
      },
      context,
    ),
    imagineBehaviorMeasuredCostExpend(
      {
        gathered: input.gathered,
        config: { cost: { horizon: costHorizon } },
      },
      context,
    ),
  ]);

  // compute composite gain (deterministic)
  const gain = computeBehaviorMeasuredGainComposite({
    leverage,
    yieldage,
    config: { hourlyRate },
  });

  // compute composite cost (deterministic)
  const cost = computeBehaviorMeasuredCostComposite({
    attend,
    expend,
    config: { hourlyRate },
  });

  // compute effect = gain - cost
  const effect = gain.composite - cost.composite;

  // assign priority based on effect
  const priority = assignBehaviorMeasuredPriority({ effect });

  // construct measured entity
  return new BehaviorMeasured({
    measuredAt: new Date().toISOString(),
    gathered: {
      behavior: input.gathered.behavior,
      contentHash: input.gathered.contentHash,
    },
    gain,
    cost,
    effect,
    priority,
  });
};

/**
 * .what = computes full measurement for all behaviors
 * .why = enables batch processing of the entire behavior basket
 */
export const getAllBehaviorMeasured = async (
  input: {
    gatheredBasket: BehaviorGathered[];
    deptracedBasket: BehaviorDeptraced[];
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorMeasured[]> => {
  const measured: BehaviorMeasured[] = [];

  for (const gathered of input.gatheredBasket) {
    // find corresponding deptraced
    const deptraced = input.deptracedBasket.find(
      (d) =>
        d.gathered.behavior.name === gathered.behavior.name &&
        d.gathered.contentHash === gathered.contentHash,
    );

    if (!deptraced) {
      context.log.warn('missing deptraced for gathered behavior', {
        behavior: gathered.behavior.name,
      });
      continue;
    }

    const result = await getOneBehaviorMeasured(
      {
        gathered,
        deptraced,
        basket: input.gatheredBasket,
      },
      context,
    );

    measured.push(result);
  }

  // sort by effect descending (highest effect first)
  measured.sort((a, b) => b.effect - a.effect);

  return measured;
};
