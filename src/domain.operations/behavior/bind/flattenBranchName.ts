/**
 * .what = flatten branch name to filesystem-safe format
 * .why  = bind flag filenames cannot contain forward slashes;
 *         this utility normalizes branch names for use in flag paths
 */
export const flattenBranchName = (input: { branchName: string }): string => {
  // replace forward slashes with dots
  let flattened = input.branchName.replace(/\//g, '.');

  // normalize other special characters (keep alphanumeric, dots, dashes, underscores)
  flattened = flattened.replace(/[^a-zA-Z0-9._-]/g, '_');

  // remove trailing underscore if present
  flattened = flattened.replace(/_$/, '');

  return flattened;
};
