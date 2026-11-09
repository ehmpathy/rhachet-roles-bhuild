// a fenced code block opener or closer: its run of backticks or tildes, then the rest.
// any indent, so a fence nested in a list item is read as a fence too
const PATTERN_FENCE = /^\s*(`{3,}|~{3,})(.*)$/;

// a whole html comment span within one line
const PATTERN_COMMENT_INLINE = /<!--[\s\S]*?-->/g;

const COMMENT_OPEN = '<!--';
const COMMENT_CLOSE = '-->';

/**
 * .what = whether a fence line closes the fence a given opener began
 * .why  = per commonmark, only a run of the same char, at least as long, with naught after it
 *         closes a fence; so a ```` block can hold a ``` block whole
 */
const isFenceClose = (input: { opener: string; line: string }): boolean => {
  const match = input.line.match(PATTERN_FENCE);
  if (!match) return false;
  const run = match[1]!;
  return (
    run[0] === input.opener[0] &&
    run.length >= input.opener.length &&
    match[2]!.trim() === ''
  );
};

// an inline code span: a run of backticks, its text, and a matched close run
const PATTERN_CODE_SPAN = /(`+)[^`]*?\1/g;

/**
 * .what = the line with each inline code span's chars swapped for a filler of equal length
 * .why  = per commonmark, a code span binds tighter than raw html, so a `<!--` inside
 *         backticks is literal text; the mask hides it from the comment scan, and keeps each
 *         index, so a cut found on the mask applies to the line itself
 */
const asLineWithCodeSpansMasked = (input: { line: string }): string =>
  input.line.replace(PATTERN_CODE_SPAN, (span) => '\u0000'.repeat(span.length));

/**
 * .what = the text with each given [start, end) range removed
 * .why  = the ranges are utf-16 offsets (a regex match index), so the cut is on the string
 *         itself; a cut on its code points would land off by one per astral char before it
 */
const asTextWithoutRanges = (input: {
  text: string;
  ranges: [number, number][];
}): string =>
  input.ranges.reduceRight(
    (text, [start, end]) => text.slice(0, start) + text.slice(end),
    input.text,
  );

/**
 * .what = a line outside any block, with its whole comment spans dropped, split at an unclosed
 *         comment opener
 * .why  = text before an unclosed `<!--` still renders; the rest of the line opens a comment.
 *         the scan reads a mask of the line, so a `<!--` in a code span opens naught
 */
const asLineOutsideBlocks = (input: {
  line: string;
}): { kept: string; isCommentOpen: boolean } => {
  const mask = asLineWithCodeSpansMasked({ line: input.line });
  const ranges = [...mask.matchAll(PATTERN_COMMENT_INLINE)].map(
    (match): [number, number] => [match.index, match.index + match[0].length],
  );
  const line = asTextWithoutRanges({ text: input.line, ranges });
  const at = asTextWithoutRanges({ text: mask, ranges }).indexOf(COMMENT_OPEN);
  if (at === -1) return { kept: line, isCommentOpen: false };
  return { kept: line.slice(0, at), isCommentOpen: true };
};

/**
 * .what = the rest of a line after the comment close it holds; null when it holds none
 * .note = no code-span mask here: inside a comment, backticks are raw text, so a `-->` in
 *         them still closes it, as a rendered page does
 */
const asLineAfterCommentClose = (input: { line: string }): string | null => {
  const at = input.line.indexOf(COMMENT_CLOSE);
  if (at === -1) return null;
  return input.line.slice(at + COMMENT_CLOSE.length);
};

/**
 * .what = the opener run of a fence line; null when the line opens no fence
 * .why  = per commonmark, a backtick fence's info string holds no backtick, so a line that
 *         opens with inline code (```x``` text) opens no fence
 */
const asFenceOpener = (input: { line: string }): string | null => {
  const match = input.line.match(PATTERN_FENCE);
  if (!match) return null;
  const run = match[1]!;
  if (run[0] === '`' && match[2]!.includes('`')) return null;
  return run;
};

/**
 * .what = the kept lines, plus the given text where it holds aught but blank
 * .why  = text cut beside a comment is kept only if a reader would see words there
 */
const asKeptWithText = (input: { kept: string[]; text: string }): string[] =>
  input.text.trim() === '' ? input.kept : [...input.kept, input.text];

type LineState = {
  block: 'none' | 'comment' | { opener: string };
  kept: string[];
};

/**
 * .what = the next state for a line read inside a comment
 * .why  = the line is dropped until the close; the rest of the close line is read afresh
 */
const asLineStateInComment = (input: {
  state: LineState;
  line: string;
}): LineState => {
  const rest = asLineAfterCommentClose({ line: input.line });
  if (rest === null) return input.state;
  const outside = asLineOutsideBlocks({ line: rest });
  return {
    block: outside.isCommentOpen ? 'comment' : 'none',
    kept: asKeptWithText({ kept: input.state.kept, text: outside.kept }),
  };
};

/**
 * .what = the next state for a line read inside a fence
 * .why  = the line is dropped; the fence closes only on a match for its opener
 */
const asLineStateInFence = (input: {
  state: LineState & { block: { opener: string } };
  line: string;
}): LineState =>
  isFenceClose({ opener: input.state.block.opener, line: input.line })
    ? { block: 'none', kept: input.state.kept }
    : input.state;

/**
 * .what = the next state for a line read outside any block
 * .why  = a fence line opens a fence; all else is kept less its comments, and an unclosed
 *         comment opens a comment
 */
const asLineStateOutside = (input: {
  state: LineState;
  line: string;
}): LineState => {
  const opener = asFenceOpener({ line: input.line });
  if (opener !== null) return { block: { opener }, kept: input.state.kept };
  const outside = asLineOutsideBlocks({ line: input.line });
  if (!outside.isCommentOpen)
    return { block: 'none', kept: [...input.state.kept, outside.kept] };
  return {
    block: 'comment',
    kept: asKeptWithText({ kept: input.state.kept, text: outside.kept }),
  };
};

/**
 * .what = the lines a reader of the rendered page sees: fenced code and html comments dropped
 * .why  = a `- why:` inside a fence is an example and inside a comment is hidden; neither is
 *         a layer, a header, or a section end
 * .note = one pass, so whichever block opens first wins, as on a rendered page: a `<!--` inside
 *         a fence is code, and a fence line inside a comment is hidden
 */
export const asMarkdownLinesRendered = (input: {
  markdown: string;
}): string[] =>
  input.markdown.split(/\r?\n/).reduce<LineState>(
    (state, line) => {
      if (state.block === 'comment')
        return asLineStateInComment({ state, line });
      if (state.block !== 'none')
        return asLineStateInFence({
          state: { block: state.block, kept: state.kept },
          line,
        });
      return asLineStateOutside({ state, line });
    },
    { block: 'none', kept: [] },
  ).kept;
