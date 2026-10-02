import type {
  RadioGlobalState,
  RadioLocalState,
  RadioOrgState,
} from '@src/domain.objects/RadioPermissions';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { computeRadioUsagePermissionDecision } from '@src/domain.operations/radio/permission/computeRadioUsagePermissionDecision';
import { extractOrgFromRepo } from '@src/domain.operations/radio/permission/extractOrgFromRepo';

import { asRadioLiftCommand } from './asRadioLiftCommand';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';

/**
 * .what = the command that lifts a held record's gate, or null when its gate is open
 * .why = the stop reminder names who frees each task; the gate states load once per
 *        reminder, so each record's gate is a pure read of them
 */
export const asRadioTaskRecordLift = (input: {
  record: RadioTaskRecord;
  states: {
    global: RadioGlobalState | null;
    org: RadioOrgState | null;
    local: RadioLocalState | null;
  };
}): string | null => {
  // read this record's gate from the loaded states
  const gate = computeRadioUsagePermissionDecision({
    ...input.states,
    targetOrg: extractOrgFromRepo({
      repo: asRadioTaskRepoSlug({ repo: input.record.repo }),
    }),
  });

  // an open gate needs no lift
  if (gate.allowed) return null;
  return asRadioLiftCommand({
    level: gate.level,
    owner: input.record.repo.owner,
  });
};
