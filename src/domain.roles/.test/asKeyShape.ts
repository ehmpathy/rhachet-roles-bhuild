/**
 * .what = a json record as its key structure: sorted keys, leaf types, array items as the union of their keys
 * .why  = a --json record holds live box figures, weights, and one row per crew or seat, so its
 *         values and array lengths vary per run; the shape a caller or a tick parses does not
 */
export const asKeyShape = (value: unknown): unknown => {
  if (Array.isArray(value))
    return {
      '[each]': [
        ...new Set(
          value.flatMap((item) =>
            item !== null && typeof item === 'object' && !Array.isArray(item)
              ? Object.keys(item)
              : [item === null ? 'null' : typeof item],
          ),
        ),
      ].sort(),
    };
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, asKeyShape(child)]),
    );
  return value === null ? 'null' : typeof value;
};
