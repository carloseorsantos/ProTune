import React from 'react';
import { TunerSettings, InstrumentType, TuningDefinition } from '../types';
import { TUNINGS } from '../constants';
import { Settings, Music, Mic, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface ControlsProps {
  settings: TunerSettings;
  updateSettings: (newSettings: Partial<TunerSettings>) => void;
}

export const Controls: React.FC<ControlsProps> = ({ settings, updateSettings }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Available tunings for current instrument
  const availableTunings = TUNINGS[settings.instrument];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-6 right-6 p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors z-50 shadow-lg"
      >
        <Settings size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 p-6 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">Close</button>
        </div>

        {/* Instrument Selector */}
        <div className="mb-8">
          <label className="block text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">Instrument</label>
          <div className="grid grid-cols-3 gap-2">
            {(['guitar', 'bass', 'ukulele'] as InstrumentType[]).map((inst) => (
              <button
                key={inst}
                onClick={() => updateSettings({ instrument: inst, tuningName: TUNINGS[inst][0].name })}
                className={`p-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  settings.instrument === inst 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* Tuning Selector */}
        <div className="mb-8">
          <label className="block text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">Tuning</label>
          <select 
            value={settings.tuningName}
            onChange={(e) => updateSettings({ tuningName: e.target.value })}
            className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            {availableTunings.map((t: TuningDefinition) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* A4 Reference */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <label className="text-slate-400 text-sm font-semibold uppercase tracking-wider">A4 Calibration</label>
            <span className="text-emerald-400 font-mono">{settings.a4Reference} Hz</span>
          </div>
          <input 
            type="range" 
            min="415" 
            max="466" 
            value={settings.a4Reference}
            onChange={(e) => updateSettings({ a4Reference: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between mt-2">
             <button 
              onClick={() => updateSettings({ a4Reference: 440 })}
              className="text-xs text-slate-500 hover:text-emerald-400 flex items-center gap-1"
             >
               <RotateCcw size={12} /> Reset to 440
             </button>
          </div>
        </div>

        {/* Microphone Sensitivity */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <label className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Sensitivity</label>
            <span className="text-emerald-400 font-mono">{(settings.sensitivity * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="1.0" 
            step="0.1"
            value={settings.sensitivity}
            onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Sound Toggle */}
        <div className="mb-8">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Feedback Sound</span>
            <div 
              className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-slate-600 text-xs">
          ProTune v1.0 <br/> Precision Audio Engine
        </div>
      </div>
    </>
  );
};