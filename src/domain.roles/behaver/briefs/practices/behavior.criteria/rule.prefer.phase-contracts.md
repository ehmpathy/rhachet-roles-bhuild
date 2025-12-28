.tactic = criteria:prefer-phase-contracts

.what = criteria with multiple scopes should declare clear contracts between phases

.why
- phases without declared contracts create implicit coupling
- unclear phase boundaries make systems hard to debug and resume
- explicit contracts enable independent testing of each phase
- contracts make data flow inspectable at each stage

.scope
- applies to criteria documents with 2+ scopes that represent sequential phases
- NITPICK level violation when detected

.detect
- look for multiple scopes that represent phases of a workflow (e.g., gather → measure → triage)
- check if each phase declares its output contract (where it writes, what shape)
- check if downstream phases declare their input contract (where they read from)
- missing contract declarations between phases = violation

.fix
- add an "output contract" usecase to each phase scope
- declare where the phase writes its results (e.g., `{output}/.gather/`)
- declare the shape of the output (e.g., structured records with specific fields)
- declare that output is deterministic given same inputs
- ensure downstream phases reference upstream output locations

.examples

.negative (no phase contracts)
```
# scope.1 = gather behaviors
given('sources are configured')
  when('gather runs')
    then('behaviors are discovered')

# scope.2 = measure behaviors
given('behaviors exist')
  when('measure runs')
    then('scores are calculated')
```

.positive (clear phase contracts)
```
# scope.1 = gather behaviors

## usecase.1.1 = gather output contract
given('gather phase completes')
  when('output is written')
    then('behaviors are enumerated to {output}/.gather/')
    then('each behavior is a structured record')
    then('enumeration is deterministic given same sources')
      sothat('gather results are inspectable and reproducible')

# scope.2 = measure behaviors

## usecase.2.1 = measure input contract
given('gather output exists at {output}/.gather/')
  when('measure phase reads input')
    then('all gathered behaviors are loaded')
      sothat('measure operates on consistent gather results')

## usecase.2.2 = measure output contract
given('measure phase completes')
  when('output is written')
    then('scored behaviors are written to {output}/.measure/')
      sothat('triage phase has consistent input')
```

.benefit
- each phase is independently testable
- failures are debuggable by inspecting intermediate outputs
- phases can be re-run from any checkpoint
- data flow is explicit and traceable
