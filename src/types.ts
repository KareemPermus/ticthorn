export interface Timer {
  id: string;
  name: string;
  duration: number; // seconds
  icon: string;
  category: string;
  type: 'single' | 'interval';
  createdAt: string;
}

export interface TimerSession {
  id: string;
  timerId: string;
  timerName: string;
  duration: number;
  completedAt: string;
}

export interface QuickStartItem {
  id: string;
  name: string;
  duration: number; // seconds
  icon: string;
}

export interface ActiveTimer {
  timerId: string;
  name: string;
  totalDuration: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: string;
}