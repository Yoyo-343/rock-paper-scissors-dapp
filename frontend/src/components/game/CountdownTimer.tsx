import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  startTime: number; // timestamp when timer started
  timeoutSeconds: number; // total timeout in seconds
  onTimeout?: () => void; // callback when timer reaches zero
  label?: string; // optional label for the timer
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  startTime, 
  timeoutSeconds, 
  onTimeout,
  label = "Time remaining" 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(timeoutSeconds);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, timeoutSeconds - elapsed);
      return remaining;
    };

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining === 0 && onTimeout) {
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, timeoutSeconds, onTimeout]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    const percentage = (timeLeft / timeoutSeconds) * 100;
    if (percentage > 50) return 'text-cyber-green';
    if (percentage > 25) return 'text-cyber-amber';
    return 'text-cyber-red';
  };

  const getProgressWidth = (): number => {
    return Math.max(0, (timeLeft / timeoutSeconds) * 100);
  };

  return (
    <div className="cyber-card p-4 bg-black/40 border border-cyber-blue/30">
      <div className="text-center">
        <p className="text-cyber-blue text-sm mb-2">{label}</p>
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeLeft > timeoutSeconds * 0.5 
                ? 'bg-cyber-green' 
                : timeLeft > timeoutSeconds * 0.25 
                ? 'bg-cyber-amber' 
                : 'bg-cyber-red'
            }`}
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
        
        {timeLeft === 0 && (
          <div className="mt-2 text-cyber-red text-sm animate-pulse">
            Time's up!
          </div>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer; 