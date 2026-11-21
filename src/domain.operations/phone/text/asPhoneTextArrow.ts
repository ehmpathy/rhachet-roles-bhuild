import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

/**
 * .what = `→ <to>` for a text this clone sent, `← <from>` for one it received
 * .why = a thread line names the other party and the direction in one glance
 */
export const asPhoneTextArrow = (input: { record: PhoneTextRecord }): string =>
  input.record.way === 'out'
    ? `→ ${input.record.to}`
    : `← ${input.record.from}`;
