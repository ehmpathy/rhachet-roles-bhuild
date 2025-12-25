.rule = prefer.dependency-order

.what = usecases should be ordered by dependency (foundational first)

.why = dependency order enables incremental verification and natural read flow; foundational behaviors must be validated before dependents; reduces debugging complexity

.how = verify that referenced behaviors appear before dependents; check that usecases can be implemented and tested in declared order

.examples:
  .positive:
    - |
      # usecase.1 = rule briefs are discoverable

      given('rule briefs exist')
        when('searched')
          then('found at expected paths')

      # usecase.2 = single artifact review (depends on usecase.1)

      given('a wish document exists')
        when('reviewed with rules from usecase.1')
          then('feedback produced')

      # usecase.3 = composite review (depends on usecase.2)

      given('behavior directory exists')
        when('review.behavior invoked')
          then('invokes single artifact review from usecase.2')
  .negative:
    - |
      # usecase.1 = composite review (depends on undefined behaviors)

      given('review.behavior invoked')
        when('executed')
          then('invokes single artifact review')

      # usecase.2 = single artifact review (should come first)

      given('a wish exists')
        when('reviewed')
          then('feedback produced')

.severity = NITPICK
