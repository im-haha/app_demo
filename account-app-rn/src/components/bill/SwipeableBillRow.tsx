import React, {useEffect, useMemo, useRef} from 'react';
import {Pressable, View} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {Text} from 'react-native-paper';
import {useThemeColors} from '@/theme';

interface SwipeableBillRowProps {
  rowKey: number;
  activeRowKey?: number | null;
  onRowOpen?: (rowKey: number) => void;
  onRowClose?: (rowKey: number) => void;
  onPress?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function SwipeableBillRow({
  rowKey,
  activeRowKey,
  onRowOpen,
  onRowClose,
  onPress,
  onEdit,
  onDelete,
  disabled = false,
  children,
}: SwipeableBillRowProps): React.JSX.Element {
  const colors = useThemeColors();
  const swipeableRef = useRef<Swipeable | null>(null);

  useEffect(() => {
    if (activeRowKey !== null && activeRowKey !== undefined && activeRowKey !== rowKey) {
      swipeableRef.current?.close();
    }
  }, [activeRowKey, rowKey]);

  function closeRow(): void {
    swipeableRef.current?.close();
  }

  const contentNode = useMemo(() => {
    if (!React.isValidElement(children)) {
      return (
        <Pressable
          onPress={() => {
            closeRow();
            onPress?.();
          }}>
          {children}
        </Pressable>
      );
    }

    const childProps = children.props as {onPress?: () => void};
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: () => {
        closeRow();
        onPress?.();
        childProps.onPress?.();
      },
    });
  }, [children, onPress]);

  if (disabled) {
    return <>{contentNode}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2.2}
      rightThreshold={36}
      overshootRight={false}
      onSwipeableWillOpen={() => onRowOpen?.(rowKey)}
      onSwipeableClose={() => onRowClose?.(rowKey)}
      renderRightActions={() => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'stretch',
            marginLeft: 10,
            borderRadius: 22,
            overflow: 'hidden',
          }}>
          <Pressable
            onPress={() => {
              closeRow();
              onEdit();
            }}
            style={{
              width: 78,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.secondary,
            }}>
            <Text variant="labelLarge" style={{color: '#FFFFFF', fontWeight: '700'}}>
              编辑
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              closeRow();
              onDelete();
            }}
            style={{
              width: 78,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.danger,
            }}>
            <Text variant="labelLarge" style={{color: '#FFFFFF', fontWeight: '700'}}>
              删除
            </Text>
          </Pressable>
        </View>
      )}>
      {contentNode}
    </Swipeable>
  );
}
