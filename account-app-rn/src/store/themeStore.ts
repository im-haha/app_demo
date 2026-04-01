import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {ThemePreference} from '@/types/theme';
import {storageKeys} from '@/utils/storage';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (nextPreference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      preference: 'SYSTEM',
      setPreference: nextPreference => set({preference: nextPreference}),
    }),
    {
      name: storageKeys.theme,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
