import { readdirSync } from 'fs';
import { join } from 'path';

import { BehaviorArtifact } from '../../../domain.objects/BehaviorArtifact';

/**
 * .what = resolve the latest artifact by name from a behavior directory
 * .why = enables feedback to target the most recent version of any artifact
 *
 * .note = version precedence:
 *         - v3.i2 > v2.i3 (version wins)
 *         - v2.i3 > v2.i1 (latest attempt within version)
 *         - files with [feedback] in name are excluded
 */
export const getLatestArtifactByName = (
  input: { behaviorDir: string; artifactName: string },
  context?: { cwd?: string },
): BehaviorArtifact | null => {
  // read directory contents
  const files = readdirSync(input.behaviorDir);

  // build pattern to match artifact files
  // matches: *.<artifactName>[.suffix]*.md where artifactName is followed by . then optional segments
  const artifactPattern = new RegExp(
    `\\.${escapeRegex(input.artifactName)}(?:\\.[^.]+)*\\.md$`,
    'i',
  );

  // parse version/attempt from filename pattern: .v{version}.i{attempt}
  const versionPattern = /\.v(\d+)/;
  const attemptPattern = /\.i(\d+)/;

  // collect artifacts that match the pattern
  const artifactsMatched: Array<{
    path: string;
    name: string;
    version: number | null;
    attempt: number | null;
    filename: string;
  }> = [];

  for (const file of files) {
    // skip if doesn't match artifact name pattern
    if (!artifactPattern.test(file)) continue;

    // skip feedback files
    if (file.includes('[feedback]')) continue;

    // skip .src files
    if (file.endsWith('.src')) continue;

    // parse version and attempt
    const versionMatch = file.match(versionPattern);
    const attemptMatch = file.match(attemptPattern);

    artifactsMatched.push({
      path: join(input.behaviorDir, file),
      name: input.artifactName,
      version: versionMatch?.[1] ? parseInt(versionMatch[1], 10) : null,
      attempt: attemptMatch?.[1] ? parseInt(attemptMatch[1], 10) : null,
      filename: file,
    });
  }

  if (artifactsMatched.length === 0) return null;

  // sort by version desc, then attempt desc
  // null versions/attempts come last
  artifactsMatched.sort((a, b) => {
    // compare versions
    const vA = a.version ?? -1;
    const vB = b.version ?? -1;
    if (vA !== vB) return vB - vA;

    // compare attempts
    const iA = a.attempt ?? -1;
    const iB = b.attempt ?? -1;
    return iB - iA;
  });

  // return latest as BehaviorArtifact
  const latest = artifactsMatched[0];
  if (!latest) return null;

  return new BehaviorArtifact({
    path: latest.path,
    name: latest.name,
    version: latest.version,
    attempt: latest.attempt,
    filename: latest.filename,
  });
};

/**
 * .what = escape special regex characters in a string
 * .why = enables safe use of artifact names in regex patterns
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
