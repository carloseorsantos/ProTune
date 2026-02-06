import React, { useEffect, useRef, useState } from 'react';
import { DetectedPitch, NoteDefinition } from '../types';

interface TunerVisualProps {
  currentPitch: DetectedPitch | null;
  targetNote: NoteDefinition | null; // The closest correct note or manually selected one
  isListening: boolean;
  error?: string | null;
}

export const TunerVisual: React.FC<TunerVisualProps> = ({ currentPitch, targetNote, isListening, error }) => {
  const [smoothedCents, setSmoothedCents] = useState(0);
  const [smoothedClarity, setSmoothedClarity] = useState(0);
  const requestRef = useRef<number>();
  const lastCentsRef = useRef<number>(0);
  const lastClarityRef = useRef<number>(0);
  
  // Animation loop for smoothing the needle movement
  const animate = () => {
    if (currentPitch) {
      // Lerp factor - lower is smoother but more laggy
      const lerpFactor = 0.15;
      const target = currentPitch.deviation;
      // Linear interpolation
      lastCentsRef.current = lastCentsRef.current + (target - lastCentsRef.current) * lerpFactor;

      // Smooth clarity
      const targetClarity = currentPitch.clarity;
      lastClarityRef.current = lastClarityRef.current + (targetClarity - lastClarityRef.current) * 0.1;

    } else {
      // Return to center slowly if no input
      lastCentsRef.current = lastCentsRef.current + (0 - lastCentsRef.current) * 0.05;
      lastClarityRef.current = lastClarityRef.current + (0 - lastClarityRef.current) * 0.1;
    }
    
    setSmoothedCents(lastCentsRef.current);
    setSmoothedClarity(lastClarityRef.current);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentPitch]); // Dependency on existence of pitch object, but logic runs continuously

  // Calculate visual properties
  const isInTune = Math.abs(smoothedCents) < 5 && !!currentPitch;
  const isSharp = smoothedCents > 0;
  
  // Max deviation to display on screen (e.g., +/- 50 cents)
  const range = 50;
  const clampedCents = Math.max(-range, Math.min(range, smoothedCents));
  
  // Convert cents to horizontal position percentage (50% is center)
  // -50 cents = 0%, 0 cents = 50%, +50 cents = 100%
  const positionPercent = 50 + (clampedCents / range) * 50;

  // Color logic
  let statusColor = "text-slate-400";
  let needleColor = "bg-slate-500";
  
  if (currentPitch) {
    if (isInTune) {
      statusColor = "text-emerald-400";
      needleColor = "bg-emerald-400";
    } else {
      statusColor = isSharp ? "text-orange-400" : "text-orange-400"; // Use orange for both flat/sharp for standard pro look
      needleColor = "bg-orange-400";
    }
  }

  // Trigger Haptics if entering "In Tune" state
  useEffect(() => {
    if (isInTune && navigator.vibrate) {
        // Debounce vibration to avoid buzzing
        // Implementation handled in parent usually, or simple one-shot here
       // navigator.vibrate(20); 
    }
  }, [isInTune]);

  return (
    <div className="relative w-full max-w-md h-[500px] flex flex-col items-center justify-center">
      
      {/* Note Display */}
      <div className="mb-12 text-center relative z-10 flex flex-col items-center">
        
        {/* Background Radial Glow based on Clarity */}
        <div 
           className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none ${isInTune ? 'bg-emerald-500/20' : 'bg-orange-500/10'}`}
           style={{ opacity: smoothedClarity * 0.8 }}
        ></div>

        <div className={`relative text-9xl font-bold tracking-tighter transition-all duration-300 ${statusColor} ${isInTune ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]' : ''}`}>
          {targetNote?.name.replace(/[0-9]/g, '') || '--'}
          <span className="text-4xl align-top opacity-60 ml-1">{targetNote?.name.match(/[0-9]/g)}</span>
        </div>
        
        {/* Frequency & Cents */}
        <div className="h-8 mt-4 flex items-center justify-center gap-4 text-slate-500 font-mono text-sm relative z-20">
          {currentPitch && (
            <>
              <span className="w-20 text-right">{currentPitch.frequency.toFixed(1)} Hz</span>
              <span className="w-px h-4 bg-slate-700"></span>
              <span className={`w-20 text-left ${Math.abs(currentPitch.deviation) < 5 ? 'text-emerald-400' : ''}`}>
                {currentPitch.deviation > 0 ? '+' : ''}{Math.round(currentPitch.deviation)}¢
              </span>
            </>
          )}
          {!currentPitch && isListening && <span className="animate-pulse">Pluck a string...</span>}
          {error && <span className="text-red-400 font-bold">{error}</span>}
          {!isListening && !error && <span>Please allow microphone access...</span>}
        </div>

        {/* Signal Quality Bar */}
        {isListening && (
            <div className="flex items-center gap-2 mt-2 opacity-50 transition-opacity duration-500" style={{ opacity: currentPitch ? 0.7 : 0 }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Signal</div>
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${isInTune ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        style={{ width: `${Math.min(100, smoothedClarity * 100)}%` }}
                    />
                </div>
            </div>
        )}
      </div>

      {/* The Visual Meter */}
      <div className="relative w-full h-64 flex items-center justify-center">
        
        {/* Central "String" (Stationary Target) */}
        <div className={`absolute top-0 bottom-0 w-1 rounded-full transition-colors duration-300 ${isInTune ? 'bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
        
        {/* Tick Marks */}
        <div className="absolute top-1/2 w-full flex justify-between px-8 opacity-20 pointer-events-none">
             {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((tick) => (
               <div key={tick} className={`h-2 w-0.5 bg-white ${tick === 0 ? 'h-6' : ''}`} />
             ))}
        </div>

        {/* Moving Needle/String Indicator */}
        <div 
            className="absolute top-0 bottom-0 w-full transition-opacity duration-500"
            style={{ opacity: isListening ? 1 : 0.3 }}
        >
            <div 
                className={`absolute top-0 bottom-0 w-1.5 rounded-full shadow-xl transition-colors duration-100 ${needleColor} ${isInTune ? 'shadow-[0_0_20px_rgba(16,185,129,1)]' : ''}`}
                style={{ 
                    left: `${positionPercent}%`,
                    transform: 'translateX(-50%)',
                    transition: 'left 0.1s linear' // Smooth CSS transition for position
                }}
            >
                {/* The "Head" of the needle */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${needleColor} shadow-lg`}></div>
            </div>
        </div>
        
        {/* Status Text (Flat / Sharp) */}
        <div className="absolute bottom-[-40px] w-full flex justify-between px-10 font-bold text-xs uppercase tracking-[0.2em] text-slate-600">
           <span className={`${smoothedCents < -10 && currentPitch ? 'text-orange-400 opacity-100' : 'opacity-30'}`}>Flat ♭</span>
           <span className={`${isInTune ? 'text-emerald-400 opacity-100' : 'opacity-0'}`}>Perfect</span>
           <span className={`${smoothedCents > 10 && currentPitch ? 'text-orange-400 opacity-100' : 'opacity-30'}`}>Sharp ♯</span>
        </div>

      </div>
    </div>
  );
};