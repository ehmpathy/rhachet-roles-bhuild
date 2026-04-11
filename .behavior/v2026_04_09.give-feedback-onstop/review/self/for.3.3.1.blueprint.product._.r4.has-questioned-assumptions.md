# self-review: has-questioned-assumptions (r4)

## continued from r3

r3 identified 9 assumptions. this r4 goes deeper on the most critical ones.

## deeper questions on critical assumptions

### critical assumption: hash-based verification is sufficient

**the assumption**: if [given] hash matches stored hash, feedback is responded.

**what could go wrong?**
1. clone could respond with empty file → hash still validates
2. clone could respond with unrelated content → hash still validates
3. hash collision (extremely unlikely with sha256)

**are these real risks?**
1. empty file: the clone must write the [taken] file before they call feedback.take.set. if empty, that's on them — they failed to respond meaningfully.
2. unrelated content: same as above — clone responsibility.
3. hash collision: sha256 has 2^256 possible values. collision is effectively impossible.

**mitigation**: none needed. hash verification catches updates to [given] file. the content quality of [taken] is clone responsibility.

**verdict**: assumption holds.

### critical assumption: stop hook is reliable

**the assumption**: clones run the stop hook via settings.json.

**what could go wrong?**
1. clone uses a harness without hooks → feedback never enforced
2. clone kills session without hook trigger → feedback missed
3. hook configuration is absent → feedback never enforced

**are these real risks?**
1. harness without hooks: vision explicitly notes this as a con (line 193). it's a known limitation.
2. session killed: this is edge case — most sessions end cleanly.
3. hook config absent: documented in setup, but could happen.

**mitigation**: vision notes that "hook must be configured" is a known limitation. not a blueprint issue.

**verdict**: assumption holds — documented limitation.

### critical assumption: bound behavior scope is correct

**the assumption**: feedback system only operates on bound behavior.

**what could go wrong?**
1. clone has feedback in a different behavior directory → missed
2. multiple behaviors bound → ambiguous

**are these real risks?**
1. different behavior: if feedback is in unbound behavior, it's intentional separation.
2. multiple behaviors: current system binds one behavior per branch.

**mitigation**: scope is explicitly stated in vision (line 222: "bound behavior only").

**verdict**: assumption holds — explicit scope.

### critical assumption: [given] and [taken] name convention is unambiguous

**the assumption**: [given] and [taken] clearly distinguish human feedback from clone response.

**what could go wrong?**
1. file with [given] in artifact name but not a feedback file
2. manual file creation bypasses name convention

**are these real risks?**
1. artifact name with [given]: glob pattern is specific: `feedback/*.[given].by_human.md`. artifact names don't follow this pattern.
2. manual creation: system validates path derivation. manual files that don't match are rejected.

**mitigation**: strict glob pattern and path validation prevent false matches.

**verdict**: assumption holds.

## new assumption discovered

### assumption 10: single-behavior feedback model

**what we assume**: each behavior directory has its own isolated feedback.

**what if opposite?**: cross-behavior feedback (e.g., feedback on one behavior that affects another).

**is this needed?**: no — the wish is about feedback within a single behavior. cross-behavior feedback is out of scope.

**verdict**: assumption valid — matches wish scope.

## issues found

none. all critical assumptions hold under deeper scrutiny.

## conclusion

all 10 assumptions (9 from r3 + 1 new) are valid:
- hash verification is sufficient for update detection
- stop hook limitation is documented
- bound behavior scope is explicit
- name convention is unambiguous
- single-behavior model matches wish

no hidden assumptions found that undermine the blueprint.
