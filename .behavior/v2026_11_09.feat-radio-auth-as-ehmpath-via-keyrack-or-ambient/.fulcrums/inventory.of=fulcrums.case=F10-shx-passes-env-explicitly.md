# F10 — `shx` passes `env: process.env` explicitly

- **fork**: the case=7 guard found that under jest a stub gh on `process.env.PATH` never reached the shell: with no `env` option, node's child_process reads the host env, not the sandbox copy the code sees, so the real `/usr/bin/gh` answered. (a) work around it in the tests (spawn with an explicit env per call) · (b) fix `shx` to pass `env: process.env`
- **taken**: (b). the cause sits in `shx`, and every caller is exposed to it — the exact defect the wish names (a real token reached a log). in prod `process.env` is the host env, so the behavior is unchanged; under test the subprocess now runs under the env the code sees
- **rework**: clean — one line in `shx.ts`. the clamp is `getEhmpathTokenFromAmbient.integration.test.ts` case1: red before the line (`resolved: /usr/bin/gh`), green after
- **confidence**: 85%. it reaches every `shx` caller's test env; the full radio integration run showed no regression it caused
- **where**: `src/infra/shell/shx.ts`
- **verdict**: —
