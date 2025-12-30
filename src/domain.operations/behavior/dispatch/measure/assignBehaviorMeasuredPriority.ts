import type { BehaviorMeasuredPriorityLevel } from '../../../../domain.objects/BehaviorMeasured';

/**
 * .what = assigns priority level based on effect
 * .why = enables categorization for resource allocation
 *
 * priority levels:
 * - p0: critical, must do immediately (effect >= $10,000)
 * - p1: high priority, do soon (effect >= $2,000)
 * - p3: medium priority, do when possible (effect >= $500)
 * - p5: low priority, defer (effect < $500)
 */
export const assignBehaviorMeasuredPriority = (input: {
  effect: number;
  config?: {
    thresholds?: {
      p0: number;
      p1: number;
      p3: number;
    };
  };
}): BehaviorMeasuredPriorityLevel => {
  // default thresholds
  const thresholds = input.config?.thresholds ?? {
    p0: 10000,
    p1: 2000,
    p3: 500,
  };

  // assign based on effect thresholds
  if (input.effect >= thresholds.p0) return 'p0';
  if (input.effect >= thresholds.p1) return 'p1';
  if (input.effect >= thresholds.p3) return 'p3';

  return 'p5';
};
