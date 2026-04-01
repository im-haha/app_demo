import {type HapticOptions, trigger} from 'react-native-haptic-feedback';

const HAPTIC_OPTIONS: HapticOptions = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export function tabSwitchHaptic(): void {
  trigger('selection', HAPTIC_OPTIONS);
}

export function segmentedSwitchHaptic(): void {
  trigger('impactLight', HAPTIC_OPTIONS);
}
