import { basename } from 'path';

import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import type { PhoneContext } from '../PhoneContext';
import { getOnePhoneTreeDir } from '../tree/getOnePhoneTreeDir';
import { setPhoneTextOutMirrorOnDisk } from './setPhoneTextOutMirrorOnDisk';

/**
 * .what = carries the status and reason of an `in` copy onto the sender's `out` copy
 * .why = the receiver tree's daemon owns a text's fate; the sender reads that fate from its own
 *        thread, so each settle, and each new reason a text waits on, is mirrored back
 *
 * .note = a sender on this grove is reached on disk; a sender on another grove is reached through
 *         the grove connection. a mirror that can not land is logged, never thrown: the `in`
 *         copy holds the truth, and a lost mirror costs the sender a stale line, not a text
 * .note = the caller holds the claim on the `in` copy, the one point every status write passes
 */
export const setPhoneTextOutMirror = async (
  input: { record: PhoneTextRecord; treeDir: string },
  context: Pick<PhoneContext, 'gitRoot' | 'groveSelf' | 'sdkGrove'> & {
    log: (line: string) => void;
  },
): Promise<void> => {
  const { record } = input;
  const from = asPhoneAddressFromInput({
    raw: record.from,
    self: { grove: context.groveSelf, tree: basename(input.treeDir) },
  });

  // a sender on another grove: through the grove connection
  if (from.grove !== context.groveSelf) {
    await context.sdkGrove
      .call({
        grove: from.grove,
        tree: from.tree,
        verb: 'set',
        payload: {
          grove: from.grove,
          clone: from.clone,
          uuid: record.uuid,
          status: record.status,
          reason: record.reason,
        },
      })
      .catch((error: unknown) =>
        context.log(
          `mirror of text ${record.uuid} to ${record.from} not carried: ${String(error)}`,
        ),
      );
    return;
  }

  // a sender on this grove: on disk, in the sender seat's mailbox
  const senderTreeDir = await getOnePhoneTreeDir(
    {
      tree: from.tree,
      treeDirSelf: input.treeDir,
      treeSelf: basename(input.treeDir),
    },
    context,
  );
  if (!senderTreeDir) {
    context.log(`mirror of text ${record.uuid}: no tree ${from.tree} here`);
    return;
  }
  await setPhoneTextOutMirrorOnDisk({
    treeDir: senderTreeDir,
    clone: from.clone,
    uuid: record.uuid,
    status: record.status,
    reason: record.reason,
  });
};
