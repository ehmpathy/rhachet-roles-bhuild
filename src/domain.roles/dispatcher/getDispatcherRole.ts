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
  keyrack: { uri: __dirname + '/keyrack.yml' },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role dispatcher',
          timeout: 'PT10S',
        },
      ],
      onTool: [],
      onStop: [
        // remind the human of held radio tasks, in one line; never blocks the stop.
        // calls the skill's cli export direct, as radio.task.held.sh does:
        // `rhachet run` prints a header to stdout, which would break the json
        // systemMessage claude parses from the hook
        {
          command: `node -e "import('rhachet-roles-bhuild').then(m => m.cli.radioTaskHeld())" -- --when hook.onStop`,
          timeout: 'PT10S',
        },
      ],
    },
  },
});
