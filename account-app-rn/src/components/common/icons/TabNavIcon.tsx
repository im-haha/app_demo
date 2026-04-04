import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

export type TabIconKind = 'home' | 'bills' | 'stats' | 'mine';

interface TabNavIconProps {
  kind: TabIconKind;
  color: string;
  size?: number;
  focused?: boolean;
}

export default function TabNavIcon({
  kind,
  color,
  size = 23,
  focused = false,
}: TabNavIconProps): React.JSX.Element {
  const strokeWidth = focused ? 2.05 : 1.85;
  const fillOpacity = focused ? 0.14 : 0;
  const fillColor = color;

  if (kind === 'home') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3.5 10.7L12 4.2L20.5 10.7"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6.8 9.9V19.1H17.2V9.9"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fillColor}
          fillOpacity={fillOpacity}
        />
      </Svg>
    );
  }

  if (kind === 'bills') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x={5.2}
          y={3.8}
          width={13.6}
          height={16.4}
          rx={2.8}
          stroke={color}
          strokeWidth={strokeWidth}
          fill={fillColor}
          fillOpacity={fillOpacity}
        />
        <Path d="M8.2 9.1H15.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Path d="M8.2 12.4H15.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Path d="M8.2 15.7H13.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </Svg>
    );
  }

  if (kind === 'stats') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x={4.2}
          y={4.2}
          width={15.6}
          height={15.6}
          rx={3}
          stroke={color}
          strokeWidth={strokeWidth}
          fill={fillColor}
          fillOpacity={fillOpacity}
        />
        <Rect x={7.3} y={12.1} width={2.2} height={4.8} rx={1} fill={color} />
        <Rect x={10.9} y={9.7} width={2.2} height={7.2} rx={1} fill={color} />
        <Rect x={14.5} y={7.3} width={2.2} height={9.6} rx={1} fill={color} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.2} r={3.2} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5.4 18.1C6.3 15.1 8.9 13.6 12 13.6C15.1 13.6 17.7 15.1 18.6 18.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.8 19.2H20.2"
        stroke={color}
        strokeWidth={focused ? 1.6 : 1.4}
        strokeOpacity={focused ? 0.65 : 0.28}
        strokeLinecap="round"
      />
    </Svg>
  );
}
