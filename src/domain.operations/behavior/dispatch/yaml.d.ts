declare module 'yaml' {
  export function parse(yaml: string): unknown;
  export function stringify(value: unknown): string;
}
