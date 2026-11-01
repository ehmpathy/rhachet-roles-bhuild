import { given, then, useThen, when } from 'test-fns';

import { getOneRaceWithinBound } from './getOneRaceWithinBound';

/**
 * .what = a step that settles with a value after a delay
 */
const genStepAfter = (input: { milliseconds: number; value: string }) =>
  new Promise<string>((settle) =>
    setTimeout(() => settle(input.value), input.milliseconds),
  );

describe('getOneRaceWithinBound', () => {
  given('[case1] a step that settles inside its bound', () => {
    when('[t0] it is raced', () => {
      const result = useThen('it settles', async () =>
        getOneRaceWithinBound({
          step: genStepAfter({ milliseconds: 10, value: 'board rented' }),
          bound: { milliseconds: 1_000 },
        }),
      );
      then('its value is returned', () => {
        expect(result).toEqual({ value: 'board rented' });
      });
    });
  });

  given('[case2] a step that stalls past its bound', () => {
    when('[t0] it is raced', () => {
      const result = useThen('it settles', async () =>
        getOneRaceWithinBound({
          step: genStepAfter({ milliseconds: 1_000, value: 'board rented' }),
          bound: { milliseconds: 20 },
        }),
      );
      then('it reads expired, never the late value', () => {
        expect(result).toEqual({ expired: true });
      });
    });
  });

  given('[case3] a step that rejects inside its bound', () => {
    when('[t0] it is raced', () => {
      then('the rejection passes through', async () => {
        await expect(
          getOneRaceWithinBound({
            step: Promise.reject(new Error('vault sealed')),
            bound: { milliseconds: 1_000 },
          }),
        ).rejects.toThrow('vault sealed');
      });
    });
  });
});
