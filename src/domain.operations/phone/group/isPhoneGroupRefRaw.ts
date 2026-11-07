/**
 * .what = the prefix that marks an `--into` value as a group
 */
export const PHONE_GROUP_PREFIX = 'group:';

/**
 * .what = is this raw `--into` value a group reference
 */
export const isPhoneGroupRefRaw = (input: { raw: string }): boolean =>
  input.raw.trim().toLowerCase().startsWith(PHONE_GROUP_PREFIX);
