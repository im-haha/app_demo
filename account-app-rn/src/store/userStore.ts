import {useMemo} from 'react';
import {useAuthStore} from './authStore';

export const useCurrentUser = () => {
  const users = useAuthStore(state => state.users);
  const currentUserId = useAuthStore(state => state.currentUserId);

  return useMemo(() => users.find(user => user.id === currentUserId), [users, currentUserId]);
};

export const useIsAuthenticated = () =>
  useAuthStore(state => Boolean(state.currentUserId));
