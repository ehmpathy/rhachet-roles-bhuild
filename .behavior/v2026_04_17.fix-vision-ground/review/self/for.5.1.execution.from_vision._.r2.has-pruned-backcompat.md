# self-review: has-pruned-backcompat (round 2)

deeper analysis of backwards compatibility.

## potential concern: in-progress behaviors

**scenario**: someone has a behavior in progress with the OLD vision template (no groundwork section). now they run the NEW guard (with groundwork review).

**question**: will the guard fail because there's no groundwork section?

**analysis**: no — the guard is a self-review prompt, not a mechanical check. it prompts:
> "did the junior ground the vision in reality?"

if the vision has no groundwork section, the behaver would answer:
> "the vision predates the groundwork section — no section present"

this is not a failure, just a factual observation.

**verdict**: no backwards compat issue. self-reviews are advisory, not enforcement.

## potential concern: YAML format

**scenario**: the guard files are YAML. did I add the new self-review in valid format?

**verification**: checked extant format:
```yaml
    - slug: has-questioned-questions
      say: |
        ...
```

my addition follows same pattern:
```yaml
    - slug: has-grounded-in-reality
      say: |
        ...
```

**verdict**: format is correct. builds pass (verified via `npm run build`).

## why backwards compat is NOT needed

| concern | why not an issue |
|---------|------------------|
| old behaviors get new guard | guards are prompts, not enforcement |
| old visions lack groundwork | reviewer notes absence, not a failure |
| YAML format | same structure as extant entries |
| runtime code changes | none — templates are static text |

## summary

no backwards compat code needed. template additions are purely additive. self-reviews don't mechanically enforce section presence — they prompt reflection.
