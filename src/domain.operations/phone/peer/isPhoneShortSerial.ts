/**
 * .what = is this name a short serial: the first 8 hex of a clone's serial
 */
export const isPhoneShortSerial = (input: { name: string }): boolean =>
  /^[0-9a-f]{8}$/.test(input.name);
