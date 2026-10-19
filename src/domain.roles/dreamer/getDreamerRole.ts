import { Role } from 'rhachet';

export const ROLE_DREAMER: Role = Role.build({
  slug: 'dreamer',
  name: 'Dreamer',
  purpose: 'capture transient ideas without loss of focus',
  readme: { uri: __dirname + '/readme.md' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [],
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
