import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

/**
 * .what = writes a mirrored status onto one `out` copy on this disk; a no-op if absent or equal
 * .why = the mirror on this grove, and the inbox verb `set` on a sender's grove, both run this
 *        one write, so the two legs can not drift
 */
export const setPhoneTextOutMirrorOnDisk = async (input: {
  treeDir: string;
  clone: string;
  uuid: string;
  status: PhoneTextRecord['status'];
  reason: string | null;
}): Promise<{ outcome: 'SET' | 'SAME' | 'ABSENT' }> => {
  const out = await daoPhoneMailbox.getOneByUuid({
    treeDir: input.treeDir,
    clone: input.clone,
    uuid: input.uuid,
    way: 'out',
  });
  if (!out) return { outcome: 'ABSENT' };
  if (out.record.status === input.status && out.record.reason === input.reason)
    return { outcome: 'SAME' };
  await daoPhoneMailbox.set({
    entry: out,
    status: input.status,
    reason: input.reason,
  });
  return { outcome: 'SET' };
};
