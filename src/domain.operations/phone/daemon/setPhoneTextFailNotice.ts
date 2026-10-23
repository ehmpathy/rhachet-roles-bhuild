import { MalfunctionError } from 'helpful-errors';

import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { asPhoneTextFailNotice } from '../render/asPhoneTextFailNotice';
import { asPhoneSayOutcome } from './asPhoneSayOutcome';
import type { PhoneDaemonContext } from './PhoneDaemonContext';

/**
 * .what = says a failure notice into the sender's own clone
 * .why = a REFUSED or FAULTED text must be loud; the record already holds the truth, so a notice
 *        that can not land, or whose say can not run at all, is logged and never retried
 */
export const setPhoneTextFailNotice = async (
  input: { record: PhoneTextRecord; treeDir: string; treeSelf: string },
  context: PhoneDaemonContext,
): Promise<void> => {
  const from = asPhoneAddressFromInput({
    raw: input.record.from,
    self: { grove: context.groveSelf, tree: input.treeSelf },
  });
  const raw = await context.sdkClone
    .say({
      treeDir: input.treeDir,
      clone: from.clone,
      what: asPhoneTextFailNotice({ record: input.record }),
    })
    .catch((error: unknown) => {
      // a say that could not run is the one fault a notice absorbs; it is logged below
      if (!(error instanceof MalfunctionError)) throw error;
      return error;
    });
  if (raw instanceof MalfunctionError) {
    context.log(
      `notice for text ${input.record.uuid} not said to ${input.record.from}: ${raw.message}`,
    );
    return;
  }
  const outcome = asPhoneSayOutcome({ raw });
  if (outcome.status !== 'DELIVERED')
    context.log(
      `notice for text ${input.record.uuid} not said to ${input.record.from}: ${outcome.status} ${outcome.reason ?? ''}`,
    );
};
