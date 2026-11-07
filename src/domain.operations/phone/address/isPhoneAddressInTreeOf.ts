/**
 * .what = whether two canonical addresses name seats in one tree, on one grove
 * .why = a stored address is always the full form `phone://grove=<g>/tree=<t>/clone=<c>`, so two
 *        seats share a tree exactly when all before `/clone=` matches
 */
export const isPhoneAddressInTreeOf = (input: {
  address: string;
  of: string;
}): boolean => {
  const asTreeKey = (address: string): string | null => {
    const at = address.indexOf('/clone=');
    return at < 0 ? null : address.slice(0, at);
  };
  const treeKey = asTreeKey(input.address);
  return treeKey !== null && treeKey === asTreeKey(input.of);
};
