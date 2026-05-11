import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStack } from './src/presentation/routes/AppStack';
import { initDB } from './src/data/database/database';

export default function App() {
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* Toda a lógica de Stack.Navigator e Stack.Screen está guardada aqui dentro */}
        <AppStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
