/**
 * .what = the one keyrack coordinate the ehmpath robot github token lives at
 * .why = every auth path that reads the robot token from keyrack reads it here, so the owner,
 *        env, and key are declared once
 *
 * .note = the org is the one field the paths choose apart, on purpose, and each call names it
 *         (getEhmpathTokenByVia takes `keyrackOrg`), so one call never reads two slugs:
 *   - the as-ehmpath values pin `org: 'ehmpathy'`, so the slug never depends on the cwd repo; a
 *     repo with no keyrack.yml, or one that names another org, still reads the robot token and
 *     misses honestly rather than throw
 *   - `as-robot:via-keyrack(owner)` and the default, on every branch, keep `org: null` (the slug
 *     follows the cwd repo's keyrack.yml), so the default reads one slug whether or not an email
 *     is set, and sends as before this change where no email is set (F17). the dream
 *     `fix-radio-via-keyrack-default-slug-reads-cwd-org` holds the cure for the null org
 */
export const KEYRACK_EHMPATH_COORDINATE = {
  owner: 'ehmpath',
  env: 'prep',
  key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
} as const;

/**
 * .what = the org the as-ehmpath values pin their keyrack slug to
 * .why = see the note on KEYRACK_EHMPATH_COORDINATE
 */
export const KEYRACK_EHMPATH_ORG_PINNED = 'ehmpathy';
