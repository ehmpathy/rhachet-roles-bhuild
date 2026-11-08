import {
  BadRequestError,
  ConstraintError,
  MalfunctionError,
} from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asRadioHeldFault } from './asRadioHeldFault';

describe('asRadioHeldFault', () => {
  given('[case1] a caller-fix fault', () => {
    when('[t0] it is a BadRequestError', () => {
      then('it returns the fault to hold', () => {
        const error = new BadRequestError('no token');
        expect(asRadioHeldFault(error)).toEqual({ fault: error });
      });
    });
    when('[t1] it is a ConstraintError, a BadRequestError subclass', () => {
      then('it returns the fault to hold', () => {
        const error = new ConstraintError('no token');
        expect(asRadioHeldFault(error).fault).toBe(error);
      });
    });
  });

  given('[case2] any other fault', () => {
    when('[t0] it is a MalfunctionError', () => {
      then('it rethrows the same error', async () => {
        const error = new MalfunctionError('gh crashed');
        const thrown = await getError(async () => asRadioHeldFault(error));
        expect(thrown).toBe(error);
      });
    });
    when('[t1] it is not an Error at all', () => {
      then('it rethrows the same value', async () => {
        const thrown = await getError(async () => asRadioHeldFault('boom'));
        expect(thrown).toBe('boom');
      });
    });
  });
});
