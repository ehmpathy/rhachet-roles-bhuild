/**
 * type declarations for ink-testing-library
 *
 * note: the package has types at build/index.d.ts but moduleResolution: "node"
 * cannot resolve them. this file provides the minimal types needed.
 */
declare module 'ink-testing-library' {
  import type { ReactElement } from 'react';

  export interface Instance {
    rerender: (tree: ReactElement) => void;
    unmount: () => void;
    stdin: {
      write: (data: string) => boolean;
    };
    stdout: {
      lastFrame: () => string | undefined;
    };
    frames: string[];
    clear: () => void;
    lastFrame: () => string | undefined;
  }

  export function render(tree: ReactElement): Instance;
}
