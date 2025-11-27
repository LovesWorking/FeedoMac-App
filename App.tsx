// App.tsx (root)
import React from 'react';
import { ThemeProvider, useTheme } from '@src/theme/ThemeProvider';
import RootNavigator from '@src/navigation/RootNavigator';
import { NetworkStatus } from '@src/components/NetworkStatus';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import WebsocketProvider from '@src/components/WebsocketProvider';
import { Platform, StatusBar, View } from 'react-native';

function AppContent() {
  const { mode } = useTheme();
  console.log('themeMode', mode);
  return (
    <View style={{ flex: 1 }}>

      <RootNavigator />
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor={'transparent'}
          barStyle={mode == 'light' ? 'dark-content' : 'light-content'}
        />
      )}
      <NetworkStatus />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider>
          <WebsocketProvider>
            <AppContent />
          </WebsocketProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
