import type { RadioPermissionDecision } from '../../../domain.objects/RadioPermissions';
import { computeRadioUsagePermissionDecision } from './computeRadioUsagePermissionDecision';
import { extractOrgFromRepo } from './extractOrgFromRepo';
import { getAllRadioUsagePermissions } from './getAllRadioUsagePermissions';

/**
 * .what = get permission decision for radio usage
 * .why = orchestrates state load + precedence computation for push gate
 */
export const getOneRadioUsagePermissionDecision = async (
  input: {
    targetRepo: string;
    sourceCwd: string | null;
  },
  context: {
    homeDir?: string;
  } = {},
): Promise<RadioPermissionDecision> => {
  // extract target org from repo
  const targetOrg = extractOrgFromRepo({ repo: input.targetRepo });

  // load permission states
  const states = await getAllRadioUsagePermissions(
    { cwd: input.sourceCwd ?? process.cwd() },
    context,
  );

  // compute decision
  return computeRadioUsagePermissionDecision({
    global: states.global,
    org: states.org,
    local: states.local,
    targetOrg,
  });
};
