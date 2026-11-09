import { asCountNoun } from './asCountNoun';

/**
 * .what = one concern a deterministic lane raises: what is wrong, its fix, its harm grade
 * .why  = both deciders return it and this render reads it; one shape, so a new field is one edit
 */
export type ReviewerConcern = {
  what: string;
  fix: string;
  severity: 'urgent' | 'better';
};

/**
 * .what = one concern as two treestruct lines: the concern, then its fix as a child branch
 * .why  = the last concern closes the trunk (`└─`); every other keeps it open (`├─`, `│`)
 */
const asConcernBranchLines = (input: {
  concern: ReviewerConcern;
  label: string;
  isLast: boolean;
}): string[] => [
  `   │  ${input.isLast ? '└─' : '├─'} ${input.label}[${input.concern.severity}] ${input.concern.what}`,
  `   │  ${input.isLast ? '   ' : '│  '}└─ fix: ${input.concern.fix}`,
];

/**
 * .what = one section of concerns under its title; no lines when the section is empty
 * .why  = blockers and nitpicks render alike, each under its own title
 * .note = the title and the kind label both derive from one kind, so the two cannot disagree;
 *         the severity label is the decider's grade, carried on each concern
 */
const asConcernSectionLines = (input: {
  kind: 'blocker' | 'nitpick';
  concerns: ReviewerConcern[];
}): string[] =>
  input.concerns.length === 0
    ? []
    : [
        `   ├─ ${input.kind}s`,
        ...input.concerns.flatMap((concern, index) =>
          asConcernBranchLines({
            concern,
            label: `[${input.kind}]`,
            isLast: index === input.concerns.length - 1,
          }),
        ),
      ];

/**
 * .what = the tail of the root-purpose-depth lane's stdout: each concern with its fix, then the
 *         two numeric lines
 * .why  = the guard tallies stdout, so it must hold a numeric count of blockers AND nitpicks,
 *         every time (contract.reviewer-output); this one render owns that, apart from the head
 * .note = the caller supplies the head lines; this closes the tree with the summary
 */
export const asReviewerOutputLines = (input: {
  blockers: ReviewerConcern[];
  nitpicks: ReviewerConcern[];
}): string[] => [
  ...asConcernSectionLines({ kind: 'blocker', concerns: input.blockers }),
  ...asConcernSectionLines({ kind: 'nitpick', concerns: input.nitpicks }),
  '   └─ summary',
  `      ├─ ${asCountNoun({ count: input.blockers.length, singular: 'blocker', plural: 'blockers' })}`,
  `      └─ ${asCountNoun({ count: input.nitpicks.length, singular: 'nitpick', plural: 'nitpicks' })}`,
];
