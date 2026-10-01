# F3 — exit code of a held push

- **the fork:** exit 2 (constraint — not delivered) · exit 0 (success — safely held)
- **taken:** exit 2. today's block already exits 2, so callers keep their read; and a caller that
  gates on exit 0 must never believe a held task was sent
- **rework:** clean — one line in the cli, plus snapshots
- **confidence:** 75%. low because "held" is the recorder's success, and a clone that sees exit 2 may
  retry in a loop. the output's word **held** is the counterweight
- **where:** case=2, case=5; yield `.what is awkward`
- **verdict:** —
