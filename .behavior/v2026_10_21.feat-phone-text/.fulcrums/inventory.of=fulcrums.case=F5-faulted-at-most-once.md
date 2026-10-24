# F5 — an unconfirmed say settles FAULTED, never auto-resent

## .the fork

- **A (taken)**: `buffered`, `absent`, `unreadable`, wedged, exited-mid-dispatch → FAULTED with rhachet's reason; the daemon never resends
- **B**: leave them QUEUED and retry — risks a text said twice (rhachet's own hint for `buffered`: "do not re-send")

## .taken, and why at the time

the wish asks for "delivered once" and "never dropped". A honors both: it never duplicates, and
it never drops — the text stays on disk, loud in `phone.get`.

## .rework

clean — one status map.

## .confidence — 80%, low because

the wish lists "stays queued or fails loud"; FAULTED is a fourth status name the wisher has not seen.

## .verdict

(awaits council)
