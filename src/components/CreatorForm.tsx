import React, { useState } from 'react';
import { Genre, Mood } from '../types';
import { Wand2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CreatorFormProps {
  onGenerate: (genre: Genre, mood: Mood, prompt: string, instruments: { melody: string, bass: string, chords: string }) => Promise<void>;
  isGenerating: boolean;
}

const GENRES: Genre[] = ['Ambient', 'Cybperpunk', 'Classical', 'Lo-fi', 'Synthwave', 'Cinematic'];
const MOODS: Mood[] = ['Calm', 'Energetic', 'Dark', 'Whimsical', 'Nostalgic', 'Tense'];
const MELODY_INSTRUMENTS = ['Sine Lead', 'Sawtooth', 'Pluck', 'Flute', 'Bell'];
const BASS_INSTRUMENTS = ['Deep Sub', 'Acid Bass', 'Electric Bass', 'Analog Growl', 'Submarine'];
const CHORD_INSTRUMENTS = ['Atmospheric Pad', 'Soft Piano', 'Digital Organ', 'Strings', 'Warm Brass'];

export const CreatorForm: React.FC<CreatorFormProps> = ({ onGenerate, isGenerating }) => {
  const [genre, setGenre] = useState<Genre>('Ambient');
  const [mood, setMood] = useState<Mood>('Calm');
  const [prompt, setPrompt] = useState('');
  
  const [melodyInst, setMelodyInst] = useState(MELODY_INSTRUMENTS[0]);
  const [bassInst, setBassInst] = useState(BASS_INSTRUMENTS[0]);
  const [chordInst, setChordInst] = useState(CHORD_INSTRUMENTS[0]);

  const handleGenerate = () => {
    onGenerate(genre, mood, prompt, { melody: melodyInst, bass: bassInst, chords: chordInst });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
      
      <div className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 block">Select Genre</label>
            <div className="grid grid-cols-2 gap-3">
              {GENRES.map((g) => (
                <button
                  key={g}
                  disabled={isGenerating}
                  onClick={() => setGenre(g)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                    genre === g 
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40' 
                      : 'bg-white/5 text-white/60 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 block">Select Mood</label>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m}
                  disabled={isGenerating}
                  onClick={() => setMood(m)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                    mood === m 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/40' 
                      : 'bg-white/5 text-white/60 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-white/5">
          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3 block">Melody Instrument</label>
            <div className="flex flex-wrap gap-2">
              {MELODY_INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setMelodyInst(inst)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    melodyInst === inst ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3 block">Bass Instrument</label>
            <div className="flex flex-wrap gap-2">
              {BASS_INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setBassInst(inst)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    bassInst === inst ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3 block">Chords Instrument</label>
            <div className="flex flex-wrap gap-2">
              {CHORD_INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setChordInst(inst)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    chordInst === inst ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 block">AI Instruction (Optional)</label>
          <textarea
            disabled={isGenerating}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. 'Slow building strings with a deep sub bass...'"
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors resize-none h-20 text-sm"
          />
        </div>

        <button
          disabled={isGenerating}
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl shadow-purple-900/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Composing Masterpiece...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Generate Audio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
