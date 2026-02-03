import type { IsoDateStamp } from 'iso-time';

import { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';

/**
 * .what = extract RadioTask from github issue data
 * .why = parse structured data from gh.issues api response
 */
export const extractTaskFromGhIssues = (input: {
  issueNumber: string;
  title: string;
  body: string;
  state: 'open' | 'closed';
  assignees: string[];
  repo: RadioTaskRepo;
  createdAt: IsoDateStamp;
  createdBy: string;
}): RadioTask => {
  // extract task title from issue title (remove "🎙️ task - " prefix)
  const taskTitle = input.title.replace(/^🎙️\s*task\s*-\s*/i, '').trim();

  // extract branch from body if present
  const branchMatch = input.body.match(
    /🌲\s+tree\s+(?:planted|delivered)\s+at\s+(\S+)/,
  );
  const branch = branchMatch?.[1] ?? null;

  // determine status from state and body content
  const status = (() => {
    if (input.state === 'closed') return RadioTaskStatus.DELIVERED;
    if (branchMatch?.includes('delivered')) return RadioTaskStatus.DELIVERED;
    if (branchMatch?.includes('planted')) return RadioTaskStatus.CLAIMED;
    if (input.assignees.length > 0) return RadioTaskStatus.CLAIMED;
    return RadioTaskStatus.QUEUED;
  })();

  // extract description from body (after "**description**" header)
  const descriptionMatch = input.body.match(
    /\*\*description\*\*\s*\n\n?([\s\S]*?)$/,
  );
  const description = descriptionMatch?.[1]?.trim() ?? '';

  // extract claimed info
  const claimedBy = input.assignees[0] ?? null;
  const claimedAt =
    status === RadioTaskStatus.CLAIMED || status === RadioTaskStatus.DELIVERED
      ? (input.createdAt as IsoDateStamp) // approximation; actual claim time not available
      : null;

  // extract delivered info
  const deliveredAt =
    status === RadioTaskStatus.DELIVERED
      ? (input.createdAt as IsoDateStamp) // approximation
      : null;

  return new RadioTask({
    exid: input.issueNumber,
    title: taskTitle,
    description,
    status,
    repo: input.repo,
    pushedBy: input.createdBy,
    pushedAt: input.createdAt,
    claimedBy,
    claimedAt,
    deliveredAt,
    branch,
  });
};
