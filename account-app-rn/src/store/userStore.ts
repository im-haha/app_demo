import {useMemo} from 'react';
import {useAppStore} from './appStore';

export const useCurrentUser = () => {
  const users = useAppStore(state => state.users);
  const currentUserId = useAppStore(state => state.currentUserId);

  return useMemo(() => users.find(user => user.id === currentUserId), [users, currentUserId]);
};

export const useIsAuthenticated = () =>
  useAppStore(state => Boolean(state.currentUserId && state.token));
