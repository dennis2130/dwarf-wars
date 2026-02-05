import { useRef } from 'react';

export function useLongPress(callback, ms = 100) {
  const timerRef = useRef(null);

  const start = () => {
    if (timerRef.current) return;
    callback();
    timerRef.current = setInterval(callback, ms);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}