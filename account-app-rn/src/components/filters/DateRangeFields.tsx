import React from 'react';
import {View} from 'react-native';
import AppInput from '@/components/common/AppInput';

interface DateRangeFieldsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
}

export default function DateRangeFields({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = '开始日期',
  endLabel = '结束日期',
}: DateRangeFieldsProps): React.JSX.Element {
  return (
    <View style={{flexDirection: 'row', gap: 10}}>
      <View style={{flex: 1}}>
        <AppInput
          label={startLabel}
          value={startDate}
          onChangeText={onStartDateChange}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      </View>
      <View style={{flex: 1}}>
        <AppInput
          label={endLabel}
          value={endDate}
          onChangeText={onEndDateChange}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      </View>
    </View>
  );
}
