import { BadRequestError } from 'helpful-errors';

import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

/**
 * .what = parse "owner/name" string into RadioTaskRepo
 * .why = cli receives repo as string, domain expects object
 */
export const asRadioTaskRepoFromArg = (input: {
  arg: string;
  argName: string;
}): RadioTaskRepo => {
  const [owner, name] = input.arg.split('/');
  if (!owner || !name) {
    throw new BadRequestError(
      `invalid ${input.argName} format (expected "owner/name", got "${input.arg}")`,
      {
        [input.argName]: input.arg,
        hint: `use format "owner/name" (e.g., "ehmpathy/my-repo")`,
      },
    );
  }
  return new RadioTaskRepo({ owner, name });
};
