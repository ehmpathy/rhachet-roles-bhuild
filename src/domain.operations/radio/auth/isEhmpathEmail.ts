/**
 * .what = the seaturtle noreply addresses an ehmpath box may carry in git config
 * .why = a clone box commits under its github noreply, not an @ehmpath.com address
 *
 * .note = copied from rhachet-roles-ehmpathy `skills/git.commit/keyrack.operations.sh`
 *         (SEATURTLE_APP_BOT_EMAIL, SEATURTLE_CLONE_EMAIL); that roster is a bash leaf with
 *         no ts export, so the two copies must be kept in step by hand
 */
const EHMPATH_NOREPLY_EMAILS = [
  '295111357+ehm-a-seaturtle[bot]@users.noreply.github.com',
  '259600029+ehm-seaturtle@users.noreply.github.com',
];

/**
 * .what = is this email an ehmpath identity
 * .why = the ambient auth path sends under the box's gh login only when the box declares
 *        itself an ehmpath box; a human's address must never pass
 *
 * .note = any address at the ehmpath.com domain, or a declared seaturtle noreply. the
 *         compare ignores case and outer whitespace, as git config reads back raw
 */
export const isEhmpathEmail = (input: { email: string }): boolean => {
  const email = input.email.trim().toLowerCase();
  if (email.endsWith('@ehmpath.com') && email.length > '@ehmpath.com'.length)
    return true;
  return EHMPATH_NOREPLY_EMAILS.includes(email);
};
