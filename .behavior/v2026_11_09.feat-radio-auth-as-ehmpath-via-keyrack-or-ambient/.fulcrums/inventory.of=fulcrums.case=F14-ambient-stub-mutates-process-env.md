# F14 — withAmbientStub sets its overlay ON process.env (and chdir), restored in finally

- **fork**: (a) build a copy of the env and pass it through a context seam · (b) mutate `process.env` and cwd in place, scoped to a try/finally, with a deliberate-mutation note
- **taken**: (b). the seam under test is the env the subprocess inherits: `shx` passes `env: process.env` (F10), and the CLI entry reads `process.env` directly. a copy on a context seam is the exact shape of the leak the wish names (a stub on an env the shell never read). jest runs one file per worker and the callbacks run serially, so no concurrent reader shares the window
- **rework**: clean — if the harness ever runs concurrent callbacks, serialize them behind a mutex inside `withAmbientStub`
- **confidence**: 85%
- **where**: `src/.test/utils/withAmbientStub.ts`
- **verdict**: —
