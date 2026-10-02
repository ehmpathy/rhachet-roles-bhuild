export * from './contract/sdk';

// CLI entry points for portable skill dispatch
import { withEmojiSpaceShim } from 'emoji-space-shim';
import { BadRequestError, ConstraintError, HelpfulError } from 'helpful-errors';

import { bindBehavior } from './contract/cli/bind.behavior';
import { bootBehavior } from './contract/cli/boot.behavior';
import { catchDream } from './contract/cli/catch.dream';
import { decomposeBehavior } from './contract/cli/decompose.behavior';
import { feedbackGive } from './contract/cli/feedback.give';
import { feedbackTakeGet } from './contract/cli/feedback.take.get';
import { feedbackTakeSet } from './contract/cli/feedback.take.set';
import { initBehavior } from './contract/cli/init.behavior';
import { cliRadioTaskHeld } from './contract/cli/radioTaskHeld';
import { cliRadioTaskPull } from './contract/cli/radioTaskPull';
import { cliRadioTaskPush } from './contract/cli/radioTaskPush';
import { reflectOnReviewsSelf } from './contract/cli/reflect.on.reviews.self';
import { reviewBehavior } from './contract/cli/review.behavior';
import { asCliMalfunctionOutput } from './infra/cli/asCliMalfunctionOutput';
import { isHintInErrorMessage } from './infra/cli/isHintInErrorMessage';

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
        // surface the hint as a friendly closing line ONLY when the message
        // does not already carry it. helpful-errors embeds metadata (incl. the
        // hint) into error.message, so an unconditional closing print would
        // duplicate the hint (blemish). the guard keeps the hint visible when
        // absent from the message, without a duplicate when already present.
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

export const cli = {
  bindBehavior: () => withEmojiSpaceShim({ logic: asCli(bindBehavior) }),
  bootBehavior: () => withEmojiSpaceShim({ logic: asCli(bootBehavior) }),
  catchDream: () => withEmojiSpaceShim({ logic: asCli(catchDream) }),
  decomposeBehavior: () =>
    withEmojiSpaceShim({ logic: asCli(decomposeBehavior) }),
  feedbackGive: () => withEmojiSpaceShim({ logic: asCli(feedbackGive) }),
  feedbackTakeGet: () => withEmojiSpaceShim({ logic: asCli(feedbackTakeGet) }),
  feedbackTakeSet: () => withEmojiSpaceShim({ logic: asCli(feedbackTakeSet) }),
  giveFeedback: () => withEmojiSpaceShim({ logic: asCli(feedbackGive) }), // backwards compat
  initBehavior: () => withEmojiSpaceShim({ logic: asCli(initBehavior) }),
  radioTaskHeld: () => withEmojiSpaceShim({ logic: asCli(cliRadioTaskHeld) }),
  radioTaskPull: () => withEmojiSpaceShim({ logic: asCli(cliRadioTaskPull) }),
  radioTaskPush: () => withEmojiSpaceShim({ logic: asCli(cliRadioTaskPush) }),
  reflectOnReviewsSelf: () =>
    withEmojiSpaceShim({ logic: asCli(reflectOnReviewsSelf) }),
  reviewBehavior: () => withEmojiSpaceShim({ logic: asCli(reviewBehavior) }),
};
