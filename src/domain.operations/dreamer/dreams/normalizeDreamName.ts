/**
 * .what = converts raw input to kebab-case dream name
 * .why = ensures consistent file name across all dreams
 */
export const normalizeDreamName = (input: { raw: string }): string => {
  return input.raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // special chars → dash
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-|-$/g, ''); // trim edge dashes
};
