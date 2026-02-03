import { Role } from 'rhachet';

export const ROLE_DISPATCHER: Role = Role.build({
  slug: 'dispatcher',
  name: 'Dispatcher',
  purpose: 'broadcast and receive tasks via radio channels',
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
    dirs: { uri: __dirname + '/inits' },
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
