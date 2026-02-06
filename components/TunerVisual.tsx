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
  
  // Define refs
  const requestRef = useRef<number>(0);
  const lastCentsRef = useRef<number>(0);
  const lastClarityRef = useRef<number>(0); // Explicitly defining this to fix ReferenceError
  
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
  let statusColor = "text-slate-600";
  let needleColor = "bg-slate-700";
  let ringColor = "border-slate-800";
  
  if (currentPitch) {
    if (isInTune) {
      statusColor = "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]";
      needleColor = "bg-emerald-400";
      ringColor = "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
    } else {
      // Use a vibrant orange/red for out of tune to contrast with green
      statusColor = "text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]"; 
      needleColor = "bg-orange-500";
      ringColor = "border-orange-500/50";
    }
  } else if (isListening) {
     statusColor = "text-slate-400";
  }

  // Trigger Haptics if entering "In Tune" state
  useEffect(() => {
    if (isInTune && navigator.vibrate) {
       // navigator.vibrate(20); 
    }
  }, [isInTune]);

  return (
    <div className="relative w-full max-w-md h-[500px] flex flex-col items-center justify-center">
      
      {/* Note Display Container */}
      <div className="mb-12 relative z-10 flex flex-col items-center justify-center">
        
        {/* Tuning Ring Indicator */}
        <div className={`
             w-64 h-64 rounded-full border-[6px] flex items-center justify-center transition-all duration-300 relative
             ${ringColor} bg-slate-900/30 backdrop-blur-sm
        `}>
             
             {/* Status Label (Top of ring) */}
             {currentPitch && (
                 <div className={`absolute -top-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-slate-900 border ${isInTune ? 'border-emerald-500 text-emerald-400' : 'border-orange-500 text-orange-500'}`}>
                    {isInTune ? 'Perfect' : isSharp ? 'Too High' : 'Too Low'}
                 </div>
             )}

             {/* Note Name */}
             <div className={`relative text-9xl font-black tracking-tighter transition-all duration-200 ${statusColor} flex items-start`}>
                {targetNote?.name.replace(/[0-9]/g, '') || '--'}
                <span className="text-4xl mt-2 opacity-60 ml-1 font-medium">{targetNote?.name.match(/[0-9]/g)}</span>
             </div>

             {/* Cents Deviation (Bottom inside ring) */}
             {currentPitch && (
                 <div className={`absolute bottom-8 font-mono text-lg font-bold ${isInTune ? 'text-emerald-400' : 'text-slate-400'}`}>
                     {currentPitch.deviation > 0 ? '+' : ''}{Math.round(currentPitch.deviation)}
                 </div>
             )}
        </div>
        
        {/* Frequency & Info below ring */}
        <div className="h-8 mt-6 flex items-center justify-center gap-4 text-slate-500 font-mono text-sm relative z-20">
          {currentPitch && (
             <span className="opacity-80">{currentPitch.frequency.toFixed(1)} Hz</span>
          )}
          {!currentPitch && isListening && <span className="animate-pulse text-slate-500">Listening...</span>}
          {error && <span className="text-red-400 font-bold">{error}</span>}
          {!isListening && !error && <span>Microphone off</span>}
        </div>

      </div>

      {/* The Visual Meter (Needle) */}
      <div className="relative w-full h-32 flex items-center justify-center">
        
        {/* Center Marker */}
        <div className={`absolute top-0 bottom-0 w-1 rounded-full z-10 transition-colors duration-300 ${isInTune ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`}></div>
        
        {/* Scale Ticks */}
        <div className="absolute top-1/2 w-full flex justify-between px-8 opacity-30 pointer-events-none">
             {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((tick) => (
               <div key={tick} className={`h-3 w-0.5 bg-white ${tick === 0 ? 'h-8' : ''}`} />
             ))}
        </div>

        {/* Moving Needle */}
        <div 
            className="absolute top-0 bottom-0 w-full transition-opacity duration-500"
            style={{ opacity: isListening ? 1 : 0.3 }}
        >
            <div 
                className={`absolute top-0 bottom-0 w-1 rounded-full shadow-xl transition-colors duration-100 ${needleColor} ${isInTune ? 'shadow-[0_0_20px_rgba(16,185,129,1)]' : ''}`}
                style={{ 
                    left: `${positionPercent}%`,
                    transform: 'translateX(-50%)',
                    transition: 'left 0.1s linear'
                }}
            >
                 <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-2 border-slate-900 ${needleColor}`}></div>
            </div>
        </div>
        
        {/* Direction Text */}
        <div className="absolute bottom-[-10px] w-full flex justify-between px-10 font-bold text-xs uppercase tracking-[0.2em] text-slate-600">
           <span className={`${smoothedCents < -5 && currentPitch ? 'text-orange-500 opacity-100' : 'opacity-20'}`}>Flat</span>
           <span className={`${smoothedCents > 5 && currentPitch ? 'text-orange-500 opacity-100' : 'opacity-20'}`}>Sharp</span>
        </div>

      </div>
    </div>
  );
};