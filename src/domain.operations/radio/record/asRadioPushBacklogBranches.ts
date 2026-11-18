import { asRadioBacklogBranch } from './asRadioBacklogBranch';
import { asRadioDrainSections } from './asRadioDrainSections';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the branches that report the backlog a push carried: each other record's fate, then
 *         the count left
 * .why = a push nudged for its promise still carried the rest of the line out; those fates must
 *        show beneath the nudge, or a delivered or held backlog record goes unseen
 *
 * .note = no others and no backlog → no branches, so a lone nudge prints alone
 */
export const asRadioPushBacklogBranches = (input: {
  others: RadioTaskRecordFate[];
  backlog: number;
}): { line: string; children: string[] }[] => {
  const sections = asRadioDrainSections({
    fates: input.others,
    authOverride: null,
  });
  const others = [...sections.drained, ...sections.closedOrHeld];
  if (others.length === 0 && input.backlog === 0) return [];
  return [...others, asRadioBacklogBranch({ backlog: input.backlog })];
};
