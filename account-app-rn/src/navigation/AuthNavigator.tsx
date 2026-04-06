import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const getLoginScreen = () => require('@/screens/auth/LoginScreen').default;
const getRegisterScreen = () => require('@/screens/auth/RegisterScreen').default;

export default function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" getComponent={getLoginScreen} />
      <Stack.Screen name="Register" getComponent={getRegisterScreen} />
    </Stack.Navigator>
  );
}
