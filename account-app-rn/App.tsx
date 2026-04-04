import 'react-native-gesture-handler';
import React, {useEffect, useMemo} from 'react';
import {LogBox, StyleSheet, Text, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Button, Provider as PaperProvider} from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import {buildPaperTheme, useResolvedThemeMode} from './src/theme';
import {useAppStore} from './src/store/appStore';
import {Sentry, SENTRY_RUNTIME_ENABLED} from './src/lib/sentry';

LogBox.ignoreLogs([
  'Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

function Bootstrap(): React.JSX.Element {
  const initialize = useAppStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <RootNavigator />;
}

function ErrorFallback({
  resetError,
}: {
  resetError: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorDescription}>
        The issue was recorded. Please retry.
      </Text>
      <Button mode="contained" onPress={resetError}>
        Retry
      </Button>
    </View>
  );
}

function App(): React.JSX.Element {
  const resolvedThemeMode = useResolvedThemeMode();
  const appTheme = useMemo(
    () => buildPaperTheme(resolvedThemeMode),
    [resolvedThemeMode],
  );

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <PaperProvider theme={appTheme}>
          {SENTRY_RUNTIME_ENABLED ? (
            <Sentry.ErrorBoundary
              beforeCapture={scope => {
                scope.setTag('boundary', 'AppErrorBoundary');
              }}
              fallback={({resetError}) => <ErrorFallback resetError={resetError} />}
            >
              <Bootstrap />
            </Sentry.ErrorBoundary>
          ) : (
            <Bootstrap />
          )}
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default SENTRY_RUNTIME_ENABLED ? Sentry.wrap(App) : App;

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
});
