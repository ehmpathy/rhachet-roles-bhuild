/**
 * .what = does this text uuid answer to this reference
 * .why = a full uuid must match whole; an 8-char alias matches the uuid it leads
 */
export const isPhoneTextRefMatch = (input: {
  uuid: string;
  ref: { kind: 'alias' | 'full'; value: string };
}): boolean =>
  input.ref.kind === 'full'
    ? input.uuid === input.ref.value
    : input.uuid.startsWith(input.ref.value);
