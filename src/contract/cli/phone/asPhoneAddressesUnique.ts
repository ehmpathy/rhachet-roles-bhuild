/**
 * .what = the addresses a repeated flag carried, each once, in the order first given
 * .why = a booter may pass `--address` once per peer; a repeat of one peer is one grant
 */
export const asPhoneAddressesUnique = (input: {
  addresses: string[];
}): string[] => [...new Set(input.addresses)];
