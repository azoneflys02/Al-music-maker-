export type Genre = 'Ambient' | 'Cyberpunk' | 'Classical' | 'Lo-fi' | 'Synthwave' | 'Cinematic' | 'Disco' | 'Jazz' | 'Rock' | 'Electronic';
export type Mood = 'Calm' | 'Energetic' | 'Dark' | 'Whimsical' | 'Nostalgic' | 'Tense' | 'Aggressive' | 'Ethereal' | 'Melancholic' | 'Heroic' | 'Suspenseful' | 'Hopeful' | 'Chaotic' | 'Minimal';

export type SectionType = 'Intro' | 'Verse' | 'Chorus' | 'Bridge' | 'Outro';

export interface SongSection {
  id: string;
  type: SectionType;
  durationBars: number;
}

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
  drums?: Note[];
  structure?: SongSection[];
  createdAt: number;
  targetDuration?: number;
  lyrics?: string;
}
