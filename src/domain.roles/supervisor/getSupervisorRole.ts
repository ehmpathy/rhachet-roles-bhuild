import { Role } from 'rhachet';

export const ROLE_SUPERVISOR: Role = Role.build({
  slug: 'supervisor',
  name: 'Supervisor',
  purpose:
    'tend the camps — sprout trees, seat crews, and poll them for a verdict',
  readme: { uri: __dirname + '/readme.md' },

  // .why = the boot curation is the EXPENSIVE half of this role, not its code.
  //        uncurated, this role's briefs measure 159,698 tokens — 63% of a
  //        ~253k window. the boot.yml decides what a session must already know
  //        versus what it can look up, and each entry carries its own argument.
  //        a boot.yml on disk that no role declares is inert curation: it costs
  //        naught and buys naught, and the drop is silent in every test.
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
          command: './node_modules/.bin/rhachet roles boot --role supervisor',
          timeout: 'PT10S',
        },
      ],
      onTool: [],
      onStop: [],
    },
  },
});
