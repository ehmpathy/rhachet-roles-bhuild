import type { InvokeHooks } from 'rhachet';

export { getRoleRegistry } from '@src/domain.roles/getRoleRegistry';

export const getInvokeHooks = (): InvokeHooks => ({
  onInvokeAskInput: [],
});
