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
  background: '#F3F7FC',
  surface: '#FFFFFF',
  primary: '#1E4668',
  secondary: '#5E7A97',
  accent: '#8A9EB3',
  text: '#142535',
  muted: '#66798C',
  border: '#D5DFEA',
  income: '#1D8567',
  expense: '#C06A43',
  danger: '#B94C38',
  success: '#1F8D73',
  tabActiveHalo: '#E7EEF6',
};

export const darkColors: AppColors = {
  background: '#0D1722',
  surface: '#162231',
  primary: '#78A9D2',
  secondary: '#5F7894',
  accent: '#8EA5BD',
  text: '#E7F0FA',
  muted: '#9CB0C4',
  border: '#2A3B4D',
  income: '#59C4A0',
  expense: '#E19068',
  danger: '#DA7059',
  success: '#61CDB2',
  tabActiveHalo: '#213041',
};

// Backward-compatible default export for legacy imports.
export const colors = lightColors;
