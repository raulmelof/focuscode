import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStack } from './src/presentation/routes/AppStack';

export default function App() {
  return (

    <SafeAreaProvider>
      <NavigationContainer>
        {/* Toda a lógica de Stack.Navigator e Stack.Screen está guardada aqui dentro */}
        <AppStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
