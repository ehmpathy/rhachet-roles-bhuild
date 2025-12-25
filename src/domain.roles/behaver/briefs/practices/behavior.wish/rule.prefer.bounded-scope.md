.rule = prefer.bounded-scope

.what = wishes should define boundaries of what is in scope and out of scope

.why = unbounded scope leads to scope creep and unclear completion criteria; explicit boundaries enable focused implementation

.how = check for explicit scope boundaries or constraints; verify the wish does not imply unlimited or vague scope

.examples:
  .positive:
    - |
      # wish

      wish = create rule briefs for behavior artifact review

      ## scope
      - in: wish, criteria, blueprint, roadmap artifacts
      - out: code review, test review, documentation review
  .negative:
    - |
      # wish

      wish = review all project artifacts comprehensively
    - |
      # wish

      wish = make everything better

.severity = NITPICK
