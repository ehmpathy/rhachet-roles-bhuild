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
 *   - idempotent: safe to rerun
 */
export const initBehaviorDir = (input: {
  behaviorDir: string;
  behaviorDirRel: string;
}): { created: string[]; kept: string[] } => {
  const created: string[] = [];
  const kept: string[] = [];

  // create behavior directory (idempotent)
  mkdirSync(input.behaviorDir, { recursive: true });

  // read all template files
  const templateFiles = readdirSync(TEMPLATES_DIR);

  for (const templateName of templateFiles) {
    const templatePath = join(TEMPLATES_DIR, templateName);
    const targetPath = join(input.behaviorDir, templateName);

    // findsert: skip if exists
    if (existsSync(targetPath)) {
      kept.push(templateName);
      continue;
    }

    // read template and replace variable
    let content = readFileSync(templatePath, 'utf-8');
    content = content.replace(/\$BEHAVIOR_DIR_REL/g, input.behaviorDirRel);

    // write template file
    writeFileSync(targetPath, content);
    created.push(templateName);
  }

  return { created, kept };
};
