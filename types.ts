export type InstrumentType = 'guitar' | 'bass' | 'ukulele';

export interface NoteDefinition {
  name: string;
  frequency: number;
  octave: number;
}

export interface TuningDefinition {
  name: string;
  notes: NoteDefinition[]; // Order: Low string to High string
}

export interface DetectedPitch {
  frequency: number;
  note: string;
  octave: number;
  deviation: number; // Cents
  clarity: number; // 0 to 1 confidence
}

export interface TunerSettings {
  a4Reference: number; // Default 440
  instrument: InstrumentType;
  tuningName: string;
  isAutoMode: boolean;
  selectedStringIndex: number | null; // For manual mode
  sensitivity: number; // 0.1 to 1.0
  soundEnabled: boolean;
}