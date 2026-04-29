import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { styles } from './styles';

export const HomeScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
      <Text style={styles.subtext}>A pilha de navegação começa aqui.</Text>

      <View style={{ marginTop: 20 }}>
        <Button
          title="Ir para Detalhes"
          onPress={() => navigation.navigate('Details')}
          color="#2A1128"
        />
      </View>
    </View>
  );
};
