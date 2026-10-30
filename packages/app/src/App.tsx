import { StatusBar, View } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/root-navigator';
import { AppStateProvider } from './state/app-state';
import { useTheme } from './theme/theme-context';

function ThemedShell() {
  const { scheme, c } = useTheme();
  let barStyle: 'light-content' | 'dark-content' = 'dark-content';
  if (scheme === 'dark') {
    barStyle = 'light-content';
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={barStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <RootNavigator />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppStateProvider>
        <ThemedShell />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
