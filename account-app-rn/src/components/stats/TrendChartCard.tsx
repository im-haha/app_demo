import React from 'react';
import {View} from 'react-native';
import {Card, Text} from 'react-native-paper';
import {TrendPoint} from '@/types/bill';
import {colors} from '@/theme';

interface Props {
  title: string;
  data: TrendPoint[];
}

export default function TrendChartCard({title, data}: Props): React.JSX.Element {
  const maxValue = Math.max(...data.map(item => item.amount), 1);

  return (
    <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
      <Card.Content style={{gap: 16}}>
        <Text variant="titleMedium">{title}</Text>
        <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 160}}>
          {data.map(item => (
            <View key={item.date} style={{flex: 1, alignItems: 'center', gap: 8}}>
              <View
                style={{
                  width: 18,
                  height: `${Math.max((item.amount / maxValue) * 100, item.amount > 0 ? 8 : 2)}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 999,
                }}
              />
              <Text variant="bodySmall" style={{color: colors.muted}}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}
