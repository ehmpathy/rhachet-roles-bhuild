import { asIndentWidth } from './asIndentWidth';
import { asMarkdownLinesRendered } from './asMarkdownLinesRendered';

// the header of the section; the dot is optional, so a vision written either way is read
const PATTERN_HEADER = /^##\s+\.?the root purpose\s*$/i;

// any h1 or h2 ends the section
const PATTERN_SECTION_END = /^#{1,2}\s/;

// an h2 header: the grain at which a vision's sections sit
const PATTERN_H2 = /^##\s/;

// a layer: `- why:` at any indent, then its text; case-blind, as the header is
const PATTERN_LAYER = /^(\s*)- why:(.*)$/i;

// a why in a form other than `- why:` — `* why:`, `+ why`, `1. why`, `- why` with no colon,
// a bold `- **why:**`, or any of these inside a `>` blockquote
const PATTERN_MALFORMED = /^\s*(>\s*)*([*+]|\d+[.)]|-)\s+(\*\*|__)?why\b/i;

// a layer whose whole text is one scaffold placeholder, e.g. `<the motive beneath it>`
const PATTERN_PLACEHOLDER = /^<[^<>]*>$/;

/**
 * .what = the lines after a header, up to the next h1/h2 (or the end)
 * .why  = a section ends where the next peer or parent header begins
 */
const asSectionLines = (input: { lines: string[]; at: number }): string[] => {
  const rest = input.lines.slice(input.at + 1);
  const end = rest.findIndex((line) => PATTERN_SECTION_END.test(line));
  if (end === -1) return rest;
  return rest.slice(0, end);
};

// one `- why:` bullet: its indent in rendered columns, and its text
type RootPurposeBullet = { indent: number; text: string };

/**
 * .what = the lines of a vision's root purpose section, comments and fenced code dropped, and
 *         whether it is the yield's first h2; null if absent
 * .why  = the section runs from its header to the next h1/h2. comments and fences drop first,
 *         across the whole yield, so neither can stand in for the header nor end the section.
 *         a reviewer reads the motive before the shape only where the section comes first
 */
const getAllRootPurposeLines = (input: {
  markdown: string;
}): { lines: string[]; isFirst: boolean; headers: number } | null => {
  const lines = asMarkdownLinesRendered({ markdown: input.markdown });
  const at = lines.findIndex((line) => PATTERN_HEADER.test(line));
  if (at === -1) return null;
  return {
    lines: asSectionLines({ lines, at }),
    isFirst: lines.findIndex((line) => PATTERN_H2.test(line)) === at,
    headers: lines.filter((line) => PATTERN_HEADER.test(line)).length,
  };
};

/**
 * .what = each `- why:` bullet in the lines, as its indent width and its text
 * .why  = indent gives the nest, read in rendered columns so a tab nests as a reader sees it;
 *         text tells a real layer from a placeholder
 */
const asRootPurposeBullets = (input: {
  lines: string[];
}): RootPurposeBullet[] =>
  input.lines.flatMap((line) => {
    const match = line.match(PATTERN_LAYER);
    if (!match) return [];
    return [
      { indent: asIndentWidth({ indent: match[1]! }), text: match[2]!.trim() },
    ];
  });

/**
 * .what = whether a bullet's text is empty or one whole `<…>` scaffold placeholder
 * .why  = an untouched scaffold layer must not count toward depth
 */
const isRootPurposePlaceholder = (input: { text: string }): boolean =>
  input.text === '' || PATTERN_PLACEHOLDER.test(input.text);

/**
 * .what = the bullets split into real layers, and the count of scaffold placeholders
 * .why  = only a real layer counts toward depth; a placeholder is scaffold left as is
 */
const getAllRootPurposeLayers = (input: {
  bullets: RootPurposeBullet[];
}): { layers: RootPurposeBullet[]; placeholders: number } => {
  const layers = input.bullets.filter(
    (bullet) => !isRootPurposePlaceholder({ text: bullet.text }),
  );
  return { layers, placeholders: input.bullets.length - layers.length };
};

// the width of a `- ` list marker: per commonmark, a child item sits at or past its parent's
// content offset, its indent plus this width; a shallower indent renders as a peer item
const LIST_MARKER_WIDTH = 2;

// per commonmark, a line this many columns or more past its container's content offset is
// indented code, or a paragraph continuation; it renders as no list item
const CODE_INDENT_WIDTH = 4;

/**
 * .what = the longest chain of layers, each nested under the one above it, and the count of
 *         layers indented so far that they render as no list item
 * .why  = depth is nest, not count: three bullets at one indent are depth 1, a bullet one column
 *         in renders flat, and a bullet 4+ columns past its parent's content renders as code
 * .note = walks the layers as a tree; the stack holds the indents of the open ancestors
 */
const getOneRootPurposeNest = (input: {
  layers: { indent: number }[];
}): { depth: number; rendered: number; unrendered: number } =>
  input.layers.reduce<{
    stack: number[];
    depth: number;
    rendered: number;
    unrendered: number;
  }>(
    (state, layer) => {
      const ancestors = state.stack.filter(
        (indent) => indent + LIST_MARKER_WIDTH <= layer.indent,
      );
      const parent = ancestors.at(-1);
      const offset = parent === undefined ? 0 : parent + LIST_MARKER_WIDTH;
      if (layer.indent - offset >= CODE_INDENT_WIDTH)
        return { ...state, unrendered: state.unrendered + 1 };
      const stack = [...ancestors, layer.indent];
      return {
        stack,
        depth: Math.max(state.depth, stack.length),
        rendered: state.rendered + 1,
        unrendered: state.unrendered,
      };
    },
    { stack: [], depth: 0, rendered: 0, unrendered: 0 },
  );

/**
 * .what = how many lines read as a why in some form other than `- why:`
 * .why  = a `* why:` or `1. why` layer would count as naught; the report names the fix
 */
const getOneRootPurposeMalformedCount = (input: { lines: string[] }): number =>
  input.lines.filter(
    (line) => !PATTERN_LAYER.test(line) && PATTERN_MALFORMED.test(line),
  ).length;

/**
 * .what = reads the root purpose a vision yield states: section, depth, placeholders
 * .why  = a deterministic read, so the depth lane — and its clamp — give one answer per input
 * .note = depth is the longest chain of real layers, each strictly deeper than the last.
 *         flat bullets at one indent are depth 1. a placeholder layer is no layer
 */
export const getOneVisionRootPurpose = (input: {
  markdown: string;
}): {
  /** whether a `## .the root purpose` header is present */
  section: 'absent' | 'present';
  /** whether the section is the yield's first h2 (false when absent) */
  isFirst: boolean;
  /** how many root purpose headers the yield renders; only the first is read */
  headers: number;
  /** the longest chain of real layers, each nested one indent under the last */
  depth: number;
  /** how many `- why:` layers count toward depth (scaffold placeholders do not) */
  layers: number;
  /** how many `- why:` bullets hold only a scaffold placeholder, or no text */
  placeholders: number;
  /** how many bullets read as a why in some other form (`* why:`, `1. why`) */
  malformed: number;
} => {
  // absent section reads as zero everywhere
  const section = getAllRootPurposeLines({ markdown: input.markdown });
  if (!section)
    return {
      section: 'absent',
      isFirst: false,
      headers: 0,
      depth: 0,
      layers: 0,
      placeholders: 0,
      malformed: 0,
    };

  // split the `- why:` bullets into real layers and placeholders
  const { layers, placeholders } = getAllRootPurposeLayers({
    bullets: asRootPurposeBullets({ lines: section.lines }),
  });

  // measure the nest, and count the whys a page does not render as list items
  const nest = getOneRootPurposeNest({ layers });
  return {
    section: 'present',
    isFirst: section.isFirst,
    headers: section.headers,
    depth: nest.depth,
    layers: nest.rendered,
    placeholders,
    malformed:
      getOneRootPurposeMalformedCount({ lines: section.lines }) +
      nest.unrendered,
  };
};
