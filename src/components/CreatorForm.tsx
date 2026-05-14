import React, { useState } from 'react';
import { Genre, Mood, Note, SongSection } from '../types';
import { Wand2, Loader2, Music4 } from 'lucide-react';
import { motion } from 'motion/react';
import { MidiImport } from './MidiImport';
import { StructureEditor } from './StructureEditor';

interface CreatorFormProps {
  onGenerate: (
    genre: Genre, 
    mood: Mood, 
    prompt: string, 
    instruments: { melody: string, bass: string, chords: string, drums: string }, 
    duration: number, 
    bpm: number, 
    midiRef?: { melody: Note[], bassline: Note[], chords: Note[], drums: Note[] }, 
    structure?: SongSection[],
    theme?: string,
    includeLyrics?: boolean
  ) => Promise<void>;
  isGenerating: boolean;
}

const GENRES: Genre[] = ['Ambient', 'Cyberpunk', 'Classical', 'Lo-fi', 'Synthwave', 'Cinematic', 'Disco', 'Jazz', 'Rock', 'Electronic'];
const MOODS: Mood[] = [
  'Calm', 'Energetic', 'Dark', 'Whimsical', 'Nostalgic', 'Tense', 
  'Aggressive', 'Ethereal', 'Melancholic', 'Heroic', 'Suspenseful', 
  'Hopeful', 'Chaotic', 'Minimal'
];
const MELODY_INSTRUMENTS = ['Sine Lead', 'Moog Lead', 'Sawtooth', 'Square Wave', 'Chiptune', 'Pluck', 'Nylon Pluck', 'Flute', 'Soft Sax', 'Bell', 'Rhodes', 'Trumpet', 'Distortion Guitar', 'Grand Piano', 'Violin Solist'];
const BASS_INSTRUMENTS = ['Deep Sub', 'Reese Bass', 'Acid Bass', 'Electric Bass', 'Analog Growl', 'Submarine', 'Slap Bass', 'Walking Bass', 'Fretless Bass', '808 Boom', '8-bit Bass', 'Synth Piz'];
const CHORD_INSTRUMENTS = ['Atmospheric Pad', 'Ethereal Pad', 'Rhodes Chords', 'Soft Piano', 'Digital Organ', 'Wurlitzer', 'Strings', 'Grand Strings', 'Warm Brass', 'Jazz Guitar', 'Bossa Nova Guitar', 'Rock Organ', 'Nylon Guitar'];
const DRUM_KITS = ['Modern 808', 'Acoustic Studio', 'Lo-fi Hip Hop', 'Classic 909', 'Cinematic Percussion', 'Jazz Drums', 'Retro Rock'];

export const CreatorForm: React.FC<CreatorFormProps> = ({ onGenerate, isGenerating }) => {
  const [genre, setGenre] = useState<Genre>('Ambient');
  const [mood, setMood] = useState<Mood>('Calm');
  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('');
  const [includeLyrics, setIncludeLyrics] = useState(true);
  const [duration, setDuration] = useState(60);
  const [bpm, setBpm] = useState(100);
  
  const [melodyInst, setMelodyInst] = useState(MELODY_INSTRUMENTS[0]);
  const [bassInst, setBassInst] = useState(BASS_INSTRUMENTS[0]);
  const [chordInst, setChordInst] = useState(CHORD_INSTRUMENTS[0]);
  const [drumKit, setDrumKit] = useState(DRUM_KITS[0]);
  const [sections, setSections] = useState<SongSection[]>([]);

  const [midiData, setMidiData] = useState<{ melody: Note[], bassline: Note[], chords: Note[], drums: Note[], bpm: number, fileName: string } | null>(null);

  const handleGenerate = () => {
    onGenerate(
      genre, 
      mood, 
      prompt, 
      { melody: melodyInst, bass: bassInst, chords: chordInst, drums: drumKit }, 
      duration, 
      bpm, 
      midiData ? midiData : undefined, 
      sections.length > 0 ? sections : undefined,
      theme,
      includeLyrics
    );
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
      
      <div className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-4 block">Select Genre</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {GENRES.map((g) => (
                <button
                  key={g}
                  disabled={isGenerating}
                  onClick={() => setGenre(g)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                    genre === g 
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40' 
                      : 'bg-white/5 text-yellow-200/80 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-4 block">Select Mood</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m}
                  disabled={isGenerating}
                  onClick={() => setMood(m)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${
                    mood === m 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/40' 
                      : 'bg-white/5 text-yellow-200/80 border border-white/5 hover:border-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-3 block flex justify-between">
                <span>Song Duration</span>
                <span className="text-yellow-400 font-bold">{formatDuration(duration)}</span>
              </label>
              <input 
                type="range"
                min="30"
                max="300"
                step="30"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-3 block flex justify-between">
                <span>Tempo (BPM)</span>
                <span className="text-yellow-400 font-bold">{bpm} BPM</span>
              </label>
              <input 
                type="range"
                min="60"
                max="180"
                step="5"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-3 block">Melody Instrument</label>
            <div className="flex flex-wrap gap-2">
              {MELODY_INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setMelodyInst(inst)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    melodyInst === inst ? 'bg-yellow-500 text-black' : 'bg-white/5 text-yellow-200/40 hover:bg-white/10'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-3 block">Bass Instrument</label>
            <div className="flex flex-wrap gap-2">
              {BASS_INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setBassInst(inst)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    bassInst === inst ? 'bg-yellow-500 text-black' : 'bg-white/5 text-yellow-200/40 hover:bg-white/10'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-3 block">Chords Instrument</label>
            <div className="flex flex-wrap gap-2">
              {CHORD_INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => setChordInst(inst)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    chordInst === inst ? 'bg-yellow-500 text-black' : 'bg-white/5 text-yellow-200/40 hover:bg-white/10'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-3 block">Drum Kit Style</label>
            <div className="flex flex-wrap gap-2">
              {DRUM_KITS.map(kit => (
                <button
                  key={kit}
                  onClick={() => setDrumKit(kit)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    drumKit === kit ? 'bg-yellow-500 text-black' : 'bg-white/5 text-yellow-200/40 hover:bg-white/10'
                  }`}
                >
                  {kit}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-4 block flex items-center gap-2">
              <Music4 className="w-3 h-3 text-yellow-500" />
              MIDI Reference (Optional)
            </label>
            <MidiImport 
              onMidiParsed={(data) => {
                setMidiData(data);
                if (data.bpm) setBpm(data.bpm);
              }}
              currentFile={midiData?.fileName}
            />
          </div>

          <div className="pt-8 border-t border-white/5">
            <StructureEditor 
              sections={sections}
              onChange={setSections}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
          <div>
            <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-4 block">Song Theme / Topic</label>
            <input 
              type="text"
              disabled={isGenerating}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="E.g. 'Space exploration', 'Lost love'..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-yellow-500/20 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
            />
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={includeLyrics}
                  onChange={() => setIncludeLyrics(!includeLyrics)}
                />
                <div className={`block w-12 h-7 rounded-full transition-colors ${includeLyrics ? 'bg-purple-600' : 'bg-white/10'}`} />
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${includeLyrics ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest">Generate Lyrics</span>
                <span className="text-[10px] text-yellow-500/30">Creates poetic lines based on theme</span>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest mb-4 block">Technical AI Instruction (Optional)</label>
          <textarea
            disabled={isGenerating}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. 'Slow building strings with a deep sub bass...'"
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-yellow-500/20 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none h-20 text-sm"
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
