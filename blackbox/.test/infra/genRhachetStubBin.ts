import fs from 'fs';
import path from 'path';
import { genTempDir } from 'test-fns';

/**
 * .what = one clone the stub rhachet reports on a tree's roster
 */
export interface RhachetStubClone {
  serial: string;
  slug: string;

  /**
   * how a say to this clone answers; absent = released
   * - `withheld` = the peer sits at a modal (exit 2, verdict withheld)
   * - `unconfirmed` = the say ran and could not confirm it landed (exit 0, no sure verdict)
   */
  say?: 'withheld' | 'unconfirmed';

  /**
   * the reason a `withheld` say names, as rhachet names it; absent = `modal-holds-focus`
   */
  sayReason?: 'modal-holds-focus' | 'input-region-dirty' | 'focus-unrecognized';

  /**
   * the reach state `clone list` reports for it; absent = LIVE
   */
  reachState?: 'LIVE' | 'DEAF' | 'DEAD';
}

/**
 * .what = one call the stub took, with the tree it ran in
 * .note = `cwd` is the base name of the dir the stub ran in; rhachet reads a tree's clones from
 *         its cwd, so this is the tree the phone aimed the call at
 */
export interface RhachetStubSaid {
  to: string;
  what: string;
  cwd: string;
}

/**
 * .what = the stand-in rhachet cli the stub runs as; answers `clone list` and `clone say`
 * .why = the two calls the phone makes, in the json shape rhachet prints, so the phone's own
 *        contract runs end to end with no live clone (a clone may not enroll another)
 * .note = the roster is keyed by the base name of the cwd, as rhachet keys it by the cwd: a call
 *         aimed at the wrong tree finds no clone there, and fails as real rhachet would
 */
const STUB_PROGRAM = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const rosters = JSON.parse(fs.readFileSync(process.env.STUB_RHACHET_ROSTER, 'utf8'));
const cwd = path.basename(process.cwd());
const roster = rosters[cwd] || [];
const [noun, verb, target] = process.argv.slice(2);
if (noun === 'clone' && verb === 'list') {
  fs.appendFileSync(process.env.STUB_RHACHET_LISTED, JSON.stringify({ cwd }) + '\\n');
  process.stdout.write(JSON.stringify({
    actors: [{ clones: roster.map((clone) => ({ reachState: 'LIVE', ...clone })) }],
  }));
  process.exit(0);
}
if (noun === 'clone' && verb === 'say') {
  const name = (target || '').replace(/^@:/, '');
  const clone = roster.find((one) => one.slug === name || one.serial === name);
  if (!clone) {
    process.stderr.write(JSON.stringify({ message: 'no clone answers to @:' + name }));
    process.exit(2);
  }
  const what = fs.readFileSync(0, 'utf8');
  if (clone.say === 'withheld') {
    fs.appendFileSync(process.env.STUB_RHACHET_WITHHELD, JSON.stringify({ to: clone.slug, cwd }) + '\\n');
    process.stderr.write(JSON.stringify({
      message: 'say withheld',
      metadata: { verdict: 'withheld', reason: clone.sayReason || 'modal-holds-focus' },
    }));
    process.exit(2);
  }
  fs.appendFileSync(process.env.STUB_RHACHET_SAID, JSON.stringify({ to: clone.slug, what, cwd }) + '\\n');
  if (clone.say === 'unconfirmed') {
    process.stdout.write(JSON.stringify({ delivered: false, verdict: 'unconfirmed', reason: 'no echo seen' }));
    process.exit(0);
  }
  process.stdout.write(JSON.stringify({ delivered: true, verdict: 'released', serial: clone.serial }));
  process.exit(0);
}
process.stderr.write('stub rhachet: no such verb: ' + process.argv.slice(2).join(' '));
process.exit(1);
`;

/**
 * .what = writes a stub rhachet cli plus its rosters, and names the env that binds the phone to it
 * .why = an acceptance journey drives the built phone skills against clones it can name, in the
 *        trees it names
 *
 * .note = each say the stub takes is appended, one json line, to `saidPath`, and each roster
 *         read to `listedPath`; the journey reads them to see what each peer received, in which
 *         tree, and when
 */
export const genRhachetStubBin = (input: {
  slug: string;
  rosters: Record<string, RhachetStubClone[]>;
}): {
  env: Record<string, string>;
  saidPath: string;
  getAllSaid: () => RhachetStubSaid[];
  getAllListed: () => { cwd: string }[];
  getAllWithheld: () => { to: string; cwd: string }[];
  setRosters: (rosters: Record<string, RhachetStubClone[]>) => void;
} => {
  const dir = genTempDir({ slug: input.slug });
  const binPath = path.join(dir, 'rhachet-stub');
  const rosterPath = path.join(dir, 'rosters.json');
  const saidPath = path.join(dir, 'said.jsonl');
  const listedPath = path.join(dir, 'listed.jsonl');
  const withheldPath = path.join(dir, 'withheld.jsonl');
  fs.writeFileSync(binPath, STUB_PROGRAM, { mode: 0o755 });
  fs.writeFileSync(rosterPath, JSON.stringify(input.rosters));
  fs.writeFileSync(saidPath, '');
  fs.writeFileSync(listedPath, '');
  fs.writeFileSync(withheldPath, '');
  const getAllLines = <T>(file: string): T[] =>
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  return {
    env: {
      PHONE_RHACHET_BIN: binPath,
      STUB_RHACHET_ROSTER: rosterPath,
      STUB_RHACHET_SAID: saidPath,
      STUB_RHACHET_LISTED: listedPath,
      STUB_RHACHET_WITHHELD: withheldPath,
    },
    saidPath,
    getAllSaid: () => getAllLines<RhachetStubSaid>(saidPath),
    getAllListed: () => getAllLines<{ cwd: string }>(listedPath),
    getAllWithheld: () => getAllLines<{ to: string; cwd: string }>(withheldPath),

    // the stub reads its rosters on each call, so a journey may clear a peer's modal mid-run
    setRosters: (rosters) =>
      fs.writeFileSync(rosterPath, JSON.stringify(rosters)),
  };
};
