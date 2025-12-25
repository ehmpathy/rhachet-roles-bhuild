.rule = require.criteria-satisfied

.what = blueprints must cover all declared criteria

.why = ensures no requirements are missed in implementation; criteria define the contract that the implementation must fulfill

.how = cross-reference blueprint sections against criteria usecases; verify each usecase has corresponding implementation detail

.examples:
  .positive:
    - |
      ## criteria coverage

      | usecase | blueprint section |
      |---------|-------------------|
      | usecase.1 = rule briefs discoverable | deliverable.1 = rule briefs |
      | usecase.2 = reviewing wish | deliverable.1, rule specifications |
      | usecase.3 = reviewing criteria | deliverable.1, rule specifications |
      | usecase.6 = composite skill | deliverable.2 = composite skill |
      | usecase.7 = builds on bhrain | deliverable.2, implementation pattern |
  .negative:
    - |
      ## implementation

      we will create a skill that reviews behaviors.

      ## deliverables

      - review.behavior.sh
    - |
      ## blueprint

      this implements the wish by creating rule briefs and a skill.

      (no explicit criteria mapping)

.severity = BLOCKER
