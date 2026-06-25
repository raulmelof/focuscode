import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, useWindowDimensions, Animated, Easing } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

interface PomodoroCircleProps {
  progress?: number;
  showImage?: boolean; 
  isRunning?: boolean;
  roboStage?: number;
}

export const PomodoroCircle = ({ progress = 0, showImage = true, isRunning = false, roboStage = 1 }: PomodoroCircleProps) => {
  const { width } = useWindowDimensions();
  const circleSize = width * 0.7; 
  const { theme, colors } = useAppTheme();

  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const roboStageImages: Record<number, any> = {
    1: require('../../assets/themes/robo/Cubo robo.png'),
    2: require('../../assets/themes/robo/Robo parte 2.png'),
    3: require('../../assets/themes/robo/Robo parte 3.png'),
    4: require('../../assets/themes/robo/Robo feito.png'),
  };

  const cafeStageImages: Record<number, any> = {
    1: require('../../assets/themes/cafe/Café estágio um.png'),
    2: require('../../assets/themes/cafe/Café segundo estágio.png'),
    3: require('../../assets/themes/cafe/Café terceiro estágio.png'),
    4: require('../../assets/themes/cafe/Café último estágio.png'),
  };

  useEffect(() => {
    Animated.timing(spinValue, {
      toValue: progress,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress, spinValue]);

  useEffect(() => {
    if (isRunning) {
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.03,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnim.start();
      return () => pulseAnim.stop();
    } else {
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRunning, scaleValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { width: circleSize, height: circleSize, transform: [{ scale: scaleValue }] }]}>
      <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, borderColor: colors.accent }]}>
        
        {showImage && (
          <Image
            source={theme === 'robo' ? (roboStageImages[roboStage] || roboStageImages[1]) : (cafeStageImages[roboStage] || cafeStageImages[1])}
            style={[
              styles.image, 
              theme === 'robo' && { width: '100%', height: '100%', transform: [{ scale: 1.5 }] }
            ]}
          />
        )}

      </View>

      <Animated.View style={[styles.spinnerContainer, { width: circleSize, height: circleSize, transform: [{ rotate: spin }] }]}>
        <View style={[styles.spinnerBall, { backgroundColor: colors.accent }]} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderWidth: 6,
    borderColor: '#2A1128',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  image: {
    width: '60%',
    height: '60%',
    resizeMode: 'contain',
  },
  spinnerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  spinnerBall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2A1128',
    top: -7,
  }
});