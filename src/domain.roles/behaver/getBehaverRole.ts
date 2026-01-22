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
    exec: [],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command:
            './node_modules/.bin/rhachet run --repo bhuild --role behaver --init claude.hooks/sessionstart.boot-behavior',
          timeout: 'PT10S',
        },
      ],
      onTool: [],
      onStop: [],
    },
  },
});
