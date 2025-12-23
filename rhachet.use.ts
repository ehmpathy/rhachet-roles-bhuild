import type { InvokeHooks, RoleRegistry } from 'rhachet';

import { getRoleRegistry as getRoleRegistryEhmpathy, getInvokeHooks as getInvokeHooksEhmpathy } from 'rhachet-roles-ehmpathy';
import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'rhachet-roles-bhuild';
// import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'dist/index.js';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryEhmpathy(), getRoleRegistryBhuild()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksEhmpathy(), getInvokeHooksBhuild()];
