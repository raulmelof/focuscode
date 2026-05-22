import { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { useSettings } from '../../../hooks/useSettings';

export const useBreakViewModel = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const BREAK_TIME = settings.shortBreakMinutes * 60; 

  const handleBreakEnd = useCallback(() => {
    navigation.goBack(); 
  }, [navigation]);

  const { timeLeft, start, stop } = usePomodoro({
    initialTimeInSeconds: BREAK_TIME,
    onFocusEnd: handleBreakEnd,
  });

  useEffect(() => {
    start();
    
   
    return () => stop(); 
  }, [start, stop]);

 
  const handleSkipBreak = () => {
    stop();
    navigation.goBack();
  };

  const formattedTime = formatTime(timeLeft);
  const progress = Math.max(0, Math.min(1, 1 - (timeLeft / BREAK_TIME)));

  return {
    formattedTime,
    progress,
    handleSkipBreak,
  };
};