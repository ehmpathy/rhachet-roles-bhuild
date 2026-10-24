# F14 · tests the blueprint plans land at `5.1.execution`, not at the blueprint stone

- **the fork**: (a) the blueprint plans each new test, and `5.1.execution` builds it — red first,
  then green — in this same pr, before the route finishes; (b) the blueprint stone itself carries
  the built tests, so the blueprint's diff holds them.
- **taken**: (a).
- **why (a) is the only one open**:
  - the route seals `src/` until this stone passes. my edit of `templates/6.preship.stone` at this
    stone was refused by the bounce hook: "this artifact is locked until stone
    3.3.1.blueprint.product is passed". `templates.tail`, `initBehaviorDir.integration`, and the
    tail templates all sit under `src/`. (b) is not a permitted act at this stone.
  - the stone's own text: "remember, the purpose of the blueprint is to declare what the execution
    will adhere to." the next stone, `5.1.execution`, is where code lands, and its guard reviews
    the code and its tests (`behavior-intent-coverage`, `ergo-acceptance-journey-coverage`, …).
  - no test is dropped or excused: each is named in the blueprint's coverage table with its red-then-
    green proof owed, and the pr cannot merge without them.
- **raised by**: peer `ergo-acceptance-journey-coverage` blocker.1–3, rounds i001 (conceded: my
  words read as "after this pr"; the summary now says "lands in this pr") and i002 (re-raised: the
  file is not yet in the diff). the i002 objection is an absence a `.taken` cannot fill and a
  change i am not permitted to make — so it goes to the council.
- **rework**: clean — the tests are planned; only where they are built is in question.
- **confidence**: 95%.
- **risk if wrong**: low — at worst the commander asks for the tests before approval; the route
  then needs a one-time mutate grant for `src/` at this stone.
- **verdict**: disputed; the council rules.
