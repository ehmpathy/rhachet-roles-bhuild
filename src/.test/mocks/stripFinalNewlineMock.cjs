/**
 * .what = cjs shim for strip-final-newline
 * .why = strip-final-newline is esm-only but cli-test-library cjs expects require to return function
 */

function stripFinalNewline(input) {
  // handle Buffer input by convert to string first
  if (Buffer.isBuffer(input)) {
    input = input.toString();
  }

  if (typeof input !== 'string') {
    throw new TypeError(`Expected a \`string\` or \`Buffer\`, got \`${typeof input}\``);
  }

  if (input.endsWith('\n')) {
    input = input.slice(0, -1);
  }

  if (input.endsWith('\r')) {
    input = input.slice(0, -1);
  }

  return input;
}

module.exports = stripFinalNewline;
module.exports.default = stripFinalNewline;
