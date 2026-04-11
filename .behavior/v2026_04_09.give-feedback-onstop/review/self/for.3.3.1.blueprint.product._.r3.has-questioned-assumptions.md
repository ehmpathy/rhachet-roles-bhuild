# self-review: has-questioned-assumptions

## assumptions identified in blueprint

### assumption 1: sha256 for hash

**what we assume**: sha256 is the right hash algorithm.

**what if opposite?**: use md5 or sha1 instead.

**evidence**: sha256 is standard practice for content verification. md5 and sha1 have known collision vulnerabilities. sha256 is fast enough for small files.

**verdict**: valid assumption, based on evidence.

### assumption 2: meta.yml peer file for hash storage

**what we assume**: hash should be stored in a peer meta.yml file.

**what if opposite?**: store hash in filename, in a central manifest, or in the [taken] file itself.

**evidence**:
- filename would be ugly and harder to read
- central manifest would be a single point of failure
- inline in [taken] would mix content with metadata
- peer file keeps metadata separate from content

**verdict**: valid assumption, simplest approach that works.

### assumption 3: [given] and [taken] in filenames

**what we assume**: brackets in filenames are acceptable.

**what if opposite?**: use underscores or dots instead.

**evidence**: brackets are already established in the template pattern. consistent with extant conventions in this codebase.

**verdict**: valid assumption, based on extant patterns.

### assumption 4: symlink for backwards compatibility

**what we assume**: symlink is the right approach for alias.

**what if opposite?**: duplicate the file, or deprecate old name immediately.

**evidence**: symlink is the standard unix pattern for aliases. no file duplication. immediate deprecation would break extant workflows.

**verdict**: valid assumption, based on unix convention.

### assumption 5: exit code 2 for constraint errors

**what we assume**: exit code 2 means constraint error (user must fix).

**what if opposite?**: use exit code 1 for all errors.

**evidence**: exit code semantics are already established in this repo. 0=success, 1=malfunction, 2=constraint. consistent with extant skills.

**verdict**: valid assumption, based on extant patterns.

### assumption 6: feedback files in $behavior/feedback/

**what we assume**: feedback should be in a subdirectory, not alongside artifacts.

**what if opposite?**: feedback files next to their artifacts.

**evidence**: wisher explicitly requested this in the wish: "lets move the feedback path produced by feedback.give into $behavior/feedback/..."

**verdict**: valid assumption, explicit wisher request.

### assumption 7: one meta.yml per [taken] file

**what we assume**: each [taken] file has its own peer meta.yml.

**what if opposite?**: single manifest for all feedback metadata.

**evidence**:
- single manifest = merge conflicts when multiple feedback files
- peer file = no conflicts, each feedback is independent
- simpler to implement and maintain

**verdict**: valid assumption, simplest approach.

## assumptions not in vision that we made

### assumption 8: use crypto.createHash (stdlib)

**what we assume**: use node stdlib, no external hash dependencies.

**what if opposite?**: use hash-fns package or other.

**evidence**: crypto.createHash('sha256') is built-in since node 0.1.x. no external dependency needed. research confirmed this pattern in codebase.

**verdict**: valid assumption, based on research.

### assumption 9: transformer/orchestrator separation

**what we assume**: computeFeedbackHash is a transformer, feedbackTakeSet is an orchestrator.

**what if opposite?**: inline hash computation.

**evidence**: extant patterns in this repo separate transformers from orchestrators. follows domain operation grains.

**verdict**: valid assumption, based on extant patterns.

## issues found

none. all assumptions are either:
1. based on evidence from research
2. based on extant patterns in codebase
3. explicit wisher requests

## conclusion

all 9 assumptions are valid and justified.
