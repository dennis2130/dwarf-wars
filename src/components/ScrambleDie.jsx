import { useState, useEffect } from 'react';

// The shape of a D20 (SVG Path) - Simplistic Hexagon representation
const D20Icon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 7v10l10 5 10-5V7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
  </svg>
);

export default function ScrambleDie({ target, onComplete }) {
  const [displayNum, setDisplayNum] = useState(1);
  const [speed, setSpeed] = useState(50); // Start fast (50ms)

  useEffect(() => {
    let timeout;
    let count = 0;
    const maxRolls = 20; // How many times it flashes before stopping

    const roll = () => {
      // 1. Pick a random number 1-20
      const nextNum = Math.ceil(Math.random() * 20);
      setDisplayNum(nextNum);
      
      count++;

      if (count < maxRolls) {
        // Keep rolling, getting slightly slower
        // Ease-out effect: speed increases by 10ms each tick
        timeout = setTimeout(roll, speed + (count * 5)); 
      } else {
        // STOP: Show the real target
        setDisplayNum(target);
        if (onComplete) onComplete();
      }
    };

    roll();

    return () => clearTimeout(timeout);
  }, []); // Run once on mount

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Background Icon (Pulse effect) */}
      <D20Icon className="w-full h-full text-slate-700 absolute opacity-50" />
      
      {/* The Number */}
      <div className="z-10 text-6xl font-bold font-mono text-white animate-in zoom-in duration-75">
        {displayNum}
      </div>
    </div>
  );
}