# F6: the domain term is `promise`, in code as on the cli

- **raised by:** peer arch-ambiguous-terms, blocker.1 (it overloads ts `Promise<T>`)
- **the fork:**
  - name the code `promise` (`record.promise`, `asRadioPromiseFromArg`, `RADIO_PROMISE_PUBLIC_REPO`);
  - or rename the code to `attestation` / `pledge` and keep `--promise` on the cli.
- **taken:** `promise`, everywhere:
  1. the term is the wish's and the issue's. the flag `--promise` is fixed by the commander, and the
     literal reads as "i promise the task to a public repo is anonymized" (vision .mental model).
  2. a code name that differs from the flag it carries is itself the synonym the ambiguous-terms rule
     forbids: `--promise` parsed into `attestation` gives two words for one concept.
  3. the overload risk is low here. every identifier is qualified (`RadioPromise…`, `promiseOverride`,
     `RADIO_PROMISE_PUBLIC_REPO`). no field is typed `Promise`, and no bare `promise` names an async
     value in these files. a reader meets `Promise<…>` only as a return type, in a different
     grammatical slot.
- **rework:** clean. a rename across about 8 new files, with no extant callers.
- **confidence: 85%**
- **where:** `domain.operations/radio/promise/`, `RadioTaskRecord.promise`
- **verdict:** open, for the council at the close
