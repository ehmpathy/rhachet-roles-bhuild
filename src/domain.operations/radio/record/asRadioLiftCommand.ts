import type { RadioPermissionDecision } from '@src/domain.objects/RadioPermissions';

/**
 * .what = the command a human runs to open a shut radio gate
 * .why = a held task names who can lift its gate, at the level that shut it
 *
 * .note = an org-level block (specific or @all) lifts via the target's own org,
 *         the narrowest grant that opens it (a specific org outranks @all)
 */
export const asRadioLiftCommand = (input: {
  level: RadioPermissionDecision['level'];
  owner: string;
}): string => {
  if (input.level === 'global') return 'rhx radio.uses --global allow';
  if (input.level === 'org') return `rhx radio.uses --org ${input.owner} allow`;
  return 'rhx radio.uses allow';
};
