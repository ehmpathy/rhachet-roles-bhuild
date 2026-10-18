/**
 * .what = the catalog of archaeology tells, and the scan that locates them in a yield
 * .why  = `rule.require.archaeology-in-notes` offers a third verdict — MOVE — that a reviewer
 *         can state and a driver can ignore. a lint that NAMES the line converts that verdict
 *         into a located, checkable finding, at $0.
 */

export type ArchaeologyGrade = 'blocker' | 'nitpick';

export interface ArchaeologyMarker {
  slug: string;
  grade: ArchaeologyGrade;
  what: string;
  pattern: RegExp;
}

export interface ArchaeologyPoint {
  path: string;
  line: number;
  slug: string;
  grade: ArchaeologyGrade;
  what: string;
  text: string;
}

/**
 * .what = one entry per tell, each a shape a yield states about its own road
 * .why  = every blocker below asserts something ONLY the author's process can explain — a
 *         reader who wants the decision cannot act on it. every nitpick is a word whose
 *         referent is a moment rather than a state, so it rots.
 */
export const ARCHAEOLOGY_MARKERS: ArchaeologyMarker[] = [
  {
    slug: 'retraction',
    grade: 'blocker',
    what: 'a claim the artifact made and withdrew — the reader needs the claim that stands',
    pattern:
      /\b(i had (written|claimed|recorded|said)|an earlier draft|a (prior|previous) (draft|version|pass)|(falsified|refuted) (my|its|the) own|i was wrong|turned out (to be )?wrong|(this|that) claim was wrong|on (reflection|second thought)|in hindsight|i (mis)?(read|judged) (it|this|that)|(reconsidered|reversed) (my|the) (call|verdict|position|stance|claim)|walked (it|this|that) back|struck (this|that|it) (out|outright)|i retract)\b/i,
  },
  {
    slug: 'attempt-trail',
    grade: 'blocker',
    what: 'the paths tried before the one that held — state the outcome, ref the trail',
    pattern:
      /\b(we (first )?tried|i (first )?tried|first we|then we (tried|switched|moved|landed)|after (several|three|two|many) attempts|landed on (it|this|that) after|at first (i|we)|(i|we) abandoned|gave up on|(i|we) (dropped|discarded) (the|this|that)|my first (attempt|pass|cut|draft))\b/i,
  },
  {
    slug: 'confidence-trajectory',
    grade: 'blocker',
    what: 'a confidence that moved — the reader acts on where it landed, never on its path',
    pattern:
      /\d{1,3}\s*%\s*(→|->|to)\s*(\*\*)?\s*\d{1,3}\s*%|\bconfidence (rose|grew|climbed|fell|dropped|moved|shifted)|grew (more|less) (confident|sure)|(more|less) (confident|sure) than (i|we|before)/i,
  },
  {
    slug: 'iteration-ref',
    grade: 'blocker',
    what: 'a reference to a review round — a round is archaeology by definition',
    pattern:
      /\b(i\d{3}\b|iteration \d+|on the (first|second|third|fourth|fifth|next|last) (round|pass|iteration)|round \d+ (of|showed|found)|after \d+ (rounds|iterations)|(this|last|the prior) round|re-?ran|the \d+(st|nd|rd|th) (time|pass) (through|around)|(a|another) round of)\b/i,
  },
  {
    slug: 'decision-process',
    grade: 'blocker',
    what: 'the deliberation behind a decision — the reader did not attend it',
    pattern:
      /\b(we deliberately (chose|kept|left|did not)|i deliberately (chose|kept|left|did not)|as discussed|per the conversation|after (much|some|a long) (debate|deliberation)|we (went back and forth|debated)|the call (i|we) made|(our|the) rationale was|(i|we) reasoned that|the debate over|we settled on)\b/i,
  },
  {
    slug: 'calendar-date',
    grade: 'nitpick',
    what: 'a calendar date — a common accretion tell; a yield states what holds, not when it was measured',
    pattern: /\b\d{4}-\d{2}-\d{2}\b/,
  },
  {
    slug: 'temporal-deixis',
    grade: 'nitpick',
    what: 'a word whose referent is a moment, so it rots once the moment passes',
    pattern:
      /\b(recently|previously|as we saw above|as noted above|as mentioned (above|earlier)|no longer (reads|says|holds)|up until now|up to now|for now|not \w+ yet|at present|as things stand)\b/i,
  },
  {
    slug: 'process-narration',
    grade: 'nitpick',
    what: 'the document narrates its own edit rather than states what is',
    pattern:
      /\b(now the (section|yield|file|table) (reads|says|holds)|we then (added|split|renamed|cut)|i then (added|split|renamed|cut)|on re-?read|this (section|yield) (now|has been) (grew|grown|rewritten)|(got|been) (rewritten|restructured|reworked|renamed|moved|split)|(i|we)('ve| have)? (since|now) (added|moved|split|cut|renamed))\b/i,
  },
];

/**
 * .what = every archaeology tell in one yield, located by line
 * .why  = a located point is repairable; a verdict is arguable
 */
export const getAllArchaeologyMarkers = (input: {
  path: string;
  lines: string[];
}): ArchaeologyPoint[] => {
  const found: ArchaeologyPoint[] = [];
  let fenced = false;

  input.lines.forEach((text, index) => {
    // a fence toggles the exempt block; the fence line itself is never prose
    if (/^\s*```/.test(text)) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;

    // 🟡 a blockquote is a verbatim quote by convention, and a quote may never be tidied
    //    (`rule.require.timeless-lessons` — the `.said` exemption)
    if (/^\s*>/.test(text)) return;

    ARCHAEOLOGY_MARKERS.forEach((marker) => {
      if (!marker.pattern.test(text)) return;
      found.push({
        path: input.path,
        line: index + 1,
        slug: marker.slug,
        grade: marker.grade,
        what: marker.what,
        text: text.trim(),
      });
    });
  });

  return found;
};
