import {MD3LightTheme} from 'react-native-paper';
import {colors} from './colors';

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: '#F0E8DA',
    outline: colors.border,
    onSurface: colors.text,
    onBackground: colors.text,
    error: colors.danger,
  },
  roundness: 18,
};

export {colors};
