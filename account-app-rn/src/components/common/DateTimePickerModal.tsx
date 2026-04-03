import React, {useEffect, useMemo, useState} from 'react';
import {Modal, Pressable, View} from 'react-native';
import dayjs from 'dayjs';
import {Text} from 'react-native-paper';
import {useThemeColors} from '@/theme';

export type DateTimePickerMode = 'date' | 'time';

interface DateTimePickerModalProps {
  visible: boolean;
  mode: DateTimePickerMode;
  initialValue: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}

function formatValue(mode: DateTimePickerMode, value: Date): string {
  return mode === 'date'
    ? dayjs(value).format('YYYY-MM-DD')
    : dayjs(value).format('HH:mm');
}

export default function DateTimePickerModal({
  visible,
  mode,
  initialValue,
  onCancel,
  onConfirm,
}: DateTimePickerModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const [draftValue, setDraftValue] = useState<Date>(initialValue);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftValue(initialValue);
  }, [initialValue, visible]);

  const title = mode === 'date' ? '选择日期' : '选择时间';
  const displayValue = useMemo(
    () => formatValue(mode, draftValue),
    [draftValue, mode],
  );

  function changeDate(days: number): void {
    setDraftValue(current => dayjs(current).add(days, 'day').toDate());
  }

  function changeHour(hours: number): void {
    setDraftValue(current => dayjs(current).add(hours, 'hour').toDate());
  }

  function changeMinute(minutes: number): void {
    setDraftValue(current => dayjs(current).add(minutes, 'minute').toDate());
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(10,18,24,0.52)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}>
        <View
          style={{
            borderRadius: 22,
            padding: 18,
            gap: 14,
            backgroundColor: colors.surface,
          }}>
          <Text variant="titleMedium" style={{fontWeight: '800', color: colors.text}}>
            {title}
          </Text>
          <View
            style={{
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: 'rgba(126,136,131,0.35)',
              backgroundColor: 'rgba(130,140,136,0.08)',
            }}>
            <Text variant="headlineSmall" style={{fontWeight: '700', color: colors.primary}}>
              {displayValue}
            </Text>
          </View>

          {mode === 'date' ? (
            <View style={{gap: 8}}>
              <View style={{flexDirection: 'row', gap: 8}}>
                <ActionButton label="前一天" onPress={() => changeDate(-1)} />
                <ActionButton label="后一天" onPress={() => changeDate(1)} />
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                <ActionButton label="前一周" onPress={() => changeDate(-7)} />
                <ActionButton label="后一周" onPress={() => changeDate(7)} />
                <ActionButton
                  label="今天"
                  onPress={() => setDraftValue(current => {
                    const now = dayjs();
                    return dayjs(current)
                      .year(now.year())
                      .month(now.month())
                      .date(now.date())
                      .toDate();
                  })}
                />
              </View>
            </View>
          ) : (
            <View style={{gap: 8}}>
              <View style={{flexDirection: 'row', gap: 8}}>
                <ActionButton label="-1小时" onPress={() => changeHour(-1)} />
                <ActionButton label="+1小时" onPress={() => changeHour(1)} />
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                <ActionButton label="-10分钟" onPress={() => changeMinute(-10)} />
                <ActionButton label="+10分钟" onPress={() => changeMinute(10)} />
                <ActionButton
                  label="现在"
                  onPress={() =>
                    setDraftValue(current => {
                      const now = dayjs();
                      return dayjs(current)
                        .hour(now.hour())
                        .minute(now.minute())
                        .second(0)
                        .toDate();
                    })
                  }
                />
              </View>
            </View>
          )}

          <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
            <Pressable onPress={onCancel} style={{paddingHorizontal: 10, paddingVertical: 8}}>
              <Text variant="labelLarge" style={{color: colors.muted}}>
                取消
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(draftValue)}
              style={{paddingHorizontal: 10, paddingVertical: 8}}>
              <Text variant="labelLarge" style={{color: colors.primary, fontWeight: '700'}}>
                确定
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 34,
        borderRadius: 12,
        paddingHorizontal: 10,
        justifyContent: 'center',
        backgroundColor: 'rgba(130,140,136,0.16)',
      }}>
      <Text variant="labelMedium">{label}</Text>
    </Pressable>
  );
}
