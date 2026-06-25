import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { styles } from './styles'; 
import { useBreakViewModel } from './useBreakViewModel';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { usePomodoroCycle } from '../../../hooks/usePomodoroCycle';
import { useSettings } from '../../../hooks/useSettings';

export const BreakScreen = () => {
  const { formattedTime, progress, handleSkipBreak, isLoading } = useBreakViewModel();
  const { theme } = useAppTheme();
  const { cycleCount } = usePomodoroCycle();
  const { settings } = useSettings();

  const totalCycles = settings.cyclesBeforeLongBreak || 4;
  const finishedCycle = cycleCount === 0 ? 1 : ((cycleCount - 1) % totalCycles) + 1;
  const stageIndex = Math.min(4, Math.floor(((finishedCycle - 1) / totalCycles) * 4) + 1);

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
    cafe: require('../../../assets/themes/cafe/cabana animada.gif'),
    robo: require('../../../assets/themes/robo/Fundo robo descanso animado.gif'), 
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
          <PomodoroCircle progress={progress} showImage={true} roboStage={stageIndex} />
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
