# F19 · `grove.census` keeps its own transcript and /proc readers

## .the fork

the census (role=any, the instrument that read the evidence for every stone) holds four readers of
its own: a transcript reader with two jq per file, a `/proc` reader, a config-dir glob, and
`read_account`. the token probe and the capacity probe each hold a newer copy of the same.

- **(a)** keep the census readers; cure each defect the reviews found in place (unparsed config,
  sub-minute span, empty crew set, a flag with no value)
- **(b)** the census calls the token probe and reads its record; a `procwork` lib owns the `/proc`
  readers and a `repowork` lib owns the repo layout, each embedded in both probes

## .taken, and why

(a). the census is the evidence the criteria and blueprint stones cite. a rewrite onto the probes
would change how that evidence was read after it was read, and the census's own clamps would have
to be rebuilt in the same round. the duplication spans two copies; the wet-over-dry bound is three.

## .rework

clean. the census is one file, and both probes already embed libs as text (`*_payload_lib`), which
is the mechanism (b) needs.

## .confidence, and why it is low

65%. the census still forks per transcript, so on a 🔴 grove it adds to the load it measures. a
`/proc` parse fix must land in two places.

## .where

`.agent/repo=.this/role=any/skills/grove.census.sh`; `work/capacitywork.probe.sh`;
`work/tokenwork.probe.sh`; the dream named in F16.

## .verdict

open.
