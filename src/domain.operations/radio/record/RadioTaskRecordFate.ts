import type { RadioTask } from '@src/domain.objects/RadioTask';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import type { RadioAuthFallback } from '@src/domain.operations/radio/auth/RadioAuthFallback';

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
      fallback: RadioAuthFallback | null;
    }
  | { fate: 'refused'; record: RadioTaskRecord; detail: string }
  | {
      fate: 'held';
      record: RadioTaskRecord;
      lift: string | null;
      detail: string | null;
      halt: boolean;
    };
