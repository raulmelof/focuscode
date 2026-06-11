import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

interface TimerDisplayProps {
  time: string;
}

export const TimerDisplay = ({ time }: TimerDisplayProps) => {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.text, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
      {time}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#2A1128',
    letterSpacing: 2,
  }
});
