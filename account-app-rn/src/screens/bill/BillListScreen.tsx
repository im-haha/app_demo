import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Chip, FAB, Searchbar, Text} from 'react-native-paper';
import {useAppStore} from '@/store/appStore';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';
import {colors} from '@/theme';
import {filterTypeOptions} from '@/utils/constants';

export default function BillListScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const bills = useAppStore(state => state.getBills({keyword, type}));
  const categories = useAppStore(state => state.categories);

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={{padding: 20, gap: 16}}>
        <View style={{gap: 8}}>
          <Text variant="headlineSmall" style={{fontWeight: '800'}}>
            全部账单
          </Text>
          <Searchbar
            placeholder="搜索备注关键字"
            value={keyword}
            onChangeText={setKeyword}
            style={{borderRadius: 22}}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection: 'row', gap: 8}}>
            {filterTypeOptions.map(item => (
              <Chip
                key={item.value}
                selected={type === item.value}
                onPress={() => setType(item.value)}
                selectedColor={colors.primary}>
                {item.label}
              </Chip>
            ))}
          </View>
        </ScrollView>
        {bills.length === 0 ? (
          <EmptyState
            title="还没有账单"
            description="先记第一笔，后面统计和预算才有意义。"
            icon="wallet-outline"
          />
        ) : (
          bills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              category={categories.find(item => item.id === bill.categoryId)}
              onPress={() => navigation.navigate('BillDetail', {billId: bill.id})}
            />
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={{position: 'absolute', right: 20, bottom: 24, backgroundColor: colors.secondary}}
        color="#FFFFFF"
        onPress={() => navigation.navigate('BillAdd')}
      />
    </View>
  );
}
