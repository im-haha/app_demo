import {ResolvedThemeMode} from '@/types/theme';

export interface StatsChartTheme {
  panelBorder: string;
  panelMutedFill: string;
  axisText: string;
  axisGrid: string;
  expenseLine: string;
  expenseFill: string;
  incomeLine: string;
  incomeFill: string;
  neutralLine: string;
  tooltipBackground: string;
  tooltipBorder: string;
  positive: string;
  negative: string;
  donutPalette: string[];
}

const lightTheme: StatsChartTheme = {
  panelBorder: 'rgba(16,42,67,0.08)',
  panelMutedFill: 'rgba(240,245,251,0.84)',
  axisText: '#7B8794',
  axisGrid: 'rgba(16,42,67,0.08)',
  expenseLine: '#C56A3C',
  expenseFill: 'rgba(197,106,60,0.12)',
  incomeLine: '#1D8A6C',
  incomeFill: 'rgba(29,138,108,0.12)',
  neutralLine: '#4F6D8A',
  tooltipBackground: '#F8FBFF',
  tooltipBorder: 'rgba(54,95,130,0.16)',
  positive: '#1D8A6C',
  negative: '#B44A35',
  donutPalette: ['#4C6A88', '#6384A5', '#7A97B1', '#9EAEBE', '#C0A07D', '#8FA3B8'],
};

const darkTheme: StatsChartTheme = {
  panelBorder: 'rgba(149,170,188,0.22)',
  panelMutedFill: 'rgba(14,24,36,0.7)',
  axisText: '#95A6B8',
  axisGrid: 'rgba(149,170,188,0.18)',
  expenseLine: '#E19068',
  expenseFill: 'rgba(225,144,104,0.14)',
  incomeLine: '#59C4A0',
  incomeFill: 'rgba(89,196,160,0.14)',
  neutralLine: '#9AB3CE',
  tooltipBackground: '#122031',
  tooltipBorder: 'rgba(149,170,188,0.32)',
  positive: '#59C4A0',
  negative: '#E19068',
  donutPalette: ['#88A8C7', '#78C0A4', '#B89D83', '#6F8FAF', '#A3B2C2', '#50718E'],
};

export function getStatsChartTheme(mode: ResolvedThemeMode): StatsChartTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
