/**
 * .what = the name of the auth a radio send uses when no --auth is given
 * .why = one home for the default's name, so the output that names it to a reader and the
 *        help that explains it can never drift apart
 *
 * .note = a name, not an --auth value: the default is ambient-first (an ehmpath box sends with
 *         its gh login, a human's box as-human, a box with no git email from keyrack), and
 *         getGithubTokenByAmbientFirst holds its logic
 */
export const RADIO_AUTH_DEFAULT = 'ambient-first';
