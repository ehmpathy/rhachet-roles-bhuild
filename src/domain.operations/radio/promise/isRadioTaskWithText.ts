/**
 * .what = does this task carry text: a title or a body
 * .why = text is what a public page leaks, so the gate, the vouch, and the order rule all ask
 *        this one question; one definition keeps the vouch sound only while they agree
 */
export const isRadioTaskWithText = (input: {
  title: string | null;
  description: string | null;
}): boolean => input.title !== null || input.description !== null;
