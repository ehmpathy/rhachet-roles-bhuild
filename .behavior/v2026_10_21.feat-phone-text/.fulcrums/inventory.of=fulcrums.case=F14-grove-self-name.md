# F14 — this grove's own name is `PHONE_GROVE`, else the hostname

## .the fork

- **A (taken)**: `local` casts to `$PHONE_GROVE` when set, else `os.hostname()`
- **B**: read the name from the git forest registry (`~/.git.forest/groves/*.json`)

## .taken, and why at the time

the registry lives on the director's box and names the *remote* groves; a grove's own disk holds no
record of the name the director gave it. so a grove can not look itself up there. the hostname is
always present (A4), and an env var lets a grove boot set the exact registry name.

## .rework

clean — one line in `getPhoneContextFromEnv`.

## .confidence — 75%, low because

a remote grove's hostname may differ from its registry name, so until the grove leg ships (F13) and
grove boots export `PHONE_GROVE`, a reply hint from a grove could name the hostname. no text crosses
groves in this delivery, so the gap is latent.

## .verdict

(awaits council)
