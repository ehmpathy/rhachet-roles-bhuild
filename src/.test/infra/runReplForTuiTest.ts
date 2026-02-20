/**
 * .what = test harness to run the feedback repl for TUI tests
 *
 * .why = cli-test-library needs to spawn a process; this provides
 *        a direct entry point that takes a file path argument
 *
 * usage:
 *   npx tsx src/.test/infra/runReplForTuiTest.ts /tmp/test.feedback.md
 */

import { runFeedbackRepl } from '../../domain.operations/behavior/feedback/repl/runFeedbackRepl';

const feedbackFile = process.argv[2];

if (!feedbackFile) {
  console.error('usage: runReplForTuiTest.ts <feedback-file-path>');
  process.exit(1);
}

runFeedbackRepl({ feedbackFile });
