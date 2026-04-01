import React from 'react';
import {View} from 'react-native';
import {Card, ProgressBar, Text} from 'react-native-paper';
import {CategoryStat} from '@/types/bill';
import {colors} from '@/theme';
import {formatCurrency} from '@/utils/format';

interface Props {
  title: string;
  data: CategoryStat[];
}

export default function PieChartCard({title, data}: Props): React.JSX.Element {
  return (
    <Card mode="contained" style={{backgroundColor: colors.surface, borderRadius: 24}}>
      <Card.Content style={{gap: 14}}>
        <Text variant="titleMedium">{title}</Text>
        {data.length === 0 ? (
          <Text variant="bodyMedium" style={{color: colors.muted}}>
            当前没有统计数据
          </Text>
        ) : (
          data.map(item => (
            <View key={item.categoryId} style={{gap: 6}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text>{item.categoryName}</Text>
                <Text style={{color: colors.muted}}>
                  {formatCurrency(item.amount)} / {(item.percentage * 100).toFixed(0)}%
                </Text>
              </View>
              <ProgressBar progress={item.percentage} color={item.color} style={{height: 8}} />
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );
}
