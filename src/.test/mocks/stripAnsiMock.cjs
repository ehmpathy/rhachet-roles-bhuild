/**
 * .what = cjs shim for strip-ansi
 * .why = strip-ansi is esm-only but cli-test-library cjs expects require to return function
 */

// ansi escape sequence regex (from ansi-regex package)
const ansiPattern = [
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
].join('|');

const ansiRegex = new RegExp(ansiPattern, 'g');

function stripAnsi(string) {
  if (typeof string !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(ansiRegex, '');
}

module.exports = stripAnsi;
module.exports.default = stripAnsi;
