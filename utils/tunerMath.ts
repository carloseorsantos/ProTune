import { NOTE_NAMES } from '../constants';

export const getNoteFromFrequency = (frequency: number, a4: number = 440) => {
  const noteNum = 12 * (Math.log(frequency / a4) / Math.log(2));
  const noteIndex = Math.round(noteNum) + 69;
  
  const name = NOTE_NAMES[noteIndex % 12];
  const octave = Math.floor(noteIndex / 12) - 1;
  const targetFrequency = a4 * Math.pow(2, (noteIndex - 69) / 12);
  const cents = 1200 * (Math.log(frequency / targetFrequency) / Math.log(2));

  return {
    name,
    octave,
    cents,
    noteIndex,
    targetFrequency
  };
};

// Autocorrelation algorithm with parabolic interpolation
export const autoCorrelate = (buffer: Float32Array, sampleRate: number, sensitivity: number): { frequency: number, clarity: number } => {
  const SIZE = buffer.length;
  // RMS (Root Mean Square) to check if there's enough signal
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    sumOfSquares += buffer[i] * buffer[i];
  }
  const rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);

  // Noise gate - if signal is too quiet, return -1
  // Sensitivity slider adjusts this threshold. 
  // High sensitivity = low threshold (0.01). Low sensitivity = high threshold (0.05)
  const threshold = 0.06 - (sensitivity * 0.05); 
  
  if (rootMeanSquare < threshold) {
    return { frequency: -1, clarity: 0 };
  }

  // Autocorrelation
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const buffer2 = buffer.slice(r1, r2);
  const c = new Array(buffer2.length).fill(0);
  
  for (let i = 0; i < buffer2.length; i++) {
    for (let j = 0; j < buffer2.length - i; j++) {
      c[i] = c[i] + buffer2[j] * buffer2[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  
  for (let i = d; i < buffer2.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  
  let T0 = maxpos;

  // Parabolic interpolation for better precision
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  
  if (a) T0 = T0 - b / (2 * a);

  // Clarity is the normalized peak correlation (0 to 1)
  // c[0] is the energy (autocorrelation at lag 0)
  const clarity = c[0] > 0 ? maxval / c[0] : 0;

  return { frequency: sampleRate / T0, clarity };
};