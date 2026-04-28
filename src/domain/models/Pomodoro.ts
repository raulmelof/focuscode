export interface PomodoroState {
  minutes: number;
  seconds: number;
  isActive: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak';
}
