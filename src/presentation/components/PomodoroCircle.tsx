import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';

export const PomodoroCircle = () => {
  const { width } = useWindowDimensions();
  const circleSize = width * 0.7; 

  return (
    <View style={[styles.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
      <Image
        source={require('../../assets/cafe_vazio.png')}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    borderWidth: 6,
    borderColor: '#2A1128',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '60%',
    height: '60%',
    resizeMode: 'contain',
  }
});
