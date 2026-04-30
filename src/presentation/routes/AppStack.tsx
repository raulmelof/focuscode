import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BreakScreen } from '../screens/break/BreakScreen'; 

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BreakScreen"
        component={BreakScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};