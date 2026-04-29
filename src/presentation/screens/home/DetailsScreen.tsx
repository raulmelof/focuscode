import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const DetailsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Details Screen 🔍</Text>

      <View style={{ marginTop: 20 }}>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          color="#2A1128"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A1128',
  }
});
