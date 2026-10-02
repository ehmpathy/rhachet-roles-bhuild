import type { RadioPermissionDecision } from '@src/domain.objects/RadioPermissions';

/**
 * .what = the reason a held record names for the radio.uses gate that shut it
 * .why = the human must see which gate shut: an @all block reads apart from a
 *        specific-org block, since each lifts a different way
 */
export const asRadioGateBlockedReason = (input: {
  gate: RadioPermissionDecision;
}): string => {
  const isAllOrgs = input.gate.reason.startsWith('@all');
  return `radio.uses:blocked — ${isAllOrgs ? '@all' : input.gate.level}`;
};
