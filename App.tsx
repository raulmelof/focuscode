import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStack } from './src/presentation/routes/AppStack';
import { initDB } from './src/data/database/database';
import './src/services/firebase'; // Inicializa Firebase
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useAppTheme } from './src/contexts/ThemeContext';

const ThemedNavigation = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useAppTheme();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
    },
  };
  return <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>;
};

export default function App() {
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    initDB()
      .then(async () => {
        setIsDBReady(true);
      })
      .catch(err => {
        console.error('Erro ao inicializar o banco de dados:', err);
        // Libera a interface mesmo se o banco falhar (ex: Web com erro de SecurityError do OPFS)
        setIsDBReady(true); 
      });
  }, []);

  if (!isDBReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121214' }}>
        <ActivityIndicator size="large" color="#04d361" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ThemedNavigation>
            {/* Toda a lógica de Stack.Navigator e Stack.Screen está guardada aqui dentro */}
            <AppStack />
          </ThemedNavigation>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
