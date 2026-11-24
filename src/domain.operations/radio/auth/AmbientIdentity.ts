/**
 * .what = the identity a box declares, by its git config user.email
 * .why = the default and the ambient spot each branch on it; one read yields one value, so the
 *        two never read the email twice, nor disagree between reads
 */
export type AmbientIdentity =
  | { kind: 'none' }
  | { kind: 'ehmpath'; email: string }
  | { kind: 'human'; email: string };
