import { useState } from 'react';

export const useHomeViewModel = () => {

  const [timeLeft, setTimeLeft] = useState('60:00');

  const [isActive, setIsActive] = useState(false);

  const handleStartStop = () => {
    setIsActive(!isActive);
    console.log(isActive ? "Timer Pausado" : "Timer Iniciado");
  };

  const openMenu = () => {
    console.log("Abrir Sidebar com as listas");
  };

  return {
    timeLeft,
    isActive,
    handleStartStop,
    openMenu,
  };
};
