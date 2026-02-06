import { TuningDefinition, InstrumentType } from './types';

export const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

// Helper to calculate frequency based on A4
export const getFrequency = (semitoneDistanceFromA4: number, a4: number = 440): number => {
  return a4 * Math.pow(2, semitoneDistanceFromA4 / 12);
};

// Definitions
const createNote = (name: string, semitoneDist: number, octave: number, a4: number = 440) => ({
  name: `${name}${octave}`,
  frequency: getFrequency(semitoneDist, a4),
  octave
});

// Tunings
export const TUNINGS: Record<InstrumentType, TuningDefinition[]> = {
  guitar: [
    {
      name: "Standard",
      notes: [
        { name: "E2", frequency: 82.41, octave: 2 },
        { name: "A2", frequency: 110.00, octave: 2 },
        { name: "D3", frequency: 146.83, octave: 3 },
        { name: "G3", frequency: 196.00, octave: 3 },
        { name: "B3", frequency: 246.94, octave: 3 },
        { name: "E4", frequency: 329.63, octave: 4 },
      ]
    },
    {
      name: "Drop D",
      notes: [
        { name: "D2", frequency: 73.42, octave: 2 },
        { name: "A2", frequency: 110.00, octave: 2 },
        { name: "D3", frequency: 146.83, octave: 3 },
        { name: "G3", frequency: 196.00, octave: 3 },
        { name: "B3", frequency: 246.94, octave: 3 },
        { name: "E4", frequency: 329.63, octave: 4 },
      ]
    },
    {
      name: "Open G",
      notes: [
        { name: "D2", frequency: 73.42, octave: 2 },
        { name: "G2", frequency: 98.00, octave: 2 },
        { name: "D3", frequency: 146.83, octave: 3 },
        { name: "G3", frequency: 196.00, octave: 3 },
        { name: "B3", frequency: 246.94, octave: 3 },
        { name: "D4", frequency: 293.66, octave: 4 },
      ]
    }
  ],
  bass: [
    {
      name: "Standard",
      notes: [
        { name: "E1", frequency: 41.20, octave: 1 },
        { name: "A1", frequency: 55.00, octave: 1 },
        { name: "D2", frequency: 73.42, octave: 2 },
        { name: "G2", frequency: 98.00, octave: 2 },
      ]
    }
  ],
  ukulele: [
    {
      name: "Standard (GCEA)",
      notes: [
        { name: "G4", frequency: 392.00, octave: 4 },
        { name: "C4", frequency: 261.63, octave: 4 },
        { name: "E4", frequency: 329.63, octave: 4 },
        { name: "A4", frequency: 440.00, octave: 4 },
      ]
    }
  ]
};