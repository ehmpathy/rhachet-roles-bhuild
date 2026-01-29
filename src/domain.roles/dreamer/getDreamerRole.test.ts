import { ROLE_DREAMER } from './getDreamerRole';

describe('ROLE_DREAMER', () => {
  test('has correct slug', () => {
    expect(ROLE_DREAMER.slug).toEqual('dreamer');
  });

  test('has correct name', () => {
    expect(ROLE_DREAMER.name).toEqual('Dreamer');
  });

  test('has purpose defined', () => {
    expect(ROLE_DREAMER.purpose).toContain('capture');
    expect(ROLE_DREAMER.purpose).toContain('focus');
  });

  test('has skills directory defined', () => {
    const dirs = ROLE_DREAMER.skills.dirs;
    expect(Array.isArray(dirs)).toBe(true);
    if (Array.isArray(dirs)) {
      expect(dirs).toHaveLength(1);
      expect(dirs[0]!.uri).toContain('skills');
    }
  });
});
