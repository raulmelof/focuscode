import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStack } from './src/presentation/routes/AppStack';
import { initDB } from './src/data/database/database';

export default function App() {
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    initDB()
      .then(() => setIsDBReady(true))
      .catch(console.error);
  }, []);

  if (!isDBReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* Toda a lógica de Stack.Navigator e Stack.Screen está guardada aqui dentro */}
        <AppStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
