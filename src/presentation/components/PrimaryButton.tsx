import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
}

export const PrimaryButton = ({ title, onPress }: PrimaryButtonProps) => {
  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2A1128',
    paddingVertical: 18,
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
