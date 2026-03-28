import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';

import {
  type BehaviorSizeLevel,
  isTemplateInSize,
} from './getAllTemplatesBySize';

const TEMPLATES_DIR = join(__dirname, 'templates');

/**
 * .what = recursively read all files in a directory
 * .why = templates may be in subdirectories (e.g., refs/)
 */
const getAllFilesRecursive = (dir: string, prefix = ''): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...getAllFilesRecursive(join(dir, entry.name), relPath));
    } else {
      files.push(relPath);
    }
  }
  return files;
};

/**
 * .what = initialize a behavior directory with template files
 *
 * .why  = creates the thoughtroute structure for behavior-driven development
 *
 * guarantee:
 *   - creates behavior directory if not found
 *   - findserts all template files (creates if not found, skips if extant)
 *   - replaces $BEHAVIOR_DIR_REL in template content
 *   - selects templates based on size level (nano → giga)
 *   - selects guard templates based on guard level (light or heavy)
 *   - idempotent: safe to rerun
 */
export const initBehaviorDir = (input: {
  behaviorDir: string;
  behaviorDirRel: string;
  size?: BehaviorSizeLevel;
  guard?: 'light' | 'heavy';
}): { created: string[]; kept: string[] } => {
  const created: string[] = [];
  const kept: string[] = [];
  const sizeLevel = input.size ?? 'medi';
  const guardLevel = input.guard ?? 'light';

  // create behavior directory (idempotent)
  mkdirSync(input.behaviorDir, { recursive: true });

  // read all template files (recursive to include subdirectories like refs/)
  const templateFiles = getAllFilesRecursive(TEMPLATES_DIR);

  // determine which templates to process
  const templatesToProcess = computeTemplatesToProcess({
    templateFiles,
    sizeLevel,
    guardLevel,
  });

  for (const { templateName, targetName } of templatesToProcess) {
    const templatePath = join(TEMPLATES_DIR, templateName);
    const targetPath = join(input.behaviorDir, targetName);

    // create parent directory if needed (for refs/ subdirectory)
    const targetDir = dirname(targetPath);
    if (targetDir !== input.behaviorDir) {
      mkdirSync(targetDir, { recursive: true });
    }

    // findsert: skip if extant
    if (existsSync(targetPath)) {
      kept.push(targetName);
      continue;
    }

    // read template and replace variable
    let content = readFileSync(templatePath, 'utf-8');
    content = content.replace(/\$BEHAVIOR_DIR_REL/g, input.behaviorDirRel);

    // write template file
    writeFileSync(targetPath, content);
    created.push(targetName);
  }

  return { created, kept };
};

/**
 * .what = compute which templates to process based on size and guard level
 *
 * .why  = templates are filtered by size level first (nano → giga),
 *         then guard files select the .light or .heavy variant
 */
const computeTemplatesToProcess = (input: {
  templateFiles: string[];
  sizeLevel: BehaviorSizeLevel;
  guardLevel: 'light' | 'heavy';
}): Array<{ templateName: string; targetName: string }> => {
  const result: Array<{ templateName: string; targetName: string }> = [];
  const guardLevelChosenSuffix = `.${input.guardLevel}`;

  for (const templateName of input.templateFiles) {
    // check if this is a guard-level-specific template
    const isLightVariant = templateName.endsWith('.light');
    const isHeavyVariant = templateName.endsWith('.heavy');
    const isGuardLevelTemplate = isLightVariant || isHeavyVariant;

    // skip guard-level templates that don't match chosen level
    if (
      isGuardLevelTemplate &&
      !templateName.endsWith(guardLevelChosenSuffix)
    ) {
      continue;
    }

    // compute target name (strip guard level suffix if present)
    const targetName = templateName.endsWith(guardLevelChosenSuffix)
      ? templateName.slice(0, -guardLevelChosenSuffix.length)
      : templateName;

    // skip templates not in size level
    if (
      !isTemplateInSize({ templateName: targetName, size: input.sizeLevel })
    ) {
      continue;
    }

    result.push({ templateName, targetName });
  }

  return result;
};
