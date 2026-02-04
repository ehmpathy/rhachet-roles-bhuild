export * from './contract/sdk';

// CLI entry points for portable skill dispatch
import { withEmojiSpaceShim } from 'emoji-space-shim';

import { bindBehavior } from './contract/cli/bind.behavior';
import { bootBehavior } from './contract/cli/boot.behavior';
import { catchDream } from './contract/cli/catch.dream';
import { decomposeBehavior } from './contract/cli/decompose.behavior';
import { giveFeedback } from './contract/cli/give.feedback';
import { initBehavior } from './contract/cli/init.behavior';
import { cliRadioTaskPull } from './contract/cli/radioTaskPull';
import { cliRadioTaskPush } from './contract/cli/radioTaskPush';
import { reviewBehavior } from './contract/cli/review.behavior';

export const cli = {
  bindBehavior: () => withEmojiSpaceShim({ logic: async () => bindBehavior() }),
  bootBehavior: () => withEmojiSpaceShim({ logic: async () => bootBehavior() }),
  catchDream: () => withEmojiSpaceShim({ logic: async () => catchDream() }),
  decomposeBehavior: () =>
    withEmojiSpaceShim({ logic: async () => decomposeBehavior() }),
  giveFeedback: () => withEmojiSpaceShim({ logic: async () => giveFeedback() }),
  initBehavior: () => withEmojiSpaceShim({ logic: async () => initBehavior() }),
  radioTaskPull: () =>
    withEmojiSpaceShim({ logic: async () => cliRadioTaskPull() }),
  radioTaskPush: () =>
    withEmojiSpaceShim({ logic: async () => cliRadioTaskPush() }),
  reviewBehavior: () =>
    withEmojiSpaceShim({ logic: async () => reviewBehavior() }),
};
