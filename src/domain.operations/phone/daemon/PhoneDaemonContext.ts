import type { PhoneContext } from '../PhoneContext';

/**
 * .what = the context a daemon tick runs in: the phone context, plus a line log
 * .why = every step of a tick logs to the daemon's own log file, never to stdout
 */
export type PhoneDaemonContext = PhoneContext & { log: (line: string) => void };
