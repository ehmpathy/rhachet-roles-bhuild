import { Role } from 'rhachet';

import { DECOMPOSER_ROLE_README } from './getDecomposerRole.readme';

export const ROLE_DECOMPOSER: Role = Role.build({
  slug: 'decomposer',
  name: 'Decomposer',
  purpose: 'decompose large behaviors into focused sub-behaviors',
  readme: DECOMPOSER_ROLE_README,
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
