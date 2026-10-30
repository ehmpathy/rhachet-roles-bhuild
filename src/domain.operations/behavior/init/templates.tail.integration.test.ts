import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = the clamp on the text of the ship tail: 6.preship and 7.reflect, and the one push point
 * .why  = the tail's rules live only as prose a driver reads. no other test sees them, so a
 *         template edit that drops "never --apply", restores a halt, or bakes in a clock would
 *         ship silent. each assertion names the cell or fulcrum it holds.
 *
 * .note = reads the source templates directly (init copies them verbatim, save for
 *         $BEHAVIOR_DIR_REL), so this needs no route and no driver
 */
const TEMPLATES_DIR = path.join(__dirname, 'templates');

const BRAIN_BUILD = 'claude-sonnet-5-5[1m]';
const BRAIN_DESIGN = 'claude-opus-5-5[1m]';

/**
 * .what = a clock value or a time zone, as a template might bake one in
 * .why  = the director ruled the open-hours clock out of every template (F3)
 */
const PATTERN_CLOCK = /\b\d{1,2}:\d{2}\b|\bCT\b/;

/**
 * .what = a template line that asks the driver to commit or push
 * .why  = the one push point of a route is 6.preship; any other is an early push (case3)
 */
const PATTERN_SHIP_CALL = /git\.commit\.set|--push\b|git push/;

/**
 * .what = reads one template, or null when the file is absent
 * .why  = an absent tail file must fail as an assertion on content, not as a thrown ENOENT
 */
const getOneTemplateContent = (input: { name: string }): string | null => {
  const templatePath = path.join(TEMPLATES_DIR, input.name);
  if (!existsSync(templatePath)) return null;
  return readFileSync(templatePath, 'utf-8');
};

describe('templates.tail', () => {
  given('[case1] the 6.preship templates', () => {
    const scene = useBeforeAll(async () => ({
      stone: getOneTemplateContent({ name: '6.preship.stone' }),
      guard: getOneTemplateContent({ name: '6.preship.guard' }),
    }));

    when('[t0] the stone is read', () => {
      then('it exists', () => {
        expect(scene.stone).not.toBeNull();
      });

      then('it runs the full suite before any commit (c4)', () => {
        expect(scene.stone).toContain(
          'rhx git.repo.test --what all --mode apply',
        );
      });

      then('it watches the pull with git.release --watch (c3)', () => {
        expect(scene.stone).toContain('rhx git.release --watch');
      });

      then('it checks the watch ran on the sha just pushed (c23)', () => {
        expect(scene.stone).toContain('headRefOid');
      });

      then('it forbids --apply and merge (c9)', () => {
        expect(scene.stone).toContain('never `--apply`, never merge');
      });

      then('it holds a refused commit, never halts on it (F3)', () => {
        expect(scene.stone).toContain('held, never a halt');
      });

      then('it forbids every route around a refusal (c5, c6)', () => {
        expect(scene.stone).toContain('--no-verify');
        expect(scene.stone).toContain('no raw `git commit`');
      });

      then('it carries no clock (F3)', () => {
        expect(scene.stone ?? '').not.toMatch(PATTERN_CLOCK);
      });
    });

    when('[t1] the guard is read', () => {
      then('it drives on sonnet (F2)', () => {
        expect(scene.guard).toContain(`brain: ${BRAIN_BUILD}`);
      });

      then(
        'it gates on self-reviews alone: no peer lane, no judge (F5)',
        () => {
          expect(scene.guard).toContain('  peer: []');
          expect(scene.guard).not.toMatch(/^judges:/m);
        },
      );
    });
  });

  given('[case2] the 7.reflect templates', () => {
    const scene = useBeforeAll(async () => ({
      stone: getOneTemplateContent({ name: '7.reflect.stone' }),
      guard: getOneTemplateContent({ name: '7.reflect.guard' }),
    }));

    when('[t0] the stone is read', () => {
      then('it exists', () => {
        expect(scene.stone).not.toBeNull();
      });

      then('it goes three whys deep (c14)', () => {
        expect(scene.stone).toContain('the why of why of why');
      });

      then('it reads the record, not memory (c21)', () => {
        expect(scene.stone).toContain('read the record, not memory');
      });

      then(
        'an in-repo cure rides the same pull and is re-watched (F6, c24)',
        () => {
          expect(scene.stone).toContain('push onto the same pull');
          expect(scene.stone).toContain('re-watch to green');
        },
      );

      then(
        'a cure owned elsewhere is dispatched, never edited by hand (c15)',
        () => {
          expect(scene.stone).toContain('rhx radio.task.push --into');
        },
      );

      then('it carries no clock (F3)', () => {
        expect(scene.stone ?? '').not.toMatch(PATTERN_CLOCK);
      });
    });

    when('[t1] the guard is read', () => {
      then('it drives on opus (F2)', () => {
        expect(scene.guard).toContain(`brain: ${BRAIN_DESIGN}`);
      });

      then(
        'it gates on self-reviews alone: no peer lane, no judge (F5)',
        () => {
          expect(scene.guard).toContain('  peer: []');
          expect(scene.guard).not.toMatch(/^judges:/m);
        },
      );
    });
  });

  given('[case3] the push policy repos have today', () => {
    // .why = the vision + blueprint checkpoints, and the pii hold they need (F1), are deferred to a
    //        follow-up behavior. until it lands, no stone may commit or push before the finish, so
    //        a pii repo can never push early. this goes red if any other template asks for it
    const scene = useBeforeAll(async () => ({
      namesWithShipCall: readdirSync(TEMPLATES_DIR, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) =>
          PATTERN_SHIP_CALL.test(getOneTemplateContent({ name }) ?? ''),
        )
        .sort(),
    }));

    when('[t0] every template is read', () => {
      then('only 6.preship asks for a commit or a push (c18)', () => {
        expect(scene.namesWithShipCall).toEqual(['6.preship.stone']);
      });
    });
  });
});
