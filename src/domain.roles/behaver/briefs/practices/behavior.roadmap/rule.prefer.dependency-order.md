.rule = prefer.dependency-order

.what = roadmap phases should be ordered by dependency

.why = dependency order enables correct execution sequence and parallel work identification; prerequisites must be built before dependents

.how = verify that phase prerequisites are listed before dependents; check for circular dependencies which are blockers

.examples:
  .positive:
    - |
      ## dependencies

      ```
      phase.0 (scaffolding)
         ↓
      phase.1 (rule briefs)
         ↓
      phase.2 (composite skill)
         ↓
      phase.3 (symlinks)
         ↓
      phase.4 (validation)
      ```

      ## phase.0 = scaffolding

      ### dependencies
      - none

      ## phase.1 = rule briefs

      ### dependencies
      - [x] phase.0 complete (scaffolding exists)
  .negative:
    - |
      ## phase.1 = validation

      run validation to check everything works.

      ## phase.2 = implementation

      implement the features to validate.

      (validation before implementation - wrong order)
    - |
      ## phase.1 = skill

      ### dependencies
      - phase.2 complete

      ## phase.2 = tests

      ### dependencies
      - phase.1 complete

      (circular dependency)

.severity = BLOCKER
