import type { RhachetCloneSayRaw } from '@src/access/sdks/sdkRhachetClone';
import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

/**
 * .what = the dependencies every phone operation reads, injected so a test can supply fakes
 * .why = the phone touches three outside things — the tree dirs on this grove, the grove registry, and
 *        rhachet's clones — and each is a boundary a test must control (rule.require.dependency-injection)
 */
export interface PhoneContext {
  /**
   * where the trees on this grove live: `<gitRoot>/<org>/_worktrees/<tree>` or `<gitRoot>/<org>/<tree>`
   */
  gitRoot: string;

  /**
   * the git forest dir, whose `groves/<grove>.json` names each grove known here
   */
  forestDir: string;

  /**
   * this grove's own name: the one `local` is cast to before any address is stored or printed
   */
  groveSelf: string;

  /**
   * the rhachet clone boundary
   */
  sdkClone: {
    getAllClones: (input: { treeDir: string }) => Promise<PhoneTreeClone[]>;
    say: (input: {
      treeDir: string;
      clone: string;
      what: string;
    }) => Promise<RhachetCloneSayRaw>;
  };
}
