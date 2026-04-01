export interface AppColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  income: string;
  expense: string;
  danger: string;
  success: string;
  tabActiveHalo: string;
}

export const lightColors: AppColors = {
  background: '#F6F1E8',
  surface: '#FFFDF8',
  primary: '#1D4D4F',
  secondary: '#D47757',
  accent: '#E9B949',
  text: '#172321',
  muted: '#6C746A',
  border: '#D9D1C2',
  income: '#2D8A63',
  expense: '#D95D39',
  danger: '#C44536',
  success: '#2A9D8F',
  tabActiveHalo: '#E8EFEE',
};

export const darkColors: AppColors = {
  background: '#0E1417',
  surface: '#182024',
  primary: '#2B696C',
  secondary: '#D88767',
  accent: '#E4B25A',
  text: '#E7F0EE',
  muted: '#9AA9A5',
  border: '#2A353A',
  income: '#55C991',
  expense: '#FF8F6C',
  danger: '#EF6D5A',
  success: '#4EBFAE',
  tabActiveHalo: '#243337',
};

// Backward-compatible default export for legacy imports.
export const colors = lightColors;
