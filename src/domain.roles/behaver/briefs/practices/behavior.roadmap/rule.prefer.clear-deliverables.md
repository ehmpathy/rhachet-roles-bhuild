.rule = prefer.clear-deliverables

.what = each phase should have clear, measurable deliverables

.why = clear deliverables enable progress track and completion verification; vague deliverables lead to unclear done-ness

.how = check each phase has explicit deliverable statements; verify deliverables are concrete and verifiable

.examples:
  .positive:
    - |
      ## phase.1 = rule briefs

      ### deliverables
      - [ ] all 12 rule briefs fully implemented with content

      ### acceptance criteria
      ```
      given('phase.1 is complete')
        when('cat any rule file in behavior.wish/')
          then('.what, .why, .how sections have content')
          then('.examples.positive has at least one example')
          then('.severity is set to BLOCKER or NITPICK')
      ```

      ### verification
      ```sh
      for f in src/domain.roles/behaver/briefs/practices/behavior.*/rule.*.md; do
        grep -c ".what\|.why\|.how" "$f"
      done
      ```
  .negative:
    - |
      ## phase.1 = rule briefs

      implement the rule briefs.
    - |
      ## phase.1 = rule briefs

      ### tasks
      - write the rules
      - make them good

      (no explicit deliverables or verification)

.severity = NITPICK
