# self-review: has-questioned-assumptions (round 3)

deeper still. reading line by line with fresh eyes.

## assumption 9: external = APIs, internal = codepaths

**what do we assume without evidence?** line 5 says "external APIs or internal patterns" — but integrations come in more forms:
- databases/schemas
- third-party SDKs (not just REST APIs)
- environment constraints (deployment targets, infrastructure)
- human processes (approval flows, notification channels)

**what if the opposite were true?** a vision might depend on a Slack channel, a database table schema, or a Kubernetes resource limit. these aren't APIs or codepaths.

**did the wisher say this?** the wisher said "external websearch research or internal codepaths research" — so yes, this binary is from the wisher.

**verdict**: the binary is wisher-backed, but incomplete. the vision should acknowledge that "external" covers more than APIs (docs, services, constraints) and "internal" covers more than code (conventions, schemas).

**fix**: clarify in the "what is awkward" section that the external/internal binary may be too simple.

## assumption 10: research comes after drafting

**what do we assume without evidence?** the timeline (lines 26-33) shows: draft → realize dependency → research → cite.

**what if the opposite were true?** some visions might require upfront research before drafting is even possible. "can we use X at all?" must be answered before "here's how we'll use X."

**did the wisher say this?** no — the wisher didn't prescribe order.

**verdict**: the timeline is one valid flow, not the only flow. the vision should acknowledge that research might happen before, after, or interleaved with drafting.

**fix**: note this as an alternative flow in the user experience section.

## assumption 11: verification is mechanical (file is present) vs semantic (contract accurate)

**what do we assume without evidence?** line 43 says "the guard verifies: yes, these files and the contracts cited are accurate" — conflating two different types of verification:
- file is present: mechanical, automatable
- contract accurate: requires human judgment

**what if the opposite were true?** automated file checks might pass while the semantic claim is wrong (file changed since citation).

**did the wisher say this?** the wisher said "self review to double down and verify" — implying human self-review, not automated checks.

**verdict**: the vision conflates these. the guard does self-review (semantic), not automated checks (mechanical). clarify this.

**fix**: update evaluation section to distinguish semantic self-review from mechanical verification.

## assumption 12: groundwork reveals surprises

**what do we assume without evidence?** the "aha moment" (line 9) assumes research reveals something unexpected.

**what if the opposite were true?** research might confirm expectations. is that still valuable?

**verdict**: yes — confirming expectations is valuable because it converts assumption into fact. but the vision should acknowledge this case.

**fix**: none needed — the value is implicit. but could add to evaluation.

## assumption 13: impossible visions have a path

**what do we assume without evidence?** we don't address what happens if groundwork research reveals the vision is impossible.

**what if the opposite were true?** a behaver does groundwork, discovers the external API doesn't support a required feature. what then?

**did the wisher say this?** no.

**verdict**: this is out of scope for this wish — we're adding groundwork to the vision template, not redesigning the entire behavior flow. but worth noting as a future consideration.

**fix**: add to "what is awkward" — the vision doesn't address pivot/abort paths.

## fixes applied

1. added to "what is awkward": external/internal binary may be too simple
2. added to "what is awkward": no pivot/abort path if groundwork reveals impossibility
3. clarified in evaluation: guard does semantic self-review, not mechanical file checks

these deepen the vision without changing its core direction.
