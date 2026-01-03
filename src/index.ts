export * from './contract/sdk';

// CLI entry points for portable skill dispatch
import { bindBehavior } from './contract/cli/bind.behavior';
import { bootBehavior } from './contract/cli/boot.behavior';
import { decomposeBehavior } from './contract/cli/decompose.behavior';
import { initBehavior } from './contract/cli/init.behavior';
import { reviewBehavior } from './contract/cli/review.behavior';

export const cli = {
  bindBehavior,
  bootBehavior,
  decomposeBehavior,
  initBehavior,
  reviewBehavior,
};
