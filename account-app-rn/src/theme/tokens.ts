import {ViewStyle} from 'react-native';
import {AppColors} from './colors';

export interface AppThemeTokens {
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  surface: {
    default: string;
    raised: string;
    muted: string;
    accent: string;
  };
  borderTone: {
    default: string;
    strong: string;
    subtle: string;
  };
  shadow: {
    card: ViewStyle;
    fab: ViewStyle;
    modal: ViewStyle;
  };
  textTone: {
    primary: string;
    secondary: string;
    tertiary: string;
    danger: string;
  };
  interactive: {
    pressed: string;
    selected: string;
    disabled: string;
    focus: string;
  };
  size: {
    touchMin: number;
    chipHeight: number;
    controlHeight: number;
    switchHeight: number;
  };
}

export function buildThemeTokens(mode: 'light' | 'dark', colors: AppColors): AppThemeTokens {
  const isDark = mode === 'dark';

  return {
    radius: {
      sm: 10,
      md: 14,
      lg: 18,
      xl: 24,
      pill: 999,
    },
    surface: {
      default: colors.surface,
      raised: isDark ? '#1B2B3C' : '#FFFFFF',
      muted: isDark ? '#111B22' : '#F6F0FF',
      accent: isDark ? '#1A2731' : '#ECE4FC',
    },
    borderTone: {
      default: colors.border,
      strong: isDark ? 'rgba(142,148,143,0.3)' : 'rgba(142,148,143,0.22)',
      subtle: isDark ? 'rgba(142,148,143,0.2)' : 'rgba(142,148,143,0.14)',
    },
    shadow: {
      card: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: isDark ? 0.2 : 0.09,
        shadowRadius: 10,
        elevation: 3,
      },
      fab: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: isDark ? 0.24 : 0.14,
        shadowRadius: 12,
        elevation: 6,
      },
      modal: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: isDark ? 0.28 : 0.16,
        shadowRadius: 16,
        elevation: 8,
      },
    },
    textTone: {
      primary: colors.text,
      secondary: colors.muted,
      tertiary: isDark ? '#97A9A4' : '#7A8682',
      danger: colors.danger,
    },
    interactive: {
      pressed: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,53,0.08)',
      selected: isDark ? 'rgba(120,169,210,0.2)' : 'rgba(30,70,104,0.12)',
      disabled: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(20,37,53,0.2)',
      focus: isDark ? 'rgba(120,169,210,0.45)' : 'rgba(30,70,104,0.32)',
    },
    size: {
      touchMin: 44,
      chipHeight: 44,
      controlHeight: 56,
      switchHeight: 44,
    },
  };
}
