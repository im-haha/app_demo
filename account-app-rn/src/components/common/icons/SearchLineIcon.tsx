import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export default function SearchLineIcon({
  size = 18,
  color = '#6F7A76',
  strokeWidth = 1.8,
}: Props): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="10.8"
        cy="10.8"
        r="5.4"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M14.8 14.8L19 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
