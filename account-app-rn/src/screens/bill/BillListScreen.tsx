import React, {useMemo, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';
import {Chip, Searchbar, Text} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppStore} from '@/store/appStore';
import BillCard from '@/components/bill/BillCard';
import EmptyState from '@/components/common/EmptyState';
import {useThemeColors} from '@/theme';
import {filterTypeOptions} from '@/utils/constants';
import SearchLineIcon from '@/components/common/icons/SearchLineIcon';
import PlusLineIcon from '@/components/common/icons/PlusLineIcon';
import DraggableFab from '@/components/common/DraggableFab';

export default function BillListScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const fabBottom = 24 + Math.max(insets.bottom, 8);
  const listBottomPadding = fabBottom + 88;
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const storeBills = useAppStore(state => state.bills);
  const currentUserId = useAppStore(state => state.currentUserId);
  const categories = useAppStore(state => state.categories);
  const bills = useMemo(
    () =>
      storeBills
        .filter(bill => bill.userId === currentUserId && !bill.deleted)
        .filter(bill => (type === 'ALL' ? true : bill.type === type))
        .filter(bill =>
          keyword.trim()
            ? bill.remark.toLowerCase().includes(keyword.toLowerCase().trim())
            : true,
        )
        .sort(
          (left, right) =>
            dayjs(right.billTime).valueOf() - dayjs(left.billTime).valueOf(),
        ),
    [storeBills, currentUserId, type, keyword],
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <View style={{flex: 1}}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 10,
            gap: 12,
          }}>
          <View style={{gap: 8}}>
            <Text variant="headlineSmall" style={{fontWeight: '800'}}>
              全部账单
            </Text>
            <Searchbar
              placeholder="搜索备注关键字"
              value={keyword}
              onChangeText={setKeyword}
              icon={() => <SearchLineIcon />}
              clearIcon={() => null}
              style={{borderRadius: 22}}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'row', gap: 8}}>
              {filterTypeOptions.map(item => (
                <Chip
                  key={item.value}
                  selected={type === item.value}
                  showSelectedCheck={false}
                  onPress={() => setType(item.value)}
                  selectedColor={colors.primary}>
                  {item.label}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: listBottomPadding,
            paddingTop: 8,
            gap: 12,
          }}>
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
                onPress={() =>
                  navigation.navigate('BillDetail', {billId: bill.id})
                }
              />
            ))
          )}
        </ScrollView>
        <DraggableFab
          bottomOffset={fabBottom}
          backgroundColor={colors.secondary}
          onPress={() => navigation.navigate('BillAdd')}>
          <PlusLineIcon />
        </DraggableFab>
      </View>
    </SafeAreaView>
  );
}
