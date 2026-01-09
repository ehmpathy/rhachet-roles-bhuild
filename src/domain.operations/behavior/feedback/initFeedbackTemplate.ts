import { readFileSync, writeFileSync } from 'fs';

/**
 * .what = initialize a feedback file from a template with placeholder substitution
 * .why = enables consistent feedback file creation with behavior-specific values
 */
export const initFeedbackTemplate = (input: {
  templatePath: string;
  targetPath: string;
  artifactFileName: string;
  behaviorDirRel: string;
}): void => {
  // read template content
  const templateContent = readFileSync(input.templatePath, 'utf-8');

  // replace placeholders with actual values
  const content = templateContent
    .replace(/\$BEHAVIOR_REF_NAME/g, input.artifactFileName)
    .replace(/\$BEHAVIOR_DIR_REL/g, input.behaviorDirRel);

  // write to target path
  writeFileSync(input.targetPath, content, 'utf-8');
};
