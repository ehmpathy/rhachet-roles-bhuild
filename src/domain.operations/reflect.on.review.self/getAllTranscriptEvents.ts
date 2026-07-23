import { ClaudeTranscriptEvent } from '@src/domain.objects/reflect.on.review.self/ClaudeTranscriptEvent';

/**
 * .what = narrow an unknown value to a record of unknown fields
 * .why = a checked type guard replaces `as Record<string, unknown>` casts,
 *        so the type system proves the shape instead of a bare assertion
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * .what = parse the raw text of one claude-code transcript jsonl into events
 * .why = turns a transcript file into typed events the reflection can read;
 *        tolerant of corrupt or newer-schema lines (skips them, never throws)
 *
 * .note = each line is one json object; unknown fields are ignored so the
 *         parser survives schema drift across claude-code versions
 */
export const getAllTranscriptEvents = (input: {
  content: string;
  transcriptPath: string;
}): ClaudeTranscriptEvent[] => {
  const events: ClaudeTranscriptEvent[] = [];

  // walk each line; a blank line or a corrupt line is skipped, never fatal
  const lines = input.content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const event = asTranscriptEvent({
      line: trimmed,
      transcriptPath: input.transcriptPath,
    });
    if (event) events.push(event);
  }

  return events;
};

/**
 * .what = parse one jsonl line into a ClaudeTranscriptEvent, or null if unusable
 * .why = isolates the per-line decode so a single bad line never sinks the file
 */
const asTranscriptEvent = (input: {
  line: string;
  transcriptPath: string;
}): ClaudeTranscriptEvent | null => {
  // decode the line; a parse failure means a corrupt line — skip it
  const raw = decodeJsonLine({ line: input.line });
  if (!raw) return null;

  // an event without a type is not one we can classify — skip it
  const type = typeof raw.type === 'string' ? raw.type : null;
  if (!type) return null;

  // extract the message envelope, when present
  const message = isRecord(raw.message) ? raw.message : null;

  const role = asRole({ message });
  const { text, toolUses } = asMessageBody({ message });

  return new ClaudeTranscriptEvent({
    type,
    role,
    text,
    toolUses,
    cwd: typeof raw.cwd === 'string' ? raw.cwd : null,
    gitBranch: typeof raw.gitBranch === 'string' ? raw.gitBranch : null,
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : null,
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : null,
    transcriptPath: input.transcriptPath,
  });
};

/**
 * .what = json-decode a single line into a record, or null on failure
 * .why = the tolerant boundary — corrupt json yields null, not an exception
 */
const decodeJsonLine = (input: {
  line: string;
}): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(input.line);
    if (!isRecord(parsed)) return null;
    return parsed;
  } catch (error) {
    // allowlist only the SyntaxError JSON.parse throws on a corrupt line
    if (error instanceof SyntaxError) return null;
    // any other error is a real defect — fail loud, do not hide it as a skip
    throw error;
  }
};

/**
 * .what = extract the message role, when the envelope carries one
 * .why = only 'user' | 'assistant' messages matter to the reflection
 */
const asRole = (input: {
  message: Record<string, unknown> | null;
}): 'user' | 'assistant' | null => {
  const role = input.message?.role;
  if (role === 'user' || role === 'assistant') return role;
  return null;
};

/**
 * .what = extract text volume and tool_use invocations from a message body
 * .why = these two are the raw material for every deterministic signal
 *
 * .note = content may be a plain string (user) or an array of blocks (assistant)
 */
const asMessageBody = (input: {
  message: Record<string, unknown> | null;
}): { text: string | null; toolUses: ClaudeTranscriptEvent['toolUses'] } => {
  const content = input.message?.content;

  // a plain-string content is user text
  if (typeof content === 'string') return { text: content, toolUses: [] };

  // a non-array, non-string content carries no text or tools we read
  if (!Array.isArray(content)) return { text: null, toolUses: [] };

  const textParts: string[] = [];
  const toolUses: ClaudeTranscriptEvent['toolUses'] = [];

  for (const block of content) {
    if (!isRecord(block)) continue;
    const blockRecord = block;

    // collect assistant text blocks
    if (blockRecord.type === 'text' && typeof blockRecord.text === 'string')
      textParts.push(blockRecord.text);

    // collect tool_use invocations
    if (blockRecord.type === 'tool_use' && typeof blockRecord.name === 'string')
      toolUses.push({
        name: blockRecord.name,
        input: isRecord(blockRecord.input) ? blockRecord.input : {},
      });
  }

  return {
    text: textParts.length > 0 ? textParts.join('\n') : null,
    toolUses,
  };
};
