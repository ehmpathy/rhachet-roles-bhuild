import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { findsertWishFromInput } from './findsertWishFromInput';

describe('findsertWishFromInput', () => {
  given('[case1.5] empty file', () => {
    const scene = useBeforeAll(async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wish-test-'));
      const wishPath = path.join(tmpDir, '0.wish.md');
      fs.writeFileSync(wishPath, '');
      return { tmpDir, wishPath };
    });

    when('wish file is empty', () => {
      then('populates wish file with content', () => {
        findsertWishFromInput({
          wishInput: 'my wish content',
          wishPath: scene.wishPath,
        });

        const content = fs.readFileSync(scene.wishPath, 'utf-8');
        expect(content).toEqual('wish =\n\nmy wish content\n');
      });
    });
  });

  given('[case2] template file', () => {
    const scene = useBeforeAll(async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wish-test-'));
      const wishPath = path.join(tmpDir, '0.wish.md');
      fs.writeFileSync(wishPath, 'wish =\n');
      return { tmpDir, wishPath };
    });

    when('wish file contains template only', () => {
      then('populates wish file with content', () => {
        findsertWishFromInput({
          wishInput: 'my wish content',
          wishPath: scene.wishPath,
        });

        const content = fs.readFileSync(scene.wishPath, 'utf-8');
        expect(content).toEqual('wish =\n\nmy wish content\n');
      });
    });
  });

  given('[case3] same content (idempotent)', () => {
    const scene = useBeforeAll(async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wish-test-'));
      const wishPath = path.join(tmpDir, '0.wish.md');
      // pre-populate with expected content
      fs.writeFileSync(wishPath, 'wish =\n\nmy wish content\n');
      return { tmpDir, wishPath };
    });

    when('wish file already has same content', () => {
      then('no-op (file unchanged)', () => {
        const contentBefore = fs.readFileSync(scene.wishPath, 'utf-8');

        findsertWishFromInput({
          wishInput: 'my wish content',
          wishPath: scene.wishPath,
        });

        const contentAfter = fs.readFileSync(scene.wishPath, 'utf-8');
        expect(contentAfter).toEqual(contentBefore);
      });
    });
  });

  // note: [case1] empty input and [case4] different content call process.exit(2)
  // these are covered via acceptance tests where we can capture exit code
});
