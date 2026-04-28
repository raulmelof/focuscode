import React from "react";
import { Text, StyleSheet } from "react-native";

interface TimerDisplayProps {
  time: string;
}

export const TimerDisplay = ({ time }: TimerDisplayProps) => {
  return <Text style={styles.timeText}>{time}</Text>;
};

const styles = StyleSheet.create({
  timeText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#2A1128", 
    marginVertical: 30,
  },
});
