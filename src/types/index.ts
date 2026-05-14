export type Genre = 
  | 'Ambient' | 'Cyberpunk' | 'Classical' | 'Lo-fi' | 'Synthwave' 
  | 'Cinematic' | 'Disco' | 'Jazz' | 'Rock' | 'Electronic'
  | 'Pop' | 'Hip Hop' | 'Metal' | 'Techno' | 'House' | 'Orchestral' 
  | 'Folk' | 'Blues' | 'Funk' | 'Reggae' | 'Trap' | 'Custom';

export type Mood = 
  | 'Calm' | 'Energetic' | 'Dark' | 'Whimsical' | 'Nostalgic' | 'Tense' 
  | 'Aggressive' | 'Ethereal' | 'Melancholic' | 'Heroic' | 'Suspenseful' 
  | 'Hopeful' | 'Chaotic' | 'Minimal' | 'Spacey' | 'Gritty' | 'Dreamy' 
  | 'Romantic' | 'Epic' | 'Chill' | 'Intense' | 'Playful' | 'Sorrowful' 
  | 'Triumphant' | 'Custom';

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

export interface TrainingExample {
  id: string;
  fileName: string;
  fileType: string;
  description?: string;
  data?: string; // base64
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
