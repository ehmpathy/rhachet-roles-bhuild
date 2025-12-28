.tactic = criteria:require-bdd-clause-semantics

.what = given/when/then clauses must follow correct semantic roles

.why
- given describes preconditions, not actions
- when describes triggers, not states
- then describes outcomes, not preconditions
- incorrect semantics make criteria confusing and untestable

.scope
- applies to all given/when/then clauses in criteria documents
- BLOCKER level violation when detected

.definitions
- **given** = precondition / scene / state that exists before the action
- **when** = trigger / event / action that occurs
- **then** = effect / expectation / outcome that results

.detect

given() violations:
- contains action verbs like "completes", "runs", "executes", "invokes"
- describes something happening rather than something that exists
- reads like a when() clause

when() violations:
- describes a state rather than an action
- contains passive state descriptions like "exists", "is configured"
- reads like a given() clause

then() violations:
- describes preconditions rather than outcomes
- contains setup language rather than assertion language
- reads like a given() clause

.examples

.negative (incorrect semantics)
```
given('prioritize skill completes gather phase')  # action, not state
  when('output exists')                            # state, not action
    then('sources are configured')                 # precondition, not outcome

given('user runs the command')                     # action, not state
  when('system is ready')                          # state, not action
```

.positive (correct semantics)
```
given('sources have been scanned')                 # state/precondition
  when('gather phase writes output')               # action/trigger
    then('behaviors are enumerated to .gather/')   # outcome/effect

given('gather output exists at {output}/.gather/') # state/precondition
  when('user inspects output')                     # action/trigger
    then('each record includes source repo path')  # outcome/effect

given('a behavior with status=done flag')          # state/precondition
  when('prioritize skill gathers behaviors')       # action/trigger
    then('behavior is excluded from results')      # outcome/effect
```

.heuristics
- given() should use past participles: "has been", "exists", "is configured"
- when() should use present tense verbs: "runs", "writes", "reads", "invokes"
- then() should use present tense assertions: "is written", "includes", "shows"
