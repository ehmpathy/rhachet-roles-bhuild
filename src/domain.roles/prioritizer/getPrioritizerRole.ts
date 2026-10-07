import { Role } from 'rhachet';

export const ROLE_PRIORITIZER: Role = Role.build({
  slug: 'prioritizer',
  name: 'Prioritizer',
  purpose:
    'narrow the beam onto what matters — rank the store by gain against work',
  readme: { uri: __dirname + '/readme.md' },

  // .why = this role's seat exists BECAUSE of what it refuses to boot. at its
  //        origin it lived under `role=any`, which boots into every role in that
  //        repo — so a prioritizer session loaded ~150 supervisor briefs and ran
  //        a babysit tick it was never asked for (`rule.always.prioritize-never-
  //        supervise`). its own curation measures 65,049 tokens, and a consumer
  //        that enrolls both roles pays that PLUS the supervisor's 159,698.
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
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role prioritizer',
          timeout: 'PT10S',
        },
      ],
      onTool: [],
      onStop: [],
    },
  },
});
