import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, useWindowDimensions, Animated, Easing } from 'react-native';

interface PomodoroCircleProps {
  progress?: number;
}

export const PomodoroCircle = ({ progress = 0 }: PomodoroCircleProps) => {
  const { width } = useWindowDimensions();
  const circleSize = width * 0.7; 

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
      {/* Círculo estático com a imagem */}
      <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
        <Image
          source={require('../../assets/cafe_vazio.png')}
          style={styles.image}
        />
      </View>

      {/* Bolinha animada rodando na borda */}
      <Animated.View style={[styles.spinnerContainer, { width: circleSize, height: circleSize, transform: [{ rotate: spin }] }]}>
        <View style={styles.spinnerBall} />
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
