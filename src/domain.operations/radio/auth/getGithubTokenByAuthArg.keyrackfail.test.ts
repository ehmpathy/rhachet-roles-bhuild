import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

/**
 * .what = unit tests for the keyrack FAILURE paths of getGithubTokenByAuthArg
 * .why  = the wish's primary behavior at the shared-auth contract: a default
 *         keyrack failure (locked / absent / blocked) surfaces the graceful ✋
 *         nudge through the ONE entry both the pull and push CLIs funnel
 *         through. the rendered ConstraintError (✋ + a status-specific fix) is
 *         snapshotted, so a reviewer vibechecks the exact caller-faced nudge.
 *
 * .grain = UNIT, and deliberately so. these cases cross no remote boundary —
 *          a fake keyrackGet arrives through the context seam, and a no-op
 *          fake shx stands in for the auto-unlock, so no real vault and no
 *          real shell is touched. that is the dependency injection
 *          rule.forbid.unit.remote-boundaries names as the sanctioned
 *          substitute for a mock. the identical fake inside an .integration
 *          file was the defect rule.forbid.integration.mocks names, which is
 *          why these moved out of getGithubTokenByAuthArg.integration.test.ts.
 *
 * .note  = this file deliberately does NOT mock ./genAuthFromKeyrack, unlike
 *          its peer getGithubTokenByAuthArg.test.ts. that module IS the logic
 *          under test here — it consumes the injected keyrackGet and renders
 *          the nudge. mock it and every assertion below would grade the mock
 *          instead, and pass while it proves naught.
 */
describe('getGithubTokenByAuthArg.keyrackfail', () => {
  /**
   * .what = a no-op shx, so the auto-unlock command runs nowhere
   * .why  = keeps the case free of a real `rhx keyrack unlock` side effect
   */
  const fakeShxNoop = async () => ({ stdout: '', stderr: '' });

  /**
   * .what = a fake keyrack.get that reports one declared failure status
   * .why  = a real vault holds a VALID beaver token, so a locked / absent /
   *         blocked reply cannot be forced from it on demand
   * .note = built with jest.fn() for one reason — keyrack.get is a third-party
   *         generic whose return type is conditional on its input
   *         (`T extends { repo: true } ? {attempts} : {attempt}`). a plain
   *         async fake cannot satisfy that without an `as` cast, which
   *         rule.forbid.as-cast blocks. it is still delivered by injection,
   *         never a module mock.
   */
  const fakeKeyrackGet = (input: { status: string; stdout: string }) => {
    const fake = jest.fn();
    fake.mockResolvedValue({
      attempt: {
        status: input.status,
        slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
      },
      emit: { stdout: input.stdout },
    });
    return fake;
  };

  given('[case1] via-keyrack fails: locked (sealed after auto-unlock)', () => {
    when('[t0] keyrack stays locked', () => {
      then('surfaces the ✋ nudge with the keyrack-unlock fix', async () => {
        const error = await getError(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:via-keyrack(ehmpath)' },
            {
              env: {},
              shx: fakeShxNoop,
              keyrackGet: fakeKeyrackGet({
                status: 'locked',
                stdout: '🔒 locked: credential is locked',
              }),
            },
          ),
        );

        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--auth as-human');
        expect(error.message).toContain('rhx keyrack unlock');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case2] via-keyrack fails: absent (never stored)', () => {
    when('[t0] keyrack returns absent', () => {
      then('surfaces the ✋ nudge with the keyrack-set fix', async () => {
        const error = await getError(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:via-keyrack(ehmpath)' },
            {
              env: {},
              shx: fakeShxNoop,
              keyrackGet: fakeKeyrackGet({
                status: 'absent',
                stdout: '❌ absent: does not exist',
              }),
            },
          ),
        );

        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--auth as-human');
        expect(error.message).toContain('rhx keyrack set');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case3] via-keyrack fails: blocked (firewall/policy)', () => {
    when('[t0] keyrack returns blocked', () => {
      then(
        'surfaces the ✋ nudge with the keyrack-status inspect',
        async () => {
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: 'as-robot:via-keyrack(ehmpath)' },
              {
                env: {},
                shx: fakeShxNoop,
                keyrackGet: fakeKeyrackGet({
                  status: 'blocked',
                  stdout:
                    '🚫 blocked: credential blocked by mechanism firewall',
                }),
              },
            ),
          );

          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('--auth as-human');
          expect(error.message).toContain('rhx keyrack status');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });
});
