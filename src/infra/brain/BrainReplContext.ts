/**
 * .what = brief content for brain.repl context
 * .why = provides domain knowledge to guide LLM judgment
 * .todo = liftout generalized into rhachet repo
 */
export interface BrainReplBrief {
  name: string;
  content: string;
}

/**
 * .what = role with briefs for brain.repl
 * .why = bundles domain knowledge for a specific skill invocation
 * .todo = liftout generalized into rhachet repo
 */
export interface BrainReplRole {
  briefs: BrainReplBrief[];
}

/**
 * .what = context interface for brain.repl dependency injection
 * .why = enables probabilistic operations to receive LLM access via context
 * .todo = liftout generalized into rhachet repo
 */
export interface BrainReplContext {
  imagine: (input: {
    prompt: string;
    role: BrainReplRole;
    outputFormat: 'json' | 'text';
  }) => Promise<string>;
}
