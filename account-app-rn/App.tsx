import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as PaperProvider} from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import {appTheme} from './src/theme';
import {useAppStore} from './src/store/appStore';

function Bootstrap(): React.JSX.Element {
  const initialize = useAppStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <RootNavigator />;
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <Bootstrap />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
