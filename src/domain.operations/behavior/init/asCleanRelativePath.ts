/**
 * .what = remove prefix ./ from path for clean display
 * .why = paths like ./foo should display as foo in output and route bind
 */
export const asCleanRelativePath = (input: { path: string }): string =>
  input.path.replace(/^\.\//, '');
