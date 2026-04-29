import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Details: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;
