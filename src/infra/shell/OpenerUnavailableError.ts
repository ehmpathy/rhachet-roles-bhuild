import { HelpfulError } from 'helpful-errors';

/**
 * .what = error thrown when opener command is unavailable or fails
 * .why = named error for control flow - orchestrator catches this specifically
 */
export class OpenerUnavailableError extends HelpfulError {}
