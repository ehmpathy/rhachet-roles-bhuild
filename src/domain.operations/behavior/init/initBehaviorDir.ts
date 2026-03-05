import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

const TEMPLATES_DIR = join(__dirname, 'templates');

/**
 * .what = initialize a behavior directory with template files
 *
 * .why  = creates the thoughtroute structure for behavior-driven development
 *
 * guarantee:
 *   - creates behavior directory if not found
 *   - findserts all template files (creates if not found, skips if exists)
 *   - replaces $BEHAVIOR_DIR_REL in template content
 *   - selects guard templates based on guard level (light or heavy)
 *   - idempotent: safe to rerun
 */
export const initBehaviorDir = (input: {
  behaviorDir: string;
  behaviorDirRel: string;
  guard?: 'light' | 'heavy';
}): { created: string[]; kept: string[] } => {
  const created: string[] = [];
  const kept: string[] = [];
  const guardLevel = input.guard ?? 'light';

  // create behavior directory (idempotent)
  mkdirSync(input.behaviorDir, { recursive: true });

  // read all template files
  const templateFiles = readdirSync(TEMPLATES_DIR);

  // determine which templates to process
  const templatesToProcess = computeTemplatesToProcess({
    templateFiles,
    guardLevel,
  });

  for (const { templateName, targetName } of templatesToProcess) {
    const templatePath = join(TEMPLATES_DIR, templateName);
    const targetPath = join(input.behaviorDir, targetName);

    // findsert: skip if exists
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
 * .what = compute which templates to process based on guard level
 *
 * .why  = guard files come in .light and .heavy variants; this selects
 *         the appropriate variant and maps it to the base filename
 */
const computeTemplatesToProcess = (input: {
  templateFiles: string[];
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

    // handle guard templates with level suffix - strip suffix for target name
    if (templateName.endsWith(guardLevelChosenSuffix)) {
      const targetName = templateName.slice(0, -guardLevelChosenSuffix.length);
      result.push({ templateName, targetName });
      continue;
    }

    // regular templates (no suffix) - use as-is
    result.push({ templateName, targetName: templateName });
  }

  return result;
};
