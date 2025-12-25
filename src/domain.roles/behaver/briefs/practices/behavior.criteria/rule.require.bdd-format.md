.rule = require.bdd-format

.what = criteria must use given/when/then/sothat format

.why = bdd format ensures criteria are structured, testable, and machine-parseable; prose-style requirements are ambiguous and hard to verify

.how = verify each usecase has given(), when(), then() declarations; check that sothat() explains the business value

.examples:
  .positive:
    - |
      given('a wish document exists')
        when('reviewed with wish rules')
          then('feedback identifies unclear desires')
            sothat('ambiguous wishes are caught early')
  .negative:
    - |
      The system should review wish documents and provide feedback
      when they have unclear desires so that ambiguous wishes are caught.
    - |
      - review wish documents
      - provide feedback on unclear desires
      - catch ambiguous wishes

.severity = BLOCKER
