import React, {useEffect, useMemo, useRef} from 'react';
import {Pressable, View} from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
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

const ACTION_WIDTH = 78;

function RightAction({
  label,
  backgroundColor,
  progress,
  drag,
  onPress,
}: {
  label: string;
  backgroundColor: string;
  progress: SharedValue<number>;
  drag: SharedValue<number>;
  onPress: () => void;
}): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    const translateX = interpolate(
      drag.value,
      [-ACTION_WIDTH * 2, -ACTION_WIDTH, 0],
      [0, 8, 20],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.2, 1],
      [0, 0.55, 1],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.95, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{translateX}, {scale}],
      opacity,
    };
  }, [drag, progress]);

  return (
    <Animated.View style={[{width: ACTION_WIDTH}, style]}>
      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor,
        }}>
        <Text variant="labelLarge" style={{color: '#FFFFFF', fontWeight: '700'}}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
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
  const swipeableRef = useRef<SwipeableMethods | null>(null);

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

    const childElement = children as React.ReactElement<{onPress?: () => void}>;
    const childProps = childElement.props;
    return React.cloneElement(childElement, {
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
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={1.55}
      rightThreshold={ACTION_WIDTH}
      overshootRight={false}
      renderRightActions={(progress, drag) => (
        <View
          style={{
            width: ACTION_WIDTH * 2,
            flexDirection: 'row',
            alignItems: 'stretch',
            marginLeft: 10,
            borderRadius: 22,
            overflow: 'hidden',
          }}>
          <RightAction
            label="编辑"
            backgroundColor={colors.secondary}
            progress={progress}
            drag={drag}
            onPress={() => {
              closeRow();
              onEdit();
            }}
          />
          <RightAction
            label="删除"
            backgroundColor={colors.danger}
            progress={progress}
            drag={drag}
            onPress={() => {
              closeRow();
              onDelete();
            }}
          />
        </View>
      )}
      onSwipeableWillOpen={direction => {
        if (direction === 'right') {
          onRowOpen?.(rowKey);
        }
      }}
      onSwipeableClose={direction => {
        if (direction === 'right') {
          onRowClose?.(rowKey);
        }
      }}>
      {contentNode}
    </ReanimatedSwipeable>
  );
}
