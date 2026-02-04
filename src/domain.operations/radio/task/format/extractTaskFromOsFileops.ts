import type { IsoDateStamp } from 'iso-time';

import { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import {
  isRadioTaskStatus,
  type RadioTaskStatus,
} from '../../../../domain.objects/RadioTaskStatus';

/**
 * .what = extract RadioTask from local task file content
 * .why = parse yaml frontmatter and body from os.fileops format
 */
export const extractTaskFromOsFileops = (input: {
  content: string;
}): RadioTask => {
  const { content } = input;

  // extract frontmatter between --- markers
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch || !frontmatterMatch[1])
    throw new Error('invalid os.fileops task format: no frontmatter');

  const frontmatter = frontmatterMatch[1];

  // parse frontmatter fields
  const parseField = (name: string): string | null => {
    const match = frontmatter.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
    if (!match || match[1] === undefined) return null;
    const value = match[1].trim();
    if (value === 'null') return null;
    // remove quotes if present
    return value.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
  };

  const exid = parseField('exid');
  if (!exid) throw new Error('invalid os.fileops task format: no exid');

  const title = parseField('title');
  if (!title) throw new Error('invalid os.fileops task format: no title');

  const statusRaw = parseField('status');
  if (!statusRaw || !isRadioTaskStatus(statusRaw))
    throw new Error(
      `invalid os.fileops task format: invalid status "${statusRaw}"`,
    );
  const status = statusRaw as RadioTaskStatus;

  const repoRaw = parseField('repo');
  if (!repoRaw) throw new Error('invalid os.fileops task format: no repo');
  const [owner, name] = repoRaw.split('/');
  if (!owner || !name)
    throw new Error(
      `invalid os.fileops task format: invalid repo "${repoRaw}"`,
    );
  const repo = new RadioTaskRepo({ owner, name });

  const pushedBy = parseField('pushed_by');
  if (!pushedBy)
    throw new Error('invalid os.fileops task format: no pushed_by');

  const pushedAt = parseField('pushed_at') as IsoDateStamp | null;
  if (!pushedAt)
    throw new Error('invalid os.fileops task format: no pushed_at');

  const claimedBy = parseField('claimed_by');
  const claimedAt = parseField('claimed_at') as IsoDateStamp | null;
  const deliveredAt = parseField('delivered_at') as IsoDateStamp | null;
  const branch = parseField('branch');

  // extract description from body (after "---" separator in body)
  const bodyStart = content.indexOf('---', content.indexOf('---') + 3);
  const body = bodyStart >= 0 ? content.slice(bodyStart + 3).trim() : '';
  const bodyParts = body.split(/\n---\n/);
  const descriptionPart = bodyParts[bodyParts.length - 1]?.trim() ?? '';
  // description is after the title line
  const descriptionLines = descriptionPart.split('\n');
  const titleLineIndex = descriptionLines.findIndex(
    (line) => line.trim() === title,
  );
  const description =
    titleLineIndex >= 0
      ? descriptionLines
          .slice(titleLineIndex + 1)
          .join('\n')
          .trim()
      : descriptionPart;

  return new RadioTask({
    exid,
    title,
    description,
    status,
    repo,
    pushedBy,
    pushedAt,
    claimedBy,
    claimedAt,
    deliveredAt,
    branch,
  });
};
