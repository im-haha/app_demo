import React, {useEffect, useRef} from 'react';
import {InteractionManager, Platform, StyleSheet, TextInput, View} from 'react-native';

let hasWarmedSecureInput = false;

export default function SecureInputWarmup(): React.JSX.Element | null {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios' || hasWarmedSecureInput) {
      return;
    }

    const input = inputRef.current;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled || hasWarmedSecureInput) {
        return;
      }

      input?.focus();

      requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        input?.blur();
        hasWarmedSecureInput = true;
      });
    });

    return () => {
      cancelled = true;
      task.cancel();
      input?.blur();
    };
  }, []);

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <TextInput
        ref={inputRef}
        value=""
        onChangeText={() => {}}
        secureTextEntry
        showSoftInputOnFocus={false}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        importantForAutofill="no"
        contextMenuHidden
        caretHidden
        autoCorrect={false}
        spellCheck={false}
        style={styles.input}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -1000,
    top: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  input: {
    width: 1,
    height: 1,
    padding: 0,
    margin: 0,
  },
});
