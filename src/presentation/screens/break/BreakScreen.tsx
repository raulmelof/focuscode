import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { styles } from './styles'; 
import { useBreakViewModel } from './useBreakViewModel';
import { useAppTheme } from '../../../contexts/ThemeContext';

export const BreakScreen = () => {
  const { formattedTime, progress, handleSkipBreak, isLoading } = useBreakViewModel();
  const { theme } = useAppTheme();

  // Garante que o loading novo da T21 funcione
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6D5A7' }}>
        <ActivityIndicator size="large" color="#2A1128" />
      </View>
    );
  }

  // Mapeamento de imagens para os temas da main
  const themeBackgrounds = {
    cafe: require('../../../assets/cenario_base.png'),
    robo: require('../../../assets/cenario_base.png'), 
  };

  const themeInfo = {
    cafe: {
      title: 'Hora do Café!',
      subtitle: 'Levante-se e tome uma xícara de café...',
      overlayColor: 'rgba(139, 69, 19, 0.08)', 
    },
    robo: {
      title: 'Modo Robô!',
      subtitle: 'Recarregando baterias e atualizando circuitos...',
      overlayColor: 'rgba(0, 191, 255, 0.15)', 
    },
  };

  const currentThemeInfo = themeInfo[theme] || themeInfo.cafe;

  return (
    <View style={styles.mainContainer}>
      
      <Image 
        source={themeBackgrounds[theme] || themeBackgrounds.cafe} 
        style={styles.pixelBackground} 
        testID="break-theme-background"
      />

      {/* Overlay translúcido da main */}
      <View 
        style={[
          StyleSheet.absoluteFillObject, 
          { backgroundColor: currentThemeInfo.overlayColor }
        ]} 
        testID="break-theme-overlay"
      />

      <SafeAreaView style={styles.uiLayer}>
        <View style={styles.header}>
          <Text style={styles.title} testID="break-theme-title">
            {currentThemeInfo.title}
          </Text>
          <Text style={styles.subtitle} testID="break-theme-subtitle">
            {currentThemeInfo.subtitle}
          </Text>
        </View>

        <View style={styles.timerWrapper}>
          <PomodoroCircle progress={progress} showImage={false} />
          <View style={styles.timerContainer}>
            <TimerDisplay time={formattedTime} />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleSkipBreak}>
            <Text style={styles.buttonText}>Desligar Alarme</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
    </View>
  );
};
