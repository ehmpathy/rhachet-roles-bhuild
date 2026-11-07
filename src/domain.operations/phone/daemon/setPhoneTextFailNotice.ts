import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { basename } from 'path';

import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { asPhoneTextFailNotice } from '../render/asPhoneTextFailNotice';
import { getOnePhoneTreeDir } from '../tree/getOnePhoneTreeDir';
import { asPhoneSayOutcome } from './asPhoneSayOutcome';
import type { PhoneDaemonContext } from './PhoneDaemonContext';

/**
 * .what = says a failure notice into the sender's own clone, in the sender's own tree
 * .why = a REFUSED or FAULTED text must be loud; the record already holds the truth, so a notice
 *        that can not land, or whose say can not run at all, is logged and never retried
 * .note = a sender on another grove is told by the mirror alone: its thread reads the fate, and
 *         no say crosses a grove
 */
export const setPhoneTextFailNotice = async (
  input: { record: PhoneTextRecord; treeDir: string },
  context: PhoneDaemonContext,
): Promise<void> => {
  const treeSelf = basename(input.treeDir);
  const from = asPhoneAddressFromInput({
    raw: input.record.from,
    self: { grove: context.groveSelf, tree: treeSelf },
  });

  // a sender on another grove reads the fate in its thread
  if (from.grove !== context.groveSelf) {
    context.log(
      `notice for text ${input.record.uuid} not said: ${input.record.from} is on another grove; its thread holds the fate`,
    );
    return;
  }

  // the sender's own tree, where its pane lives
  const senderTreeDir = await getOnePhoneTreeDir(
    { tree: from.tree, treeDirSelf: input.treeDir, treeSelf },
    context,
  ).catch((error: unknown) => {
    // a tree two dirs answer to is a refusal; the notice is logged, never a crash
    if (!(error instanceof ConstraintError)) throw error;
    return null;
  });
  if (!senderTreeDir) {
    context.log(
      `notice for text ${input.record.uuid} not said: no tree ${from.tree} here`,
    );
    return;
  }

  const raw = await context.sdkClone
    .say({
      treeDir: senderTreeDir,
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
