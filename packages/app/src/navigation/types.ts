import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  SiteDetail: { id: string };
  WindByHeight: { id: string };
  Settings: undefined;
};

export type ScreenProps<Name extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Name
>;
