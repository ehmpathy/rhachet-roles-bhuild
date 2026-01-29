import { normalizeDreamName } from './normalizeDreamName';

describe('normalizeDreamName', () => {
  test('lowercase conversion', () => {
    expect(normalizeDreamName({ raw: 'Config-Reload' })).toEqual(
      'config-reload',
    );
  });

  test('spaces to dashes', () => {
    expect(normalizeDreamName({ raw: 'Config Hot Reload' })).toEqual(
      'config-hot-reload',
    );
  });

  test('uppercase to lowercase', () => {
    expect(normalizeDreamName({ raw: 'CONFIG-RELOAD' })).toEqual(
      'config-reload',
    );
  });

  test('special chars to dashes', () => {
    expect(normalizeDreamName({ raw: 'config@reload!' })).toEqual(
      'config-reload',
    );
  });

  test('collapse consecutive dashes', () => {
    expect(normalizeDreamName({ raw: 'config--reload' })).toEqual(
      'config-reload',
    );
  });

  test('collapse dashes from multiple special chars', () => {
    expect(normalizeDreamName({ raw: 'config@@reload' })).toEqual(
      'config-reload',
    );
  });

  test('trim edge dashes', () => {
    expect(normalizeDreamName({ raw: '-config-' })).toEqual('config');
  });

  test('trim edge dashes from special chars', () => {
    expect(normalizeDreamName({ raw: '@config@' })).toEqual('config');
  });

  test('already kebab-case passes through', () => {
    expect(normalizeDreamName({ raw: 'config-reload' })).toEqual(
      'config-reload',
    );
  });

  test('numbers are preserved', () => {
    expect(normalizeDreamName({ raw: 'config2reload' })).toEqual(
      'config2reload',
    );
  });

  test('mixed input', () => {
    expect(normalizeDreamName({ raw: 'Config@Hot Reload!' })).toEqual(
      'config-hot-reload',
    );
  });
});
