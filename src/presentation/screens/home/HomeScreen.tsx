import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

export const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World!</Text>
      <Text style={styles.subtext}>Arquitetura inicializada com sucesso.</Text>
    </View>
  );
};
