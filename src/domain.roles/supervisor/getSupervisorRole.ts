import { Role } from 'rhachet';

export const ROLE_SUPERVISOR: Role = Role.build({
  slug: 'supervisor',
  name: 'Supervisor',
  purpose:
    'tend the camps — sprout trees, seat crews, and poll them for a verdict',
  readme: { uri: __dirname + '/readme.md' },

  /**
   * .why = uncurated, this role's briefs measure 159,698 tokens, 63% of a ~253k window.
   *        a boot.yml no role declares is inert, and its drop is silent in every test
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
