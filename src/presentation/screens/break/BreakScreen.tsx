import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { styles } from './styles'; 
import { useBreakViewModel } from './useBreakViewModel';
import { useAppTheme } from '../../../contexts/ThemeContext';

export const BreakScreen = () => {
  const { formattedTime, progress, handleSkipBreak } = useBreakViewModel();
  const { theme } = useAppTheme();

  // Mapeamento de imagens para os temas (atualmente ambas usam cenario_base.png como placeholder/fallback)
  const themeBackgrounds = {
    cafe: require('../../../assets/cenario_base.png'),
    robo: require('../../../assets/cenario_base.png'), // Será substituído na T23
  };

  const themeInfo = {
    cafe: {
      title: 'Hora do Café!',
      subtitle: 'Levante-se e tome uma xícara de café...',
      overlayColor: 'rgba(139, 69, 19, 0.08)', // Tom quente café suave
    },
    robo: {
      title: 'Modo Robô!',
      subtitle: 'Recarregando baterias e atualizando circuitos...',
      overlayColor: 'rgba(0, 191, 255, 0.15)', // Tom azulado tecnológico
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

      {/* Overlay translúcido condicional para diferenciar visualmente os temas enquanto os assets finais não existem */}
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