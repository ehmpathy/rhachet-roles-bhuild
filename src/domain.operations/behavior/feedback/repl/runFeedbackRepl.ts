/**
 * .what = render the ink feedback repl
 * .why = provides interactive cli for structured feedback entry
 */
import { render } from 'ink';
import React from 'react';

import { appendChangeLog } from './appendChangeLog';
import { appendFeedbackToFile } from './appendFeedbackToFile';
import { countPriorFeedback } from './countPriorFeedback';
import { FeedbackRepl } from './FeedbackRepl';
import { redoLastUndo } from './redoLastUndo';
import { undoLastChange } from './undoLastChange';

export const runFeedbackRepl = (input: { feedbackFile: string }): void => {
  // count prior feedback for initial state
  const prior = countPriorFeedback({ feedbackFile: input.feedbackFile });

  // compute how many lines our header will output (so we can pre-emit newlines)
  // base: 14 lines (title, controls, etc)
  // + 5 lines if prior feedback exists (info + blank)
  const headerLineCount = 14 + (prior.count > 0 ? 5 : 0);

  // emit newlines to push prior terminal content up (preserves their messages)
  process.stdout.write('\n'.repeat(headerLineCount));

  // clear terminal
  console.clear();

  // emit horizontal separator to mark where our repl starts
  const termWidth = process.stdout.columns || 80;
  const separator = '─'.repeat(termWidth);
  console.log(`\x1b[2m${separator}\x1b[0m`);

  // show welcome header
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';
  console.log('🎤 feedback repl');
  console.log('');
  console.log(`${dim}   enter feedback for the artifact under review.`);
  console.log('   each entry is saved to the feedback file in realtime.');
  console.log('');
  console.log('   controls:');
  console.log('   ├─ enter        submit feedback');
  console.log('   ├─ shift+enter  newline');
  console.log('   ├─ shift+tab    toggle blocker/nitpick');
  console.log('   ├─ ctrl+z       undo');
  console.log('   ├─ ctrl+y       redo');
  console.log('   ├─ ↑/↓          navigate history');
  console.log(`   └─ ctrl+c       clear input (or exit if empty)${reset}`);
  console.log('');

  // show prior feedback count if any
  if (prior.count > 0) {
    // compute relative path for display
    const relPath = input.feedbackFile.startsWith(process.cwd())
      ? input.feedbackFile.slice(process.cwd().length + 1)
      : input.feedbackFile;

    const red = '\x1b[31m';
    const yellow = '\x1b[33m';
    console.log(`${dim}   ${prior.count} prior feedback item(s) found`);
    console.log(`   ├─ ${reset}${relPath}`);
    console.log(
      `${dim}   ├─ ${reset}${prior.blockerCount} blocker${prior.blockerCount !== 1 ? 's' : ''} ${dim}${red}●${reset}`,
    );
    console.log(
      `${dim}   └─ ${reset}${prior.nitpickCount} nitpick${prior.nitpickCount !== 1 ? 's' : ''} ${dim}${yellow}●${reset}`,
    );
    console.log('');
  }

  render(
    React.createElement(FeedbackRepl, {
      feedbackFile: input.feedbackFile,
      initialBlockerCount: prior.blockerCount,
      initialNitpickCount: prior.nitpickCount,
      initialHistory: prior.texts.reverse(), // reverse so most recent first
      onSubmit: (feedback: {
        severity: 'blocker' | 'nitpick';
        index: number;
        text: string;
      }) => {
        // write feedback to file (with upsert semantics)
        const result = appendFeedbackToFile({
          feedbackFile: input.feedbackFile,
          severity: feedback.severity,
          index: feedback.index,
          text: feedback.text,
        });

        // log the change for undo/redo support
        appendChangeLog({
          feedbackFile: input.feedbackFile,
          event: {
            action: result.action,
            index: feedback.index,
            severity: feedback.severity,
            before: result.before,
            after: feedback.text,
          },
        });

        // display confirmation
        const actionLabel = result.action === 'update' ? 'updated' : 'saved';
        console.log(
          `\n✓ ${feedback.severity}.${feedback.index} ${actionLabel}\n`,
        );
      },
      onUndo: () => {
        const result = undoLastChange({ feedbackFile: input.feedbackFile });
        if (result.undone && result.event) {
          console.log(
            `\n↩ undid ${result.event.severity}.${result.event.index}\n`,
          );
          return {
            undone: true,
            message: `undid ${result.event.severity}.${result.event.index}`,
          };
        }
        console.log('\n↩ nothing to undo\n');
        return { undone: false, message: 'nothing to undo' };
      },
      onRedo: () => {
        const result = redoLastUndo({ feedbackFile: input.feedbackFile });
        if (result.redone && result.event) {
          console.log(
            `\n↪ redid ${result.event.severity}.${result.event.index}\n`,
          );
          return {
            redone: true,
            message: `redid ${result.event.severity}.${result.event.index}`,
          };
        }
        console.log('\n↪ nothing to redo\n');
        return { redone: false, message: 'nothing to redo' };
      },
      onExit: (summary: { feedbackCount: number }) => {
        console.log(`\n✓ ${summary.feedbackCount} feedback items saved\n`);
        process.exit(0);
      },
    }),
  );
};
