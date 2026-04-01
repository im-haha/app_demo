import React, {useMemo, useRef, useState} from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from 'react-native';

type DraggableFabProps = {
  onPress: () => void;
  bottomOffset: number;
  rightOffset?: number;
  size?: number;
  backgroundColor?: string;
  children: React.ReactNode;
};

const EDGE_GAP = 12;
const TAP_MOVE_THRESHOLD = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function DraggableFab({
  onPress,
  bottomOffset,
  rightOffset = 20,
  size = 58,
  backgroundColor = '#DE7D58',
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartPosRef.current = currentPosRef.current;
          isTapRef.current = true;
        },
        onPanResponderMove: (_event, gestureState) => {
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
          event: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          if (
            isTapRef.current &&
            Math.abs(gestureState.dx) <= TAP_MOVE_THRESHOLD &&
            Math.abs(gestureState.dy) <= TAP_MOVE_THRESHOLD
          ) {
            onPress();
          }

          event.persist();
        },
        onPanResponderTerminate: () => {
          isTapRef.current = false;
        },
      }),
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, onPress, pan],
  );

  function handleContainerLayout(event: LayoutChangeEvent): void {
    const {width, height} = event.nativeEvent.layout;
    setContainerSize({width, height});

    const defaultX = Math.max(width - size - rightOffset, EDGE_GAP);
    const defaultY = Math.max(height - size - bottomOffset, EDGE_GAP);

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
      x: clamp(
        currentPosRef.current.x,
        EDGE_GAP,
        Math.max(width - size - EDGE_GAP, EDGE_GAP),
      ),
      y: clamp(
        currentPosRef.current.y,
        EDGE_GAP,
        Math.max(height - size - EDGE_GAP, EDGE_GAP),
      ),
    };
    currentPosRef.current = clamped;
    pan.setValue(clamped);
  }

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={handleContainerLayout}>
      {ready ? (
        <Animated.View
          {...panResponder.panHandlers}
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
          {children}
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
});
