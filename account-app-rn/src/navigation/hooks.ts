import {useNavigation, CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MainTabParamList, RootStackParamList} from './types';

export type MainTabScreenNavigationProp<T extends keyof MainTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function useMainTabNavigation<T extends keyof MainTabParamList>(): MainTabScreenNavigationProp<T> {
  return useNavigation<MainTabScreenNavigationProp<T>>();
}

