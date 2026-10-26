import { Role } from 'rhachet';

export const ROLE_DISPATCHER: Role = Role.build({
  slug: 'dispatcher',
  name: 'Dispatcher',
  purpose: 'broadcast and receive tasks via radio channels',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
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
  keyrack: { uri: __dirname + '/keyrack.yml' },
  hooks: {
    onBrain: {
      onBoot: [],
      onTool: [],
      onStop: [
        // remind the human of held radio tasks in one line; direct cli call, no rhachet header in the hook json
        {
          command: `node -e "import('rhachet-roles-bhuild/cli').then(m => m.cli.radioTaskQueue())" -- get --when hook.onStop`,
          timeout: 'PT10S',
        },
      ],
    },
  },
});
