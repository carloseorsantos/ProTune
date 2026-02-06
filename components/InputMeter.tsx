import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface InputMeterProps {
  volume: number; // 0 to 1 (RMS)
  isListening: boolean;
}

export const InputMeter: React.FC<InputMeterProps> = ({ volume, isListening }) => {
  // Boost volume for visualization so user sees activity even during quiet sustain
  // Multiplier increased from 10 to 30
  const normalized = Math.min(1, volume * 30); 
  
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-800 shadow-sm transition-colors hover:border-slate-700">
      {isListening ? (
        <Mic size={14} className="text-emerald-400" />
      ) : (
        <MicOff size={14} className="text-slate-500" />
      )}
      
      {/* Visualizer */}
      <div className="flex gap-0.5 items-end h-3">
        {[...Array(5)].map((_, i) => {
           const threshold = (i + 1) * 0.2; // 0.2, 0.4, 0.6, 0.8, 1.0
           const isActive = normalized >= threshold;
           
           // Bars get progressively "hotter" colors if we wanted, but sticking to theme:
           // Last bar turns red if peaking too hard (optional, keeping clean emerald for now)
           const barColor = i === 4 && isActive ? 'bg-emerald-300' : 'bg-emerald-500';
           
           return (
             <div 
               key={i}
               className={`w-1 rounded-sm transition-all duration-75 ${isActive ? barColor : 'bg-slate-700/30'}`}
               style={{ height: `${50 + (i * 12.5)}%` }} // 50%, 62.5%, 75%, 87.5%, 100%
             />
           );
        })}
      </div>
    </div>
  );
};