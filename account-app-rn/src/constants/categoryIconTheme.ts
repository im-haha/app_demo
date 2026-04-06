export const categoryIconTheme = {
  food: {
    bgColor: '#F9EBDD',
    iconColor: '#E07B56',
  },
  transport: {
    bgColor: '#EAF0FA',
    iconColor: '#4C78C9',
  },
  communication: {
    bgColor: '#E8EEF9',
    iconColor: '#4A6FA5',
  },
  shopping: {
    bgColor: '#F8E6EE',
    iconColor: '#D64C82',
  },
  housing: {
    bgColor: '#EEE7E1',
    iconColor: '#9A7B67',
  },
  medical: {
    bgColor: '#F8E7E4',
    iconColor: '#C44536',
  },
  entertainment: {
    bgColor: '#EEE8F7',
    iconColor: '#7A5BC0',
  },
  study: {
    bgColor: '#E6F3EB',
    iconColor: '#3C8D5A',
  },
  travel: {
    bgColor: '#DFF2EF',
    iconColor: '#1D7874',
  },
  salary: {
    bgColor: '#E5F4EC',
    iconColor: '#2C9B74',
  },
  bonus: {
    bgColor: '#F8F0D9',
    iconColor: '#D8A92E',
  },
  other: {
    bgColor: '#ECECEC',
    iconColor: '#7B7B7B',
  },
} as const;

export type CategoryIconKey = keyof typeof categoryIconTheme;
