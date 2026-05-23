import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export const PrimaryButton = ({ title, onPress, backgroundColor, textColor }: PrimaryButtonProps) => {
  return (
    <TouchableOpacity 
      style={[styles.button, backgroundColor ? { backgroundColor } : {}]} 
      activeOpacity={0.8} 
      onPress={onPress}
    >
      <Text style={[styles.text, textColor ? { color: textColor } : {}]}>{title}</Text>
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
