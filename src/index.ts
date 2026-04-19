export * from './contract/sdk';

// CLI entry points for portable skill dispatch
import { withEmojiSpaceShim } from 'emoji-space-shim';
import { ConstraintError } from 'helpful-errors';

import { bindBehavior } from './contract/cli/bind.behavior';
import { bootBehavior } from './contract/cli/boot.behavior';
import { catchDream } from './contract/cli/catch.dream';
import { decomposeBehavior } from './contract/cli/decompose.behavior';
import { feedbackGive } from './contract/cli/feedback.give';
import { feedbackTakeGet } from './contract/cli/feedback.take.get';
import { feedbackTakeSet } from './contract/cli/feedback.take.set';
import { initBehavior } from './contract/cli/init.behavior';
import { cliRadioTaskPull } from './contract/cli/radioTaskPull';
import { cliRadioTaskPush } from './contract/cli/radioTaskPush';
import { reviewBehavior } from './contract/cli/review.behavior';

const asCli =
  (logic: () => void | Promise<void>) => async (): Promise<void> => {
    try {
      await logic();
    } catch (error) {
      if (error instanceof ConstraintError) {
        const metadata = error.metadata as Record<string, unknown> | undefined;
        const hint = metadata?.hint as string | undefined;
        console.error(
          `✋ ConstraintError: ${error.message.replace(/^✋ ConstraintError: /, '')}`,
        );
        if (hint) {
          console.error('');
          console.error(hint);
        }
        process.exit(ConstraintError.code.exit);
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
  radioTaskPull: () => withEmojiSpaceShim({ logic: asCli(cliRadioTaskPull) }),
  radioTaskPush: () => withEmojiSpaceShim({ logic: asCli(cliRadioTaskPush) }),
  reviewBehavior: () => withEmojiSpaceShim({ logic: asCli(reviewBehavior) }),
};
