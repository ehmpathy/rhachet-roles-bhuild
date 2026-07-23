import { DomainLiteral } from 'domain-objects';

/**
 * .what = one artifact file a self-review touched, with how it touched it
 * .why = the per-file mode + diff is the granular evidence the brain grades —
 *        it reveals not just THAT a file changed but WHAT changed and how
 *
 * .note = the mandatory `review/self/` articulation write is NOT a file touch —
 *         it is captured separately as the experience's `articulation`, so this
 *         list holds only edits/reads of the reviewed work itself
 */
interface ReflectOnReviewSelfFileTouch {
  /**
   * the file path the review touched
   */
  path: string;

  /**
   * how the review touched it: a Read is 'read', an Edit/Write is 'write'
   */
  mode: 'read' | 'write';

  /**
   * the change the review made, or null for a read:
   * - Write → the written content
   * - Edit  → the `old → new` pair
   * - Read  → null (no change)
   *
   * .note = bounded — a long diff is truncated with a `…(truncated)` marker so
   *         a large edit does not blow the brain's context budget
   */
  diff: string | null;
}
class ReflectOnReviewSelfFileTouch
  extends DomainLiteral<ReflectOnReviewSelfFileTouch>
  implements ReflectOnReviewSelfFileTouch {}

export { ReflectOnReviewSelfFileTouch };
