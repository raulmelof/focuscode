import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ImageBackground } from 'react-native';
import { useHomeViewModel } from './useHomeViewModel';
import { TimerDisplay } from '../../components/TimerDisplay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PomodoroCircle } from '../../components/PomodoroCircle';

export const HomeScreen = () => {
  const { timeLeft, isActive, handleStartStop, openMenu } = useHomeViewModel();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Imagem de fundo */}
      <ImageBackground
        source={require('../../../assets/images/fundo_bonito.jpeg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>

          <View style={styles.header}>
            <TouchableOpacity onPress={openMenu}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.title}>FocusCode</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            <PomodoroCircle />
            <TimerDisplay time={timeLeft} />
            <PrimaryButton
              title={isActive ? "Pausar" : "Iniciar"}
              onPress={handleStartStop}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerArrow}>〈</Text>
            <Text style={styles.footerArrow}>〉</Text>
          </View>

        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6D5A7',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,

     backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  menuIcon: {
    fontSize: 28,
    color: '#2A1128',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A1128',
    fontFamily: 'sans-serif-medium',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 17, 40, 0.2)',
    borderStyle: 'dashed',
    paddingTop: 20,
  },
  footerArrow: {
    fontSize: 24,
    color: '#2A1128',
  }
});
