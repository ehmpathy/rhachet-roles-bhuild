import type { FeedbackTakeGetResult } from '../feedback/feedbackTakeGet';

/**
 * .what = compute feedback.take.get output with tree format
 * .why = friendly output for feedback.take.get skill
 */
export const computeFeedbackTakeGetOutput = (input: {
  result: FeedbackTakeGetResult;
  mode: 'list' | 'hook.onStop';
  behavior: string;
}): string | null => {
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';
  const red = '\x1b[31m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';

  // hook.onStop with no open feedback = silent (no output per vision)
  const openCount = input.result.unresponded + input.result.stale;
  if (input.mode === 'hook.onStop' && openCount === 0) {
    return null;
  }

  // build output lines
  const lines: string[] = [];

  // mascot header (sets vibe)
  if (input.mode === 'hook.onStop') {
    lines.push(`🦫 hold up...`);
  } else {
    lines.push(`🦫 roight,`);
  }

  // blank line between mascot and artifact
  lines.push('');

  // artifact header (resolved inputs) - at root level
  const whenFlag = input.mode === 'hook.onStop' ? ' --when hook.onStop' : '';
  lines.push(`🌲 feedback.take.get${whenFlag} --behavior ${input.behavior}`);

  // summary
  const total = input.result.feedback.length;

  if (total === 0) {
    lines.push(`   └─ ${dim}no feedback files found${reset}`);
    return lines.join('\n');
  }

  lines.push(
    `   ├─ ${openCount > 0 ? red : green}${openCount} open${reset} / ${total} total`,
  );

  // separate feedback by status
  const unresponded = input.result.feedback.filter(
    (fb) => fb.status.status === 'unresponded',
  );
  const stale = input.result.feedback.filter(
    (fb) => fb.status.status === 'stale',
  );
  const responded = input.result.feedback.filter(
    (fb) => fb.status.status === 'responded',
  );

  // show unresponded first (most urgent)
  if (unresponded.length > 0) {
    lines.push(`   ├─ ${red}unresponded:${reset}`);
    for (const fb of unresponded) {
      const isLast =
        fb === unresponded[unresponded.length - 1] &&
        stale.length === 0 &&
        responded.length === 0;
      const prefix = isLast ? '└─' : '├─';
      lines.push(`   │  ${prefix} ${fb.givenPathRel}`);
    }
  }

  // show stale (needs re-response)
  if (stale.length > 0) {
    lines.push(`   ├─ ${yellow}stale (updated):${reset}`);
    for (const fb of stale) {
      const isLast = fb === stale[stale.length - 1] && responded.length === 0;
      const prefix = isLast ? '└─' : '├─';
      lines.push(`   │  ${prefix} ${fb.givenPathRel}`);
    }
  }

  // show responded (done)
  if (responded.length > 0 && input.mode === 'list') {
    lines.push(`   └─ ${green}responded:${reset}`);
    for (const fb of responded) {
      const isLast = fb === responded[responded.length - 1];
      const prefix = isLast ? '└─' : '├─';
      const takenPath =
        fb.status.status === 'responded' ? fb.status.takenPath : '';
      lines.push(
        `      ${prefix} ${fb.givenPathRel} ${dim}→ ${takenPath}${reset}`,
      );
    }
  }

  // hook.onStop mode adds instruction
  if (input.mode === 'hook.onStop' && openCount > 0) {
    lines.push('');
    lines.push(
      `${red}✋ respond to all feedback before you finish your work${reset}`,
    );
    lines.push('');
    lines.push(`use: rhx feedback.take.set --from <given> --into <taken>`);
  }

  return lines.join('\n');
};
