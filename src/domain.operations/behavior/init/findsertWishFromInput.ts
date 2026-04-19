import { readFileSync, writeFileSync } from 'fs';
import { relative } from 'path';

/**
 * .what = validates wish input and findserts into wish file
 * .why = findsert semantics: same = no-op, template = populate, different = error
 */
export const findsertWishFromInput = (input: {
  wishInput: string;
  wishPath: string;
}): void => {
  // validate non-empty
  if (!input.wishInput.trim()) {
    console.error('error: --wish requires content');
    process.exit(2); // constraint error: user must fix
  }

  // findsert semantics
  const wishExpected = `wish =\n\n${input.wishInput}\n`;
  const wishCurrent = readFileSync(input.wishPath, 'utf-8');
  const wishPathRel = relative(process.cwd(), input.wishPath);

  if (wishCurrent === wishExpected) {
    // already populated with same content — no-op (idempotent)
    return;
  }

  if (wishCurrent.trim() === 'wish =' || wishCurrent.trim() === '') {
    // template or empty — populate
    writeFileSync(input.wishPath, wishExpected);
    return;
  }

  // different content — error
  console.error('error: wish file has been modified');
  console.error('');
  console.error('to overwrite, delete the wish file first:');
  console.error(`  rm ${wishPathRel}`);
  process.exit(2); // constraint error: user must fix
};
