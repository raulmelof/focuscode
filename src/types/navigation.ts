import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Details: undefined;
  BreakScreen: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;
