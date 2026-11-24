import { Role } from 'rhachet';

export const ROLE_PRIORITIZER: Role = Role.build({
  slug: 'prioritizer',
  name: 'Prioritizer',
  purpose:
    'narrow the beam onto what matters — rank the store by gain against work',
  readme: { uri: __dirname + '/readme.md' },

  /**
   * .why = under `role=any`, a prioritizer session booted ~150 supervisor briefs.
   *        its own curation measures 65,049 tokens; both roles enrolled add the supervisor's 159,698
   */
  boot: { uri: __dirname + '/boot.yml' },

  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  inits: {
    dirs: undefined,
    exec: [],
  },
  hooks: {
    onBrain: {
      onBoot: [],
      onTool: [],
      onStop: [],
    },
  },
});
