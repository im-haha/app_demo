import {DarkTheme, DefaultTheme, Theme as NavigationTheme} from '@react-navigation/native';
import {ColorSchemeName, useColorScheme} from 'react-native';
import {MD3DarkTheme, MD3LightTheme, MD3Theme} from 'react-native-paper';
import {useThemeStore} from '@/store/themeStore';
import {ResolvedThemeMode, ThemePreference} from '@/types/theme';
import {AppColors, colors as defaultColors, darkColors, lightColors} from './colors';
import {AppThemeTokens, buildThemeTokens} from './tokens';

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): ResolvedThemeMode {
  if (preference === 'LIGHT') {
    return 'light';
  }
  if (preference === 'DARK') {
    return 'dark';
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function getThemeColors(mode: ResolvedThemeMode): AppColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export function getThemeTokens(mode: ResolvedThemeMode): AppThemeTokens {
  return buildThemeTokens(mode, getThemeColors(mode));
}

function getSurfaceVariant(mode: ResolvedThemeMode): string {
  return mode === 'dark' ? '#203040' : '#EAF0F7';
}

export function buildPaperTheme(mode: ResolvedThemeMode): MD3Theme {
  const palette = getThemeColors(mode);
  const baseTheme = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    dark: mode === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      secondary: palette.secondary,
      tertiary: palette.accent,
      background: palette.background,
      surface: palette.surface,
      surfaceVariant: getSurfaceVariant(mode),
      outline: palette.border,
      onSurface: palette.text,
      onBackground: palette.text,
      onPrimary: '#FFFFFF',
      error: palette.danger,
    },
    roundness: 18,
  };
}

export function buildNavigationTheme(mode: ResolvedThemeMode): NavigationTheme {
  const palette = getThemeColors(mode);
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    dark: mode === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.secondary,
    },
  };
}

export function useResolvedThemeMode(): ResolvedThemeMode {
  const preference = useThemeStore(state => state.preference);
  const systemScheme = useColorScheme();
  return resolveThemeMode(preference, systemScheme);
}

export function useThemeColors(): AppColors {
  const mode = useResolvedThemeMode();
  return getThemeColors(mode);
}

export function useThemeTokens(): AppThemeTokens {
  const mode = useResolvedThemeMode();
  return getThemeTokens(mode);
}

export {defaultColors as colors};
