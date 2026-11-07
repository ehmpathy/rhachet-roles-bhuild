import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useThen, when } from 'test-fns';

import { cli } from './index';

/**
 * .what = the committed repo settings this tree boots its clones with
 * .why = its hook commands call this package's cli by name; a rename or a removal that is not
 *        carried into this file makes every hook that names it throw at each event, in silence
 *        to the author and loud to every clone
 */
const PATH_SETTINGS = join(
  __dirname,
  '../../../.agent/.actors/actor.via.repo=ambient/brain/.claude/settings.of.repo.json',
);

/**
 * .what = the package specifiers a hook may import, as package.json `exports` declares them
 */
const SPECIFIERS_EXPORTED = [
  'rhachet-roles-bhuild',
  'rhachet-roles-bhuild/cli',
];

/**
 * .what = every command string in the settings file's hooks, of every event
 */
const getAllHookCommands = (input: { settings: unknown }): string[] => {
  const hooks =
    (input.settings as { hooks?: Record<string, unknown> }).hooks ?? {};
  return Object.values(hooks).flatMap((matchers) =>
    (Array.isArray(matchers) ? matchers : []).flatMap(
      (matcher: { hooks?: { command?: string }[] }) =>
        (matcher.hooks ?? []).flatMap((hook) =>
          hook.command ? [hook.command] : [],
        ),
    ),
  );
};

describe('cliOfRepoSettingsHooks', () => {
  given('[case1] the committed repo settings', () => {
    when('[t0] each hook that calls this package cli is read', () => {
      const result = useThen('each call is found', () => {
        // .note = the settings file is json written by rhachet init; its shape is read loosely
        const settings: unknown = JSON.parse(
          readFileSync(PATH_SETTINGS, 'utf8'),
        );
        const calls = getAllHookCommands({ settings }).flatMap((command) =>
          [
            ...command.matchAll(
              /import\('([^']+)'\)\.then\(m => m\.cli\.(\w+)\(\)\)/g,
            ),
          ].map((match) => ({
            command,
            specifier: match[1]!,
            name: match[2]!,
          })),
        );
        return { calls };
      });

      then(
        'the settings hold at least one such hook, so the check reads a real file',
        () => {
          expect(result.calls.length).toBeGreaterThan(0);
        },
      );

      then('each hook imports a specifier the package exports', () => {
        expect(
          result.calls.filter(
            (call) => !SPECIFIERS_EXPORTED.includes(call.specifier),
          ),
        ).toEqual([]);
      });

      then('each m.cli.<name> a hook calls exists in the cli export', () => {
        const names: Record<string, unknown> = cli;
        expect(
          result.calls
            .filter((call) => typeof names[call.name] !== 'function')
            .map((call) => call.command),
        ).toEqual([]);
      });
    });
  });
});
