.rule = prefer.usecase-groups

.what = criteria should be grouped by usecase with `# usecase.N = description` headers

.why = usecase groups improve readability and navigation; related behaviors are reviewed together; enables systematic coverage verification

.how = check for usecase headers preceding related given blocks; verify each usecase has a descriptive title

.examples:
  .positive:
    - |
      # usecase.1 = reviewing a wish document

      given('a wish document exists')
        when('reviewed with wish rules')
          then('feedback identifies unclear desires')

      given('a wish has unclear desires')
        when('reviewed with wish rules')
          then('feedback flags as BLOCKER')

      # usecase.2 = reviewing a criteria document

      given('a criteria document exists')
        when('reviewed with criteria rules')
          then('feedback verifies bdd format')
  .negative:
    - |
      given('a wish document exists')
        when('reviewed')
          then('feedback provided')

      given('a criteria document exists')
        when('reviewed')
          then('feedback provided')

      given('a wish has unclear desires')
        when('reviewed')
          then('flagged')

.severity = NITPICK
