import { Role } from 'rhachet';

export const ROLE_DECOMPOSER: Role = Role.build({
  slug: 'decomposer',
  name: 'Decomposer',
  purpose: 'decompose large behaviors into focused sub-behaviors',
  readme: { uri: __dirname + '/readme.md' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  inits: {
    dirs: { uri: __dirname + '/inits' },
    exec: [],
  },
});
