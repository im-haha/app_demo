export const categoryIconTheme = {
  food: {
    bgColor: '#F9EBDD',
    iconColor: '#E07B56',
  },
  transport: {
    bgColor: '#EAF0FA',
    iconColor: '#4C78C9',
  },
  bonus: {
    bgColor: '#F8F0D9',
    iconColor: '#D8A92E',
  },
  housing: {
    bgColor: '#EEE7E1',
    iconColor: '#9A7B67',
  },
  salary: {
    bgColor: '#E5F4EC',
    iconColor: '#2C9B74',
  },
  entertainment: {
    bgColor: '#EEE8F7',
    iconColor: '#7A5BC0',
  },
  shopping: {
    bgColor: '#F8E6EE',
    iconColor: '#D64C82',
  },
  other: {
    bgColor: '#ECECEC',
    iconColor: '#7B7B7B',
  },
} as const;

export type CategoryIconKey = keyof typeof categoryIconTheme;
