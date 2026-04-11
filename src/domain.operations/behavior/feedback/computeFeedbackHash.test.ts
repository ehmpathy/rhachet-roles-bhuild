import { computeFeedbackHash } from './computeFeedbackHash';

const TEST_CASES = [
  {
    description: 'hashes simple content',
    given: { content: 'hello world' },
    expect: {
      // sha256('hello world') = b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
      output:
        'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    },
  },
  {
    description: 'hashes empty string',
    given: { content: '' },
    expect: {
      // sha256('') = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      output:
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  },
  {
    description: 'hashes multiline content',
    given: {
      content: `# feedback

this is multiline feedback
with several lines`,
    },
    expect: {
      // sha256 of the multiline content
      output:
        '48c881203ea2462329e0a9dba4eabfbcb5d9c121391e5422c2e091244fca95fd',
    },
  },
  {
    description: 'different content produces different hash',
    given: { content: 'hello world!' },
    expect: {
      // sha256('hello world!') != sha256('hello world')
      notEqual:
        'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    },
  },
];

describe('computeFeedbackHash', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = computeFeedbackHash(thisCase.given);
      if ('output' in thisCase.expect) {
        expect(output).toEqual(thisCase.expect.output);
      }
      if ('notEqual' in thisCase.expect) {
        expect(output).not.toEqual(thisCase.expect.notEqual);
      }
      // always check it's a valid sha256 hex string (64 chars)
      expect(output).toMatch(/^[a-f0-9]{64}$/);
    }),
  );
});
