import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TunerVisual } from './components/TunerVisual';
import { Controls } from './components/Controls';
import { audioEngine } from './services/audioEngine';
import { TunerSettings, DetectedPitch, NoteDefinition } from './types';
import { TUNINGS, getFrequency } from './constants';
import { Mic, MicOff, Play, Volume2, AlertCircle } from 'lucide-react';

const DEFAULT_SETTINGS: TunerSettings = {
  a4Reference: 440,
  instrument: 'guitar',
  tuningName: 'Standard',
  isAutoMode: true,
  selectedStringIndex: null,
  sensitivity: 0.5,
  soundEnabled: false,
};

function App() {
  const [settings, setSettings] = useState<TunerSettings>(DEFAULT_SETTINGS);
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<DetectedPitch | null>(null);
  const [lastInTuneTime, setLastInTuneTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to hold latest settings for the audio loop without re-triggering effects
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Get current tuning strings based on settings
  const currentTuning = useMemo(() => {
    const instrTunings = TUNINGS[settings.instrument];
    return instrTunings.find(t => t.name === settings.tuningName) || instrTunings[0];
  }, [settings.instrument, settings.tuningName]);

  // Determine the target note
  const targetNote = useMemo(() => {
    if (!currentPitch) {
        if (!settings.isAutoMode && settings.selectedStringIndex !== null) {
            return currentTuning.notes[settings.selectedStringIndex];
        }
        return null;
    }

    if (!settings.isAutoMode && settings.selectedStringIndex !== null) {
      const manualNote = currentTuning.notes[settings.selectedStringIndex];
      return manualNote;
    }

    return {
        name: currentPitch.note + currentPitch.octave,
        frequency: getFrequency(0, settings.a4Reference),
        octave: currentPitch.octave
    } as NoteDefinition;

  }, [currentPitch, settings.isAutoMode, settings.selectedStringIndex, currentTuning, settings.a4Reference]);

  const displayPitch = useMemo(() => {
    if (!currentPitch) return null;
    if (settings.isAutoMode || settings.selectedStringIndex === null) return currentPitch;

    const target = currentTuning.notes[settings.selectedStringIndex];
    const cents = 1200 * Math.log2(currentPitch.frequency / target.frequency);
    
    return {
        ...currentPitch,
        deviation: cents
    };
  }, [currentPitch, settings.isAutoMode, settings.selectedStringIndex, currentTuning]);

  const handlePitchDetected = useCallback((pitch: DetectedPitch | null) => {
    setCurrentPitch(pitch);
    if (pitch && Math.abs(pitch.deviation) < 5) {
        const now = Date.now();
        if (now - lastInTuneTime > 500) {
            if (navigator.vibrate) navigator.vibrate(10);
            setLastInTuneTime(now);
        }
    }
  }, [lastInTuneTime]);

  const startTuner = async () => {
    setError(null);
    try {
        await audioEngine.start(handlePitchDetected, settingsRef.current.sensitivity, settingsRef.current.a4Reference);
        setIsListening(true);
    } catch (error: any) {
        console.error("Tuner start error:", error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setError("Microphone access denied. Please allow permission in your browser settings.");
        } else if (error.message?.includes("HTTPS")) {
            setError("App must be served over HTTPS for microphone access.");
        } else {
            setError("Could not access microphone. Please ensure no other app is using it.");
        }
        setIsListening(false);
    }
  };

  // Auto-start tuner on mount
  useEffect(() => {
    let mounted = true;
    
    // Small timeout to ensure browser is ready and we don't spam instantly
    const timer = setTimeout(() => {
        if (mounted) startTuner();
    }, 500);

    // Global click listener to resume AudioContext if browser suspended it
    const unlockAudio = () => {
        audioEngine.resume();
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      mounted = false;
      clearTimeout(timer);
      audioEngine.stop();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Watch for setting changes (AudioEngine restart logic)
  useEffect(() => {
      if (isListening) {
           audioEngine.stop();
           audioEngine.start(handlePitchDetected, settings.sensitivity, settings.a4Reference).catch(e => console.log("Restart failed", e));
      }
  }, [settings.a4Reference, settings.sensitivity]); 

  const playReferenceTone = (frequency: number) => {
    audioEngine.playTone(frequency);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Background Gradients for Atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <h1 className="text-lg font-bold tracking-wider text-slate-200">PRO<span className="text-emerald-400">TUNE</span></h1>
        </div>
        <Controls settings={settings} updateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-2xl mx-auto px-4">
        
        <TunerVisual 
            currentPitch={displayPitch} 
            targetNote={targetNote}
            isListening={isListening}
            error={error}
        />

        {/* Retry Button if Error */}
        {error && (
            <button 
                onClick={startTuner}
                className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
                <AlertCircle size={16} /> Retry Permission
            </button>
        )}
        
        {/* Fallback Manual Start if stuck not listening and no error (rare case) */}
        {!isListening && !error && (
             <div className="mt-4 text-slate-500 text-sm animate-pulse">Initializing audio engine...</div>
        )}

      </main>

      {/* Footer Controls / Manual String Selection */}
      <footer className="relative z-20 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 pb-safe">
        <div className="max-w-xl mx-auto p-4">
            
            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-800 p-1 rounded-lg flex shadow-inner">
                    <button 
                        onClick={() => setSettings(s => ({ ...s, isAutoMode: true, selectedStringIndex: null }))}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${settings.isAutoMode ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Auto
                    </button>
                    <button 
                         onClick={() => setSettings(s => ({ ...s, isAutoMode: false, selectedStringIndex: 0 }))}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${!settings.isAutoMode ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Manual
                    </button>
                </div>
            </div>

            {/* String Buttons */}
            <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {currentTuning.notes.map((note, idx) => {
                    const isActive = settings.selectedStringIndex === idx;
                    const isDetected = settings.isAutoMode && currentPitch?.note === note.name.replace(/\d/, '') && currentPitch?.octave === note.octave;
                    
                    return (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => {
                                    setSettings(s => ({ ...s, isAutoMode: false, selectedStringIndex: idx }));
                                    if (settings.soundEnabled) playReferenceTone(note.frequency);
                                }}
                                className={`
                                    w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all relative
                                    ${isActive 
                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                        : isDetected 
                                            ? 'border-emerald-500/50 bg-slate-800 text-emerald-400'
                                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                                    }
                                `}
                            >
                                {note.name.replace(/\d/, '')}
                                <span className="absolute -bottom-5 text-[10px] text-slate-600 font-mono opacity-0 group-hover:opacity-100">{note.octave}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center mt-6 text-slate-600 text-[10px] uppercase tracking-widest">
                 {settings.tuningName} Tuning &bull; {settings.a4Reference}Hz
            </div>

        </div>
      </footer>
    </div>
  );
}

export default App;