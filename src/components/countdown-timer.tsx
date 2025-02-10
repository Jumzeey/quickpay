import { useEffect, useState } from "react";

interface CountdownTimerProps {
  initialSeconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialSeconds }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds > 0) {
      const timerId = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [seconds]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center mt-5">
      <p id="countdown" className="text-sm">
        You can resend a new code in <span className="text-primary text-sm">{formatTime(seconds)} secs</span>
      </p>
    </div>
  );
};

export default CountdownTimer;
