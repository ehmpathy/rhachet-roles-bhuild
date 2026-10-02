import { readFileSync } from 'fs';

/**
 * .what = the whole of stdin as text, trimmed
 * .why = a cli arg may name `@stdin` as its value; this is the one read of the pipe
 */
export const getOneStdinText = (): string => readFileSync(0, 'utf-8').trim();
