import { Role } from 'rhachet';

export const ROLE_DISPATCHER: Role = Role.build({
  slug: 'dispatcher',
  name: 'Dispatcher',
  purpose: 'prioritize and coordinate behaviors for optimal execution',
  readme: `
## 🦫 Dispatcher

Used to prioritize behaviors by effect (gain - cost) and coordinate them into parallel workstreams.

### Skills

- **gather**: collect behaviors from configured sources
- **deptrace**: trace dependency relationships between behaviors
- **measure**: compute gain/cost/effect for each behavior
- **triage**: assign urgency (now/soon/later) based on readiness and bandwidth
- **prioritize**: composite skill that runs gather → deptrace → measure → triage
- **coordinate**: group behaviors into ranked workstreams for parallel execution

### Key Concepts

- **leverage**: time savings from completing a behavior
- **yieldage**: cash value from completing a behavior
- **attend**: time investment required (hours × complexity)
- **expend**: cash investment required (direct + indirect)
- **effect**: gain - cost in dollar terms
- **priority**: p0/p1/p3/p5 based on effect thresholds
- **urgency**: now/soon/later based on readiness and bandwidth
  `.trim(),
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
