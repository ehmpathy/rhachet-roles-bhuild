import { Role, RoleTrait } from 'rhachet';


export const ROLE_THINKER: Role = Role.build({
  slug: 'bhuild',
  name: 'Behaver',
  purpose: 'declare clear, buildable, and testable behaviors',
  readme: `
## 📐 Behaver

Used to declare clear and testable behaviors that can be reliably built and verified.
  `.trim(),
  traits: [
  ],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
