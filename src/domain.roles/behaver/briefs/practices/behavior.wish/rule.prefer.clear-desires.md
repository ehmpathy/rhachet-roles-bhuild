.rule = prefer.clear-desires

.what = wishes must clearly state what is desired

.why = ambiguous wishes lead to misaligned implementations; clear desires enable accurate criteria, blueprints, and roadmaps

.how = check for explicit "wish =" statement with concrete, actionable desires; verify desires are specific enough to derive testable criteria

.examples:
  .positive:
    - |
      # wish

      wish = create a skill that reviews behavior artifacts against best practice rules

      ## desires
      - review wish documents for clarity and scope
      - review criteria documents for bdd format compliance
      - review blueprints for test coverage specification
      - review roadmaps for dependency order
  .negative:
    - |
      # wish

      make the system better at reviewing things
    - |
      # wish

      wish = improve quality

.severity = BLOCKER
