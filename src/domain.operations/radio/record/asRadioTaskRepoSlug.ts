import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

/**
 * .what = the `owner/name` slug of a radio task's target repo
 * .why = the gate, the record key, and the outputs all name the target this one way
 */
export const asRadioTaskRepoSlug = (input: { repo: RadioTaskRepo }): string =>
  `${input.repo.owner}/${input.repo.name}`;
