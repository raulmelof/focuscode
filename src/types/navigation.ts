import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  BreakScreen: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;
