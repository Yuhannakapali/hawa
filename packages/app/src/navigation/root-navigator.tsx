import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import { Platform, View } from 'react-native';
import { HomeScreen } from '../screens/home-screen';
import { LandingScreen } from '../screens/landing-screen';
import { OnboardingScreen } from '../screens/onboarding-screen';
import { SettingsScreen } from '../screens/settings-screen';
import { SiteDetailScreen } from '../screens/site-detail-screen';
import { WindHeightScreen } from '../screens/wind-height-screen';
import { useAppState } from '../state/app-state';
import { useTheme } from '../theme/theme-context';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const IS_WEB = Platform.OS === 'web';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Landing: '',
      Home: 'app',
      SiteDetail: 'app/sites/:id',
      WindByHeight: 'app/sites/:id/wind',
      Settings: 'app/settings',
    },
  },
};

function requireOnboarding<P extends object>(Screen: ComponentType<P>): ComponentType<P> {
  return function Gated(props: P) {
    const { settings } = useAppState();
    if (!settings.onboarded) {
      return <OnboardingScreen />;
    }
    return <Screen {...props} />;
  };
}

const GatedHome = requireOnboarding(HomeScreen);
const GatedDetail = requireOnboarding(SiteDetailScreen);
const GatedWind = requireOnboarding(WindHeightScreen);
const GatedSettings = requireOnboarding(SettingsScreen);

export function RootNavigator() {
  const { ready } = useAppState();
  const { c } = useTheme();
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  }
  let initialRouteName: keyof RootStackParamList = 'Home';
  if (IS_WEB) {
    initialRouteName = 'Landing';
  }
  return (
    <NavigationContainer linking={linking} documentTitle={{ formatter: () => 'Hawa' }}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        {IS_WEB && <Stack.Screen name="Landing" component={LandingScreen} />}
        <Stack.Screen name="Home" component={GatedHome} />
        <Stack.Screen name="SiteDetail" component={GatedDetail} />
        <Stack.Screen name="WindByHeight" component={GatedWind} />
        <Stack.Screen name="Settings" component={GatedSettings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
