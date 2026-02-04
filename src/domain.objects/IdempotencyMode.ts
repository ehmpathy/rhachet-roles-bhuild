/**
 * .what = idempotency semantics for task push operations
 * .why = controls behavior when task already exists
 */
enum IdempotencyMode {
  FINDSERT = 'findsert',
  UPSERT = 'upsert',
}

const isIdempotencyMode = (value: unknown): value is IdempotencyMode =>
  Object.values(IdempotencyMode).includes(value as IdempotencyMode);

export { IdempotencyMode, isIdempotencyMode };
