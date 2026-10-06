/**
 * .what = the shared harness of the `git.grove.saturation` suite — the probe
 *         payload read from source, and the runners its clamps share
 *
 * .suite = the clamps on `git.grove.saturation`'s process census
 *
 * .why  = this skill had NO test file at all, and the defect it carries is one
 *         a reader cannot see: the probe counts ITSELF. so the first clamp it
 *         gets is the one that proves the instrument is not in its own census.
 *
 * .the tier = the probe payload is ONE self-contained bash string, run under
 *         `bash -c` for `local` and handed to `ssh` for a grove. so a clamp can
 *         extract those exact bytes and run them here — same instrument, same
 *         box, no ssh, no fleet within reach (rule.require.hermetic-tests).
 *
 * 🔴 .the fixture question, answered plainly
 *         the pane-capture convention (`.test/.assets/*.log`) governs a
 *         classifier whose INPUT is captured text. this defect has no such
 *         input: "the probe appears in its own snapshot" is a property of
 *         RUNNING the probe, and no captured log can exhibit it. so the fixture
 *         here is the live process table, and the payload is read from source
 *         rather than transcribed — a hand-typed payload is a payload that
 *         never ran (rule.always.clamp-the-verbatim-pane-your-classifier-judged,
 *         read for its ARGUMENT rather than its file convention).
 *
 *         the measured render is quoted on task #110 and in the skill's own
 *         `.why` at the census sites.
 */
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { tempDirs } from '../../.test/tempDirs';

export const PATH_SAT = join(__dirname, 'git.grove.saturation.sh');
export const PATH_SPEND = join(__dirname, 'git.grove.saturation.spend.sh');

export const MARK_OPEN = "PROBE=$(cat <<'REMOTE'\n";
export const MARK_SHUT = '\nREMOTE\n';

/**
 * .what = the probe payload, byte-identical to what ssh is handed
 * .why  = the clamp's subject is the bytes that actually run. a transcription
 *         would clamp the transcription (rule.require.trust-but-verify)
 */
export const getProbePayload = (): string => {
  const src = readFileSync(PATH_SAT, 'utf8');
  const at = src.indexOf(MARK_OPEN);
  if (at < 0)
    throw new Error(
      `the probe payload marker is absent from ${PATH_SAT} — the heredoc was renamed, so this clamp reads an empty subject and must be repaired rather than skipped`,
    );
  const rest = src.slice(at + MARK_OPEN.length);
  const shut = rest.indexOf(MARK_SHUT);
  if (shut < 0)
    throw new Error(
      `the probe payload is unterminated in ${PATH_SAT} — no closing REMOTE`,
    );
  return rest.slice(0, shut + 1);
};

/**
 * .what = the argv marker the [case2] sibling carries
 * .why  = the roll-up keys on `argv[0]` basename plus `argv[1]` for an
 *         interpreter, so a `bash <path>` sibling renders under a key that
 *         holds this slug. a marker the assertion can name is what parts a
 *         clamp with teeth from a clamp that reads the room.
 */
export const SLUG_SIBLING = 'sat-kin-sibling';

/**
 * .what = run the probe payload once, with a chosen root and an optional
 *         SIBLING process in its own group
 *
 * .why  = #111's defect lives in the gap between the payload and the fan-out
 *         that spawns it, so a clamp must be able to reproduce BOTH halves of
 *         the topology: a root pid, and a `timeout`-wrapped peer that setpgid
 *         put in a group of its own.
 *
 * args:
 *   root  = null   → no env at all. the REMOTE path
 *         = 'self' → `<this hostname>:<the wrapper's own pid>`. the LOCAL path
 *         = <else> → `<that string>:<pid>`. a root from another box
 *   sibling = spawn one `timeout`-wrapped cpu spinner, as a descendant of the
 *             root and in its own process group, warmed ~1.5s so `ps`'s
 *             cputime÷elapsed reads it near a full core
 */
export const runPayload = (input: {
  slug: string;
  root: string | null;
  sibling?: boolean;
}): string => {
  const dir = tempDirs.genOne({ slug: input.slug });
  const pathProbe = join(dir, 'probe.sh');
  writeFileSync(pathProbe, getProbePayload(), 'utf8');

  const lines: string[] = [];
  if (input.sibling) {
    // a spin loop in a file whose NAME carries the marker, so the roll-up's
    // `bash <basename>` key and the `proc=` args field both hold it
    const pathSpin = join(dir, `${SLUG_SIBLING}.sh`);
    writeFileSync(pathSpin, 'while :; do :; done\n', 'utf8');
    // ⚠️ `timeout` is the whole point — it calls setpgid(0,0), so the sibling
    //    lands in its OWN group exactly as each grove probe does. drop the
    //    timeout and the sibling shares the wrapper's group, the #110 filter
    //    catches it, and this clamp would pass under the un-fixed payload.
    lines.push(`timeout 20 bash ${pathSpin} &`);
    lines.push('sleep 1.5');
  }
  if (input.root === 'self')
    lines.push('export SAT_SELF_ROOT="$(hostname):$$"');
  else if (input.root !== null)
    lines.push(`export SAT_SELF_ROOT="${input.root}:$$"`);
  // the same shape the fan-out's local arm uses, so the group topology matches
  lines.push(`timeout 90 bash ${pathProbe}`);
  lines.push('rc=$?');
  lines.push('wait 2>/dev/null || true');
  lines.push('exit $rc');

  const out = spawnSync('bash', ['-c', lines.join('\n')], {
    encoding: 'utf8',
    timeout: 180_000,
  });
  if (out.status !== 0)
    throw new Error(
      `the probe exited ${out.status} — a clamp on its OUTPUT cannot run: ${out.stderr}`,
    );
  return out.stdout;
};
