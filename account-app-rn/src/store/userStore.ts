import {useAppStore} from './appStore';

export const useCurrentUser = () => useAppStore(state => state.getCurrentUser());
export const useIsAuthenticated = () =>
  useAppStore(state => Boolean(state.currentUserId && state.token));
