import type { RadioTask } from '@src/domain.objects/RadioTask';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import type { EhmpathSpot } from '@src/domain.operations/radio/auth/EhmpathSpot';

/**
 * .what = the fate of one record after an attempt to send it
 * .why = the drain reports each record by its fate; `halt` stops the drain
 */
export type RadioTaskRecordFate =
  | {
      fate: 'delivered';
      record: RadioTaskRecord;
      task: RadioTask;
      outcome: 'created' | 'found' | 'updated' | 'unchanged';

      /**
       * .what = the spot an as-ehmpath send paid from; null for every value with one source
       */
      ehmpathSpot: EhmpathSpot | null;
    }
  | { fate: 'refused'; record: RadioTaskRecord; detail: string }
  | {
      fate: 'held';
      record: RadioTaskRecord;
      lift: string | null;
      detail: string | null;
      halt: boolean;
    };
