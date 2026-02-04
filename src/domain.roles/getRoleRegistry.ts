import { RoleRegistry } from 'rhachet';

import { ROLE_BEHAVER } from './behaver/getBehaverRole';
import { ROLE_DECOMPOSER } from './decomposer/getDecomposerRole';
import { ROLE_DISPATCHER } from './dispatcher/getDispatcherRole';
import { ROLE_DREAMER } from './dreamer/getDreamerRole';

/**
 * .what = returns the core registry of predefined roles and skills
 * .why =
 *   - enables CLI or thread logic to load available roles
 *   - avoids dynamic load or global mutation
 */
export const getRoleRegistry = (): RoleRegistry =>
  new RoleRegistry({
    slug: 'bhuild',
    readme: { uri: __dirname + '/readme.md' },
    roles: [ROLE_BEHAVER, ROLE_DECOMPOSER, ROLE_DISPATCHER, ROLE_DREAMER],
  });
