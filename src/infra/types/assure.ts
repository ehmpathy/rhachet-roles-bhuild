import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = assert that a value satisfies a type guard, then return it with the narrowed type
 * .why = enables type-safe narrow without `as` casts; fails loud and proud on mismatch
 */
export const assure = <TInput, TOutput extends TInput>(
  guard: (value: TInput) => value is TOutput,
  value: TInput,
): TOutput => {
  if (!guard(value)) {
    throw new UnexpectedCodePathError(
      'assure failed: value did not satisfy type guard',
      {
        value,
        guardName: guard.name || 'anonymous',
      },
    );
  }
  return value;
};
