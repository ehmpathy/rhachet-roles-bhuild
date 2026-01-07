import type { InvokeHooks, RoleRegistry } from 'rhachet';

import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'rhachet-roles-bhuild';
import { getRoleRegistry as getRoleRegistryEhmpathy, getInvokeHooks as getInvokeHooksEhmpathy } from 'rhachet-roles-ehmpathy';
import { getRoleRegistry as getRoleRegistryBhrain, getInvokeHooks as getInvokeHooksBhrain } from 'rhachet-roles-bhrain';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryEhmpathy(), getRoleRegistryBhuild(), getRoleRegistryBhrain()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksEhmpathy(), getInvokeHooksBhuild(), getInvokeHooksBhrain()];
