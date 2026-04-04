import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type DraggableFabProps = {
  onPress: () => void;
  bottomOffset: number;
  rightOffset?: number;
  size?: number;
  backgroundColor?: string;
  draggable?: boolean;
  accessibilityLabel?: string;
  children: React.ReactNode;
};

const EDGE_GAP = 12;
const TAP_MOVE_THRESHOLD = 6;
const SNAP_SPRING_CONFIG = {
  damping: 18,
  stiffness: 280,
  mass: 0.8,
  useNativeDriver: false,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function DraggableFab({
  onPress,
  bottomOffset,
  rightOffset = 20,
  size = 58,
  backgroundColor = '#DE7D58',
  draggable = true,
  accessibilityLabel = '新增账单',
  children,
}: DraggableFabProps): React.JSX.Element {
  const pan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const currentPosRef = useRef({x: 0, y: 0});
  const dragStartPosRef = useRef({x: 0, y: 0});
  const isTapRef = useRef(true);
  const [containerSize, setContainerSize] = useState({width: 0, height: 0});
  const [ready, setReady] = useState(false);

  const bounds = useMemo(() => {
    const maxX = Math.max(containerSize.width - size - EDGE_GAP, EDGE_GAP);
    const maxY = Math.max(containerSize.height - size - EDGE_GAP, EDGE_GAP);

    return {
      minX: EDGE_GAP,
      maxX,
      minY: EDGE_GAP,
      maxY,
    };
  }, [containerSize.height, containerSize.width, size]);

  const animateTo = useCallback(
    (position: {x: number; y: number}): void => {
      currentPosRef.current = position;
      Animated.spring(pan, {
        toValue: position,
        ...SNAP_SPRING_CONFIG,
      }).start();
    },
    [pan],
  );

  const snapToEdge = useCallback((): void => {
    const targetX =
      currentPosRef.current.x + size / 2 <= containerSize.width / 2
        ? bounds.minX
        : bounds.maxX;
    const targetY = clamp(currentPosRef.current.y, bounds.minY, bounds.maxY);
    animateTo({x: targetX, y: targetY});
  }, [
    animateTo,
    bounds.maxX,
    bounds.maxY,
    bounds.minX,
    bounds.minY,
    containerSize.width,
    size,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => draggable,
        onMoveShouldSetPanResponder: () => draggable,
        onPanResponderGrant: () => {
          if (!draggable) {
            return;
          }
          dragStartPosRef.current = currentPosRef.current;
          isTapRef.current = true;
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!draggable) {
            return;
          }
          if (
            Math.abs(gestureState.dx) > TAP_MOVE_THRESHOLD ||
            Math.abs(gestureState.dy) > TAP_MOVE_THRESHOLD
          ) {
            isTapRef.current = false;
          }

          const nextX = clamp(
            dragStartPosRef.current.x + gestureState.dx,
            bounds.minX,
            bounds.maxX,
          );
          const nextY = clamp(
            dragStartPosRef.current.y + gestureState.dy,
            bounds.minY,
            bounds.maxY,
          );

          currentPosRef.current = {x: nextX, y: nextY};
          pan.setValue(currentPosRef.current);
        },
        onPanResponderRelease: (
          _event: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          if (!draggable) {
            return;
          }
          if (
            isTapRef.current &&
            Math.abs(gestureState.dx) <= TAP_MOVE_THRESHOLD &&
            Math.abs(gestureState.dy) <= TAP_MOVE_THRESHOLD
          ) {
            onPress();
          }
          snapToEdge();
        },
        onPanResponderTerminate: () => {
          if (!draggable) {
            return;
          }
          isTapRef.current = false;
          snapToEdge();
        },
      }),
    [
      bounds.maxX,
      bounds.maxY,
      bounds.minX,
      bounds.minY,
      onPress,
      pan,
      snapToEdge,
      draggable,
    ],
  );

  function handleContainerLayout(event: LayoutChangeEvent): void {
    const {width, height} = event.nativeEvent.layout;
    setContainerSize({width, height});

    const minX = EDGE_GAP;
    const maxX = Math.max(width - size - EDGE_GAP, EDGE_GAP);
    const minY = EDGE_GAP;
    const maxY = Math.max(height - size - EDGE_GAP, EDGE_GAP);

    const defaultX = clamp(width - size - rightOffset, minX, maxX);
    const defaultY = clamp(height - size - bottomOffset, minY, maxY);

    if (!ready) {
      currentPosRef.current = {
        x: defaultX,
        y: defaultY,
      };
      pan.setValue(currentPosRef.current);
      setReady(true);
      return;
    }

    const clamped = {
      x: currentPosRef.current.x + size / 2 <= width / 2 ? minX : maxX,
      y: clamp(currentPosRef.current.y, minY, maxY),
    };
    animateTo(clamped);
  }

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={handleContainerLayout}>
      {ready ? (
        <Animated.View
          {...(draggable ? panResponder.panHandlers : undefined)}
          style={[
            styles.fab,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
              transform: [{translateX: pan.x}, {translateY: pan.y}],
            },
          ]}>
          {draggable ? (
            children
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              onPress={onPress}
              style={styles.fixedFabHitArea}>
              {children}
            </Pressable>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  fixedFabHitArea: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
