import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { styles } from './styles'; 
import { useBreakViewModel } from './useBreakViewModel';

export const BreakScreen = () => {
  const { formattedTime, progress, handleSkipBreak, isLoading } = useBreakViewModel();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6D5A7' }}>
        <ActivityIndicator size="large" color="#2A1128" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      
      <Image 
        source={require('../../../assets/cenario_base.png')} 
        style={styles.pixelBackground} 
      />

      <SafeAreaView style={styles.uiLayer}>
        <View style={styles.header}>
          <Text style={styles.title}>Hora da Pausa!</Text>
          <Text style={styles.subtitle}>Levante-se e caminhe um pouco...</Text>
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