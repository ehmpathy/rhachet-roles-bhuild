import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = ensures dispatch output directory exists with readme
 * .why = idempotent initialization for first-run and subsequent runs
 */
export const findsertBehaviorDispatchDir = async (input: {
  outputDir: string;
}): Promise<void> => {
  // create output directory if it doesn't exist
  await fs.mkdir(input.outputDir, { recursive: true });

  // create readme if it doesn't exist
  const readmePath = path.join(input.outputDir, 'readme.md');
  const readmeExists = await fs
    .stat(readmePath)
    .then(() => true)
    .catch(() => false);

  if (!readmeExists) {
    await fs.writeFile(readmePath, DISPATCH_README_CONTENT);
  }

  // create subdirectories
  await fs.mkdir(path.join(input.outputDir, '.gathered'), { recursive: true });
  await fs.mkdir(path.join(input.outputDir, '.deptraced'), { recursive: true });
  await fs.mkdir(path.join(input.outputDir, '.measured'), { recursive: true });
  await fs.mkdir(path.join(input.outputDir, '.triaged'), { recursive: true });
  await fs.mkdir(path.join(input.outputDir, '.archive'), { recursive: true });
};

const DISPATCH_README_CONTENT = `# .dispatch output

this directory contains dispatcher skill outputs.

## cache behavior

the .* directories (.gathered/, .deptraced/, .measured/, .triaged/) are caches.
they are reused in subsequent invocations to maximize efficiency:

- only behaviors with changed contentHash are reprocessed
- unchanged behaviors reuse cached results
- delete a .* directory to force recomputation of that stage

## archive behavior

when outputs change, prior versions are archived to .archive/:

- files are named {filename}.{isoTimestamp}.bak.md
- unchanged runs do not create archives
- archives are sorted by timestamp (ls shows history)

## files

- prioritization.md: human-readable summary of triaged behaviors
- prioritization.json: machine-readable data for downstream tools
- dependencies.md: dependency tree per behavior
- coordination.md: workstream map (after coordinate skill)
- coordination.json: machine-readable workstream data
`;
