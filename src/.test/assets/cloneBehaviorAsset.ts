import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/**
 * .what = path to the example behaviors assets directory
 */
export const EXAMPLE_BEHAVIORS_DIR = path.join(__dirname, 'example.behaviors');

/**
 * .what = available example behavior names
 */
export type ExampleBehaviorName =
  | 'automate-deploys'
  | 'dev-tooling'
  | 'add-cdn'
  | 'add-docs'
  | 'add-util'
  | 'add-readme'
  | 'test-feature'
  | 'feature-auth'
  | 'feature-dashboard'
  | 'standalone-feature'
  | 'premium-tier'
  | 'db-migration';

/**
 * .what = clones a behavior asset to a temp directory for testing
 * .why = enables reuse of static test assets across tests without ad-hoc file creation
 */
export const cloneBehaviorAsset = async (input: {
  behaviorName: ExampleBehaviorName;
  suffix?: string;
}): Promise<{
  tempDir: string;
  files: { uri: string }[];
}> => {
  // create unique temp dir
  const suffix = input.suffix ?? Date.now().toString();
  const tempDir = path.join(os.tmpdir(), `test-${input.behaviorName}-${suffix}`);
  await fs.mkdir(tempDir, { recursive: true });

  // copy files from asset to temp dir
  const assetDir = path.join(EXAMPLE_BEHAVIORS_DIR, input.behaviorName);
  const entries = await fs.readdir(assetDir);

  const files: { uri: string }[] = [];
  for (const entry of entries) {
    const srcPath = path.join(assetDir, entry);
    const destPath = path.join(tempDir, entry);
    await fs.copyFile(srcPath, destPath);
    files.push({ uri: destPath });
  }

  return { tempDir, files };
};
