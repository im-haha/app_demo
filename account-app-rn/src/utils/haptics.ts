import {type HapticOptions, trigger} from 'react-native-haptic-feedback';

const TAB_HAPTIC_OPTIONS: HapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};
const SEGMENTED_HAPTIC_OPTIONS: HapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export function tabSwitchHaptic(): void {
  trigger('impactMedium', TAB_HAPTIC_OPTIONS);
}

export function segmentedSwitchHaptic(): void {
  trigger('impactLight', SEGMENTED_HAPTIC_OPTIONS);
}
