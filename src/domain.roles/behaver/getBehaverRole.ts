import { Role } from 'rhachet';

export const ROLE_BEHAVER: Role = Role.build({
  slug: 'behaver',
  name: 'Behaver',
  purpose: 'declare clear, buildable, and testable behaviors',
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
    exec: [{ cmd: __dirname + '/inits/init.claude.hooks.sh' }],
  },
});
