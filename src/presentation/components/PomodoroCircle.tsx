import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, useWindowDimensions, Animated, Easing } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

interface PomodoroCircleProps {
  progress?: number;
  showImage?: boolean; 
}

export const PomodoroCircle = ({ progress = 0, showImage = true }: PomodoroCircleProps) => {
  const { width } = useWindowDimensions();
  const circleSize = width * 0.7; 
  const { theme, colors } = useAppTheme();

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(spinValue, {
      toValue: progress,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: circleSize, height: circleSize }]}>
      <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, borderColor: colors.accent }]}>
        
        {showImage && (
          <Image
            source={theme === 'robo' ? require('../../assets/themes/robo/Cubo robo.png') : require('../../assets/themes/cafe/cafe_vazio.png')}
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
    </View>
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