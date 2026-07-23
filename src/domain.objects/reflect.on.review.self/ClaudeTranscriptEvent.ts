import { DomainLiteral } from 'domain-objects';

/**
 * .what = one parsed line from a claude-code transcript jsonl file
 * .why = the atomic unit a reflection reads; a transcript is a stream of these
 *
 * .note = only the fields the reflection needs are typed; unknown fields are
 *         ignored so the parser tolerates schema drift across claude versions
 */
interface ClaudeTranscriptEvent {
  /**
   * event kind (e.g., 'user', 'assistant', 'file-history-snapshot')
   */
  type: string;

  /**
   * the message role, when the event carries a message ('user' | 'assistant')
   */
  role: 'user' | 'assistant' | null;

  /**
   * text content of the message (assistant text blocks concatenated), when present
   */
  text: string | null;

  /**
   * tool_use invocations in this event (name + input), when present
   */
  toolUses: { name: string; input: Record<string, unknown> }[];

  /**
   * repo dir the session ran in, when present
   */
  cwd: string | null;

  /**
   * git branch the session ran on, when present
   */
  gitBranch: string | null;

  /**
   * session identifier, when present
   */
  sessionId: string | null;

  /**
   * iso timestamp of the event, when present
   */
  timestamp: string | null;

  /**
   * the source transcript file this event was parsed from
   */
  transcriptPath: string;
}
class ClaudeTranscriptEvent
  extends DomainLiteral<ClaudeTranscriptEvent>
  implements ClaudeTranscriptEvent {}

export { ClaudeTranscriptEvent };
