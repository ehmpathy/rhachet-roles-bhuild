import * as fs from 'fs';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { EHMPATH_NOREPLY_EMAILS, isEhmpathEmail } from './isEhmpathEmail';

/**
 * .what = the path of the upstream seaturtle roster, in the installed dependency
 */
const ROSTER_PATH = path.join(
  __dirname,
  '../../../../node_modules/rhachet-roles-ehmpathy/dist/domain.roles/mechanic/skills/git.commit/keyrack.operations.sh',
);

/**
 * .what = the seaturtle email roster in the installed rhachet-roles-ehmpathy bash leaf
 * .why  = the roster has no ts export; its `SEATURTLE_*` assignments are plain
 *         `NAME="value"` lines, where a value may cite an earlier `${NAME}`
 */
const getUpstreamSeaturtleEmails = (input: { file: string }): string[] => {
  // collect every SEATURTLE_* assignment, in file order
  const assignments = [
    ...input.file.matchAll(/^(SEATURTLE_[A-Z_]+)="([^"]*)"$/gm),
  ].map((match) => ({ name: match[1]!, value: match[2]! }));

  // expand each ${NAME} against the assignments declared before it
  const values = assignments.reduce<Record<string, string>>(
    (soFar, { name, value }) => ({
      ...soFar,
      [name]: value.replace(
        /\$\{([A-Z_]+)\}/g,
        (_, ref: string) => soFar[ref] ?? '',
      ),
    }),
    {},
  );

  // the roster's emails are the assignments whose name ends in _EMAIL
  return Object.entries(values)
    .filter(([name]) => name.endsWith('_EMAIL'))
    .map(([, value]) => value);
};

/**
 * .what = drift test: the hand-kept seaturtle noreply roster vs the upstream bash leaf
 * .why  = a seaturtle identity added upstream and absent here would demote an ehmpath box to
 *         the human path (as-human, under the no---auth default); this turns red first
 *
 * .grain = INTEGRATION. reads the installed dependency's bash file; no network
 */
describe('isEhmpathEmail — the roster matches the upstream seaturtle roster', () => {
  given(
    '[case1] the installed rhachet-roles-ehmpathy keyrack.operations.sh',
    () => {
      const scene = useBeforeAll(async () => ({
        emails: getUpstreamSeaturtleEmails({
          file: fs.readFileSync(ROSTER_PATH, 'utf-8'),
        }),
      }));

      when('[t0] its emails are read', () => {
        then('it declares at least the standard, bot, and clone emails', () => {
          expect(scene.emails.length).toBeGreaterThanOrEqual(3);
        });

        then(
          'every upstream seaturtle email passes as an ehmpath email',
          () => {
            const emailsRejected = scene.emails.filter(
              (email) => !isEhmpathEmail({ email }),
            );
            expect(emailsRejected).toEqual([]);
          },
        );

        then(
          'every local noreply email is one the upstream still declares',
          () => {
            const emailsStale = EHMPATH_NOREPLY_EMAILS.filter(
              (email) => !scene.emails.includes(email),
            );
            expect(emailsStale).toEqual([]);
          },
        );
      });
    },
  );
});
