/**
 * .what = the `rhachet-roles-bhuild/cli` entrypoint — one lazy thunk per skill
 *
 * .why  = every skill dispatcher spawns a fresh node that imports this package
 *         to run ONE cli. an eager entry paid for all of them on every spawn:
 *         `getRoleRegistry` plus twelve cli modules, measured at 1.3–2.3s per
 *         call before the skill did any work. each thunk here loads only the
 *         module its skill runs, so a spawn pays for one cli and naught else.
 *
 * .note = the package root re-exports `cli` from here, so a caller that still
 *         imports `rhachet-roles-bhuild` keeps its shape; it merely pays the
 *         sdk cost the root carries for `getRoleRegistry`
 *
 * .note = the loads use `require`, not `import()`. under `module: node16` a
 *         dynamic `import()` compiles to a native esm import, which refuses an
 *         extensionless path; `require` stays commonjs like the rest of dist/.
 *         each load declares its module type via `typeof import(...)`, so the
 *         thunk stays typed with no as-cast
 */
import { withEmojiSpaceShim } from 'emoji-space-shim';
import { BadRequestError, ConstraintError, HelpfulError } from 'helpful-errors';

import { asCliMalfunctionOutput } from '../../infra/cli/asCliMalfunctionOutput';
import { isHintInErrorMessage } from '../../infra/cli/isHintInErrorMessage';

/**
 * .what = runs a cli's logic and maps a caller-fixable error to exit 2
 * .why  = a ConstraintError is the caller's to fix, so it earns a clean message
 *         and exit 2 rather than a stack trace (rule.require.exit-code-semantics)
 */
const asCli =
  (logic: () => void | Promise<void>) => async (): Promise<void> => {
    try {
      await logic();
    } catch (error) {
      // handle constraint errors (exit 2 = user must fix)
      if (
        error instanceof ConstraintError ||
        error instanceof BadRequestError
      ) {
        const metadata = error.metadata as Record<string, unknown> | undefined;
        const hint = metadata?.hint as string | undefined;
        // check if helpful-errors already added the emoji prefix
        const alreadyHasEmoji = error.message.includes('✋');
        const prefix = alreadyHasEmoji ? '' : '✋ ';
        console.error(`${prefix}${error.message}`);
        // surface the hint as a final line ONLY when the message does not
        // already carry it. helpful-errors embeds metadata (incl. the hint)
        // into error.message, so an unconditional print would duplicate it
        if (hint && !isHintInErrorMessage({ message: error.message, hint })) {
          console.error('');
          console.error(hint);
        }
        process.exit(2);
      }

      // handle helpful malfunctions (exit 1 = system must fix): message once, then frames
      if (error instanceof HelpfulError) {
        console.error(asCliMalfunctionOutput({ error }));
        process.exit(1);
      }
      throw error;
    }
  };

/**
 * .what = wraps a lazy cli load into a runnable skill entry
 * .why  = the module load moves inside the thunk, so only the invoked skill's
 *         module is ever required
 */
const asLazyCli = (load: () => () => void | Promise<void>) => () =>
  withEmojiSpaceShim({ logic: asCli(() => load()()) });

// one typed loader per cli module; each requires its module only when called
const loadBind = (): typeof import('./bind.behavior') =>
  require('./bind.behavior');
const loadBoot = (): typeof import('./boot.behavior') =>
  require('./boot.behavior');
const loadDream = (): typeof import('./catch.dream') =>
  require('./catch.dream');
const loadDecompose = (): typeof import('./decompose.behavior') =>
  require('./decompose.behavior');
const loadFeedbackGive = (): typeof import('./feedback.give') =>
  require('./feedback.give');
const loadFeedbackTakeGet = (): typeof import('./feedback.take.get') =>
  require('./feedback.take.get');
const loadFeedbackTakeSet = (): typeof import('./feedback.take.set') =>
  require('./feedback.take.set');
const loadInit = (): typeof import('./init.behavior') =>
  require('./init.behavior');
const loadRadioHeld = (): typeof import('./radioTaskHeld') =>
  require('./radioTaskHeld');
const loadRadioPull = (): typeof import('./radioTaskPull') =>
  require('./radioTaskPull');
const loadRadioPush = (): typeof import('./radioTaskPush') =>
  require('./radioTaskPush');
const loadReflect = (): typeof import('./reflect.on.reviews.self') =>
  require('./reflect.on.reviews.self');
const loadReview = (): typeof import('./review.behavior') =>
  require('./review.behavior');

export const cli = {
  bindBehavior: asLazyCli(() => loadBind().bindBehavior),
  bootBehavior: asLazyCli(() => loadBoot().bootBehavior),
  catchDream: asLazyCli(() => loadDream().catchDream),
  decomposeBehavior: asLazyCli(() => loadDecompose().decomposeBehavior),
  feedbackGive: asLazyCli(() => loadFeedbackGive().feedbackGive),
  feedbackTakeGet: asLazyCli(() => loadFeedbackTakeGet().feedbackTakeGet),
  feedbackTakeSet: asLazyCli(() => loadFeedbackTakeSet().feedbackTakeSet),
  giveFeedback: asLazyCli(() => loadFeedbackGive().feedbackGive), // backwards compat
  initBehavior: asLazyCli(() => loadInit().initBehavior),
  radioTaskHeld: asLazyCli(() => loadRadioHeld().cliRadioTaskHeld),
  radioTaskPull: asLazyCli(() => loadRadioPull().cliRadioTaskPull),
  radioTaskPush: asLazyCli(() => loadRadioPush().cliRadioTaskPush),
  reflectOnReviewsSelf: asLazyCli(() => loadReflect().reflectOnReviewsSelf),
  reviewBehavior: asLazyCli(() => loadReview().reviewBehavior),
};
