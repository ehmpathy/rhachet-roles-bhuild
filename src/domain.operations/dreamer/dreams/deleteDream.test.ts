import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DreamArtifact } from '../../../domain.objects/dreamer/DreamArtifact';
import { deleteDream } from './deleteDream';

describe('deleteDream', () => {
  const tempDir = path.join(os.tmpdir(), 'deleteDream-test');
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

  test('deletes the dream file', () => {
    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');
    fs.writeFileSync(filepath, 'dream = ', 'utf-8');

    const dream = new DreamArtifact({
      path: filepath,
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    expect(fs.existsSync(filepath)).toBe(true);

    deleteDream({ dream });

    expect(fs.existsSync(filepath)).toBe(false);
  });

  test('is idempotent when file does not exist', () => {
    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');

    const dream = new DreamArtifact({
      path: filepath,
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    // should not throw
    expect(() => deleteDream({ dream })).not.toThrow();
  });

  test('is idempotent when called twice', () => {
    const filepath = path.join(dreamDir, '2026_01_27.config-reload.dream.md');
    fs.writeFileSync(filepath, 'dream = ', 'utf-8');

    const dream = new DreamArtifact({
      path: filepath,
      name: 'config-reload',
      date: '2026_01_27',
      filename: '2026_01_27.config-reload.dream.md',
    });

    deleteDream({ dream });
    expect(fs.existsSync(filepath)).toBe(false);

    // second call should not throw
    expect(() => deleteDream({ dream })).not.toThrow();
  });
});
