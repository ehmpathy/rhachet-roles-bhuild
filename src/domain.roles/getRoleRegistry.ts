import { RoleRegistry } from 'rhachet';

import { ROLE_BEHAVER } from './behaver/getBehaverRole';
import { ROLE_DECOMPOSER } from './decomposer/getDecomposerRole';
import { ROLE_DISPATCHER } from './dispatcher/getDispatcherRole';
import { BHUILD_REGISTRY_README } from './getRoleRegistry.readme';

/**
 * .what = returns the core registry of predefined roles and skills
 * .why =
 *   - enables CLI or thread logic to load available roles
 *   - avoids dynamic load or global mutation
 */
export const getRoleRegistry = (): RoleRegistry =>
  new RoleRegistry({
    slug: 'bhuild',
    readme: BHUILD_REGISTRY_README,
    roles: [ROLE_BEHAVER, ROLE_DECOMPOSER, ROLE_DISPATCHER],
  });
