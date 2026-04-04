# philosophy: verification strictness

## .what

this brief explains why verification gates enforce absolute standards with zero tolerance and zero exceptions.

## .the fundamental guarantee

a behavior is a promise. it says: "this is what the system does."

verification is the proof. it says: "we have evidence the promise is true."

without strict verification:
- there is no guarantee the behavior works as advertised in this release
- there is no guarantee the behavior will continue to work in subsequent releases
- there is no evidence to cite when the behavior breaks
- there is no defense against regression

## .why zero tolerance

**zero deferrals** — a deferred test is a lie. it says "coverage exists" when it does not. deferrals accumulate. deferrals become permanent. deferrals ship as broken code.

**zero fake tests** — a fake test is fraud. it provides false confidence. it passes when the system is broken. it masks defects until production.

**zero unproven claims** — a claim without cite is a guess. "i think it passes" is not verification. cite the command. cite the output. prove the claim.

**zero credential excuses** — "i don't have creds" is a blocker, not a deferral. get the creds. mock the boundary. find another way. do not ship unverified.

**zero skips** — a skip is a hidden lie. it pretends coverage exists. it passes ci. it lets broken code through. skips are forbidden.

**zero exceptions** — special cases accumulate. exceptions become rules. "just this once" becomes "always." the line must be absolute.

## .why exhaustive contract coverage

callers experience contracts through outputs:
- cli callers see stdout and stderr
- api callers see response bodies
- sdk callers see return values

if a contract output is not snapped:
- reviewers cannot vibecheck the output in prs
- drift goes undetected over releases
- regressions ship without notice
- caller experience degrades silently

exhaustive means: every positive path, every negative path, every edge case. no gaps. no blind spots.

## .why integration tests for external contracts

mocks lie. mocks drift from the real service. mocks create false confidence.

a test that mocks stripe does not prove stripe works. it proves the mock works.

only a real call to the real service proves the integration works.

credential difficulty is not an exception. it is a blocker. solve it or fail the gate.

## .the cost of leniency

leniency compounds:
- one deferral becomes ten
- one fake test becomes a pattern
- one unproven claim becomes normal
- one credential excuse becomes standard

leniency erodes trust:
- "tests pass" means nothingness
- "verified" means "probably"
- "covered" means "we hope"

leniency ships defects:
- broken code reaches users
- regressions go undetected
- contracts drift without notice

## .the benefit of strictness

strictness compounds:
- every test is proven
- every claim is cited
- every contract is snapped
- every release is verified

strictness builds trust:
- "tests pass" means proven
- "verified" means cited
- "covered" means exhaustive

strictness prevents defects:
- broken code fails the gate
- regressions surface in diffs
- contracts are visible in snapshots

## .summary

verification gates exist to guarantee behavior works. strictness is not cruelty — it is the mechanism that makes the guarantee real. without strictness, there is no guarantee. with strictness, there is proof.

zero tolerance. zero exceptions. that is the price of trust.
