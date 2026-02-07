import { useRef, useEffect } from 'react';

export function useLongPress(callback, ms = 100) {
  const timerRef = useRef(null);

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = (e) => {
    // Prevent default context menus on long press (Android specific quirk)
    // But be careful not to block scrolling if that's intended
    if (e.cancelable && e.type === 'touchstart') {
        // e.preventDefault(); // Sometimes needed, but can break scrolling
    }
    
    if (timerRef.current) return;
    callback(); // Fire immediately
    timerRef.current = setInterval(callback, ms);
  };

  // GLOBAL SAFETY VALVE
  // If the component using this hook mounts, we add a global listener 
  // to catch "finger lift" anywhere on screen.
  useEffect(() => {
      const globalStop = () => stop();
      window.addEventListener('mouseup', globalStop);
      window.addEventListener('touchend', globalStop);
      window.addEventListener('touchcancel', globalStop); // Important for Android interruptions

      return () => {
          stop(); // Cleanup on unmount
          window.removeEventListener('mouseup', globalStop);
          window.removeEventListener('touchend', globalStop);
          window.removeEventListener('touchcancel', globalStop);
      };
  }, []);

  return {
    onMouseDown: start,
    // onMouseUp: stop,    <-- Removed, handled globally now
    // onMouseLeave: stop, <-- Removed, handled globally now
    onTouchStart: start,
    // onTouchEnd: stop,   <-- Removed, handled globally now
  };
}