import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import { appendOntoDream } from './appendOntoDream';

describe('appendOntoDream', () => {
  const tempDir = path.join(os.tmpdir(), 'appendOntoDream-test');
  const dreamDir = path.join(tempDir, '.dream');

  beforeEach(() => {
    // clean up and recreate temp dir before each test
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(dreamDir, { recursive: true });
  });

  afterAll(() => {
    // clean up temp dir after all tests
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('appends content with separator', () => {
    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');
    fs.writeFileSync(filepath, 'dream = original content', 'utf-8');

    const dream = new DreamArtifact({
      path: filepath,
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    appendOntoDream({
      dream,
      content: 'appended content',
    });

    const result = fs.readFileSync(filepath, 'utf-8');
    expect(result).toEqual(
      'dream = original content\n\n---\n\nappended content',
    );
  });

  test('preserves prior content', () => {
    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');
    const originalContent = 'dream = \n\nfirst thought\nsecond thought';
    fs.writeFileSync(filepath, originalContent, 'utf-8');

    const dream = new DreamArtifact({
      path: filepath,
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    appendOntoDream({
      dream,
      content: 'new idea',
    });

    const result = fs.readFileSync(filepath, 'utf-8');
    expect(result).toContain(originalContent);
    expect(result).toContain('new idea');
  });

  test('handles multiline content', () => {
    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');
    fs.writeFileSync(filepath, 'dream = ', 'utf-8');

    const dream = new DreamArtifact({
      path: filepath,
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    appendOntoDream({
      dream,
      content: 'line one\nline two\nline three',
    });

    const result = fs.readFileSync(filepath, 'utf-8');
    expect(result).toContain('line one\nline two\nline three');
  });
});
