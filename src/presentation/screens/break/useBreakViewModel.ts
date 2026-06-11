import { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { useSettings } from '../../../hooks/useSettings';
import { usePomodoroCycle, setGlobalAutoStartFocus } from '../../../hooks/usePomodoroCycle';

export const useBreakViewModel = () => {
  const navigation = useNavigation();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { isLongBreak, isLoading: isCycleLoading } = usePomodoroCycle();

  const isLoading = isSettingsLoading || isCycleLoading;
  const BREAK_TIME = isLongBreak ? settings.longBreakMinutes * 60 : settings.shortBreakMinutes * 60; 

  const handleBreakEnd = useCallback(() => {
    if (!isLongBreak) {
      setGlobalAutoStartFocus(true);
    }
    navigation.goBack(); 
  }, [navigation, isLongBreak]);

  const { timeLeft, start, stop } = usePomodoro({
    initialTimeInSeconds: BREAK_TIME,
    onFocusEnd: handleBreakEnd,
  });

  useEffect(() => {
    if (!isLoading) {
      start();
    }
    
   
    return () => stop(); 
  }, [start, stop, isLoading]);

 
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
    isLoading,
  };
};