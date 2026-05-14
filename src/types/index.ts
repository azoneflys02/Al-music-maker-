export type Genre = 'Ambient' | 'Cybperpunk' | 'Classical' | 'Lo-fi' | 'Synthwave' | 'Cinematic';
export type Mood = 'Calm' | 'Energetic' | 'Dark' | 'Whimsical' | 'Nostalgic' | 'Tense';

export interface Note {
  pitch: string; // e.g., 'C4', 'E4'
  time: string; // Tone.js time format like '0:0:0' or '4n'
  duration: string;
  velocity: number;
}

export interface GeneratedTrack {
  id: string;
  title: string;
  description: string;
  genre: Genre;
  mood: Mood;
  instruments: string[];
  bpm: number;
  melody: Note[];
  bassline: Note[];
  chords: Note[];
  createdAt: number;
}
