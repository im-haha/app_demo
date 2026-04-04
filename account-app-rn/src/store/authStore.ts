import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {LoginPayload, RegisterPayload, UserProfile} from '@/types/user';
import {
  LocalAuthCredential,
  hashLocalPassword,
  normalizePersistedAppData,
  normalizeUsername,
} from '@/services/localAppService';
import {storageKeys} from '@/utils/storage';

interface AuthPersistedState {
  users: UserProfile[];
  currentUserId: number | null;
  authCredentials: LocalAuthCredential[];
}

interface AuthState extends AuthPersistedState {
  hydrated: boolean;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  logout: () => void;
  getCurrentUser: () => UserProfile | undefined;
  updateProfile: (nickname: string) => void;
  hydrateFromLegacy: (payload: AuthPersistedState) => void;
}

function nextId(items: Array<{id: number}>): number {
  return items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

function nowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

const initialAuthState: AuthPersistedState = {
  users: [],
  currentUserId: null,
  authCredentials: [],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      hydrated: false,
      register: async payload => {
        const username = normalizeUsername(payload.username);
        if (!username) {
          throw new Error('账本账号不能为空');
        }
        const nickname = payload.nickname.trim();
        if (!nickname) {
          throw new Error('昵称不能为空');
        }

        const state = get();
        if (state.users.some(user => user.username === username)) {
          throw new Error('账本账号已存在');
        }

        const now = nowString();
        const user: UserProfile = {
          id: nextId(state.users),
          username,
          nickname,
          status: 1,
          createdAt: now,
          updatedAt: now,
        };
        const credential: LocalAuthCredential = {
          userId: user.id,
          passwordHash: hashLocalPassword(username, payload.password),
          updatedAt: now,
        };

        set(current => ({
          ...current,
          users: [...current.users, user],
          authCredentials: [
            ...current.authCredentials.filter(item => item.userId !== user.id),
            credential,
          ],
          currentUserId: user.id,
        }));

        return user;
      },
      login: async payload => {
        const username = normalizeUsername(payload.username);
        const state = get();
        const user = state.users.find(item => item.username === username);
        const credential = user
          ? state.authCredentials.find(item => item.userId === user.id)
          : undefined;
        const passwordHash = hashLocalPassword(username, payload.password);

        if (!user || !credential || credential.passwordHash !== passwordHash) {
          throw new Error('账本账号或解锁口令错误');
        }

        set(current => ({...current, currentUserId: user.id}));
        return user;
      },
      logout: () => set(current => ({...current, currentUserId: null})),
      getCurrentUser: () => {
        const state = get();
        return state.users.find(user => user.id === state.currentUserId);
      },
      updateProfile: nickname => {
        const state = get();
        if (!state.currentUserId) {
          throw new Error('请先解锁账本');
        }

        const trimmedNickname = nickname.trim();
        if (!trimmedNickname) {
          throw new Error('昵称不能为空');
        }

        const now = nowString();
        set(current => ({
          ...current,
          users: current.users.map(user =>
            user.id === current.currentUserId
              ? {...user, nickname: trimmedNickname, updatedAt: now}
              : user,
          ),
        }));
      },
      hydrateFromLegacy: payload =>
        set(current => {
          if (current.users.length > 0 || current.authCredentials.length > 0) {
            return current;
          }
          return {
            ...current,
            users: payload.users,
            currentUserId: payload.currentUserId,
            authCredentials: payload.authCredentials,
          };
        }),
    }),
    {
      name: storageKeys.auth,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        users: state.users,
        currentUserId: state.currentUserId,
        authCredentials: state.authCredentials,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState(current => {
          const normalized = normalizePersistedAppData({
            users: current.users as Array<UserProfile & {password?: string}>,
            currentUserId: current.currentUserId,
            authCredentials: current.authCredentials,
          });
          return {
            ...current,
            users: normalized.users,
            currentUserId: normalized.currentUserId,
            authCredentials: normalized.authCredentials,
            hydrated: true,
          };
        });
      },
    },
  ),
);
