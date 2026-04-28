import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';

export const PomodoroCircle = () => {
  const { width } = useWindowDimensions();

  const size = width * 0.6;

  const innerImageSize = size * 0.45;

  return (
    <View style={[
      styles.circleContainer,

      { width: size, height: size, borderRadius: size / 2 }
    ]}>
      <Image
        source={require('../../assets/images/cafe_vazio.png')}
        style={[
          styles.innerImage,
          { width: innerImageSize, height: innerImageSize }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    borderWidth: 2,
    borderColor: '#2A1128',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',

  },
  innerImage: {
    borderRadius: 10,
  },
});
