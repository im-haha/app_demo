import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

export type CategoryGlyphProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function FoodIcon({
  size = 22,
  color = '#E07B56',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.8 7.2C8.8 6.2 9.4 5.4 10.2 4.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 6.4C12 5.3 12.5 4.6 13.3 4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.2 7.2C15.2 6.2 15.8 5.4 16.6 4.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M6.2 11.2H17.8C17.6 14.8 15.3 17.1 12 17.1C8.7 17.1 6.4 14.8 6.2 11.2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M4.8 11.2H19.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M8.5 18.9H15.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TransportIcon({
  size = 22,
  color = '#4C78C9',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="6"
        y="5.4"
        width="12"
        height="10.8"
        rx="3"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M8.3 9.2H15.7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M7.5 16.2L6.8 18.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M16.5 16.2L17.2 18.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="9" cy="14.1" r="0.9" fill={color} />
      <Circle cx="15" cy="14.1" r="0.9" fill={color} />
    </Svg>
  );
}

export function CommunicationIcon({
  size = 22,
  color = '#4A6FA5',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="7.4"
        y="5.2"
        width="9.2"
        height="13.6"
        rx="2.4"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M10.2 7.8H13.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16.1" r="0.85" fill={color} />
    </Svg>
  );
}

export function MedicalIcon({
  size = 22,
  color = '#C44536',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.2 9.1H16.8L16.1 17.2C15.99 18.4 14.98 19.3 13.77 19.3H10.23C9.02 19.3 8.01 18.4 7.9 17.2L7.2 9.1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M9.4 9.1V7.9C9.4 6.63 10.43 5.6 11.7 5.6H12.3C13.57 5.6 14.6 6.63 14.6 7.9V9.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 11.4V15.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M10.1 13.3H13.9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StudyIcon({
  size = 22,
  color = '#3C8D5A',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.6 7.4C8 6.4 9.6 6 11.2 6V18C9.6 18 8 18.4 6.6 19.4V7.4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M17.4 7.4C16 6.4 14.4 6 12.8 6V18C14.4 18 16 18.4 17.4 19.4V7.4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M12 7.1V17.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TravelIcon({
  size = 22,
  color = '#1D7874',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.8 11.2L13.9 12.5L11.4 6.4C11.24 6 10.84 5.76 10.42 5.82C10 5.89 9.67 6.25 9.64 6.67L9.34 11.3L6.2 12.1L4.7 10.9L3.9 11.7L5.2 13.4L4.4 15.8L5.5 16.1L6.7 13.9L9.28 13.2L11 17.8C11.16 18.22 11.57 18.48 12.01 18.42C12.45 18.36 12.79 17.99 12.81 17.55L13 12.7L18.3 11.3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BonusIcon({
  size = 22,
  color = '#D8A92E',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.2 8.4C8.2 6.6 9.8 5.4 12 5.4C14.2 5.4 15.8 6.6 15.8 8.4V9.2H8.2V8.4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M7.2 9.2H16.8V16.8C16.8 18.3 15.6 19.4 14.1 19.4H9.9C8.4 19.4 7.2 18.3 7.2 16.8V9.2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M12 11.4V15.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M9.8 13.6H14.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="16.9" cy="7" r="1" fill={color} />
    </Svg>
  );
}

export function HousingIcon({
  size = 22,
  color = '#9A7B67',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.6 10.1L11.1 6.4C11.62 5.97 12.38 5.97 12.9 6.4L17.4 10.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.4 9.8V16.8C7.4 18 8.4 19 9.6 19H14.4C15.6 19 16.6 18 16.6 16.8V9.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Rect
        x="10.6"
        y="13.2"
        width="2.8"
        height="5.8"
        rx="1"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function SalaryIcon({
  size = 22,
  color = '#2C9B74',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5.8"
        y="7"
        width="12.8"
        height="10.4"
        rx="2.8"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M8.2 7V6.5C8.2 5.84 8.74 5.3 9.4 5.3H16.1C16.76 5.3 17.3 5.84 17.3 6.5V8.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="14.6" cy="12.2" r="1.1" fill={color} />
      <Path
        d="M5.8 10.2H18.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function EntertainmentIcon({
  size = 22,
  color = '#7A5BC0',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.2 8.2C7.2 7.1 8.1 6.2 9.2 6.2H14.8C15.9 6.2 16.8 7.1 16.8 8.2V9.3C15.95 9.3 15.3 9.95 15.3 10.8C15.3 11.65 15.95 12.3 16.8 12.3V13.8C16.8 14.9 15.9 15.8 14.8 15.8H9.2C8.1 15.8 7.2 14.9 7.2 13.8V12.3C8.05 12.3 8.7 11.65 8.7 10.8C8.7 9.95 8.05 9.3 7.2 9.3V8.2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx="11" cy="11" r="0.8" fill={color} />
      <Circle cx="13.5" cy="11" r="0.8" fill={color} />
    </Svg>
  );
}

export function ShoppingIcon({
  size = 22,
  color = '#D64C82',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.6 9V8.3C8.6 6.42 10.12 4.9 12 4.9C13.88 4.9 15.4 6.42 15.4 8.3V9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M7.3 9H16.7L15.9 17.1C15.77 18.38 14.69 19.35 13.4 19.35H10.6C9.31 19.35 8.23 18.38 8.1 17.1L7.3 9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M10.2 12.1H13.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function OtherIcon({
  size = 22,
  color = '#7B7B7B',
  strokeWidth = 1.8,
}: CategoryGlyphProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="6.2"
        y="6.2"
        width="11.6"
        height="11.6"
        rx="3"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Circle cx="12" cy="12" r="1.1" fill={color} />
    </Svg>
  );
}
