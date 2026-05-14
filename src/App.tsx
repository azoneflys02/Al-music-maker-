import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CreatorForm } from './components/CreatorForm';
import { TrackCard } from './components/TrackCard';
import { Visualizer } from './components/Visualizer';
import { Genre, Mood, GeneratedTrack } from './types';
import { generateMusic } from './lib/gemini';
import { audioEngine } from './lib/audioEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Music, AlertCircle, Headphones } from 'lucide-react';

export default function App() {
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load tracks from localStorage
    const saved = localStorage.getItem('aurasynth_tracks');
    if (saved) {
      try {
        setTracks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tracks", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aurasynth_tracks', JSON.stringify(tracks));
  }, [tracks]);

  const handleGenerate = async (
    genre: Genre, 
    mood: Mood, 
    customPrompt: string, 
    instruments: { melody: string, bass: string, chords: string }
  ) => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateMusic(genre, mood, customPrompt, instruments);
      
      const newTrack: GeneratedTrack = {
        id: Math.random().toString(36).substring(7),
        title: data.title || 'Untitled Composition',
        description: data.description || 'No description provided.',
        genre,
        mood,
        instruments: data.instruments || [],
        bpm: data.bpm || 100,
        melody: data.melody || [],
        bassline: data.bassline || [],
        chords: data.chords || [],
        createdAt: Date.now()
      };

      setTracks(prev => [newTrack, ...prev]);
    } catch (err) {
      setError("AI was unable to compose at this moment. Please check your connection or try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async (track: GeneratedTrack) => {
    try {
      await audioEngine.init();
      audioEngine.playTrack(track);
      setPlayingTrackId(track.id);
    } catch (err) {
      console.error("Audio playback error", err);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setPlayingTrackId(null);
  };

  const handleDelete = (id: string) => {
    if (playingTrackId === id) handleStop();
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Generator & Visualizer */}
        <div className="lg:col-span-5 space-y-8">
          <section>
            <div className="mb-6">
              <h2 className="text-4xl font-bold tracking-tight mb-2">Compose <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Atmospheres</span></h2>
              <p className="text-white/40 text-lg">Define the soul of your sound and let the model weave the notes.</p>
            </div>
            
            <CreatorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-white/60">Live Waveform</span>
              </div>
              {playingTrackId && (
                <span className="text-[10px] font-mono text-purple-400 animate-pulse">PLAYING: {tracks.find(t => t.id === playingTrackId)?.title}</span>
              )}
            </div>
            
            <Visualizer isPlaying={!!playingTrackId} />
            
            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-white/30 font-mono uppercase mb-1">Synthesizer</p>
                <p className="text-xs text-white/70 font-medium">Multi-Osc Poly</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] text-white/30 font-mono uppercase mb-1">Processing</p>
                <p className="text-xs text-white/70 font-medium">Reverb + Delay</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] text-white/30 font-mono uppercase mb-1">Quality</p>
                <p className="text-xs text-white/70 font-medium">24-bit PCM</p>
              </div>
            </div>
          </section>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        {/* Right Column: Collection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between sticky top-32 z-40 bg-[#050505]/80 py-4 backdrop-blur-sm -mx-2 px-2">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold tracking-tight">Your AI Gallery</h2>
              <span className="bg-white/5 border border-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">{tracks.length} Tracks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {tracks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl"
                >
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <Music className="w-8 h-8 text-white/20" />
                  </div>
                  <div>
                    <p className="text-white/40 font-medium text-lg">Silence is waiting...</p>
                    <p className="text-white/20 text-sm max-w-xs mt-1">Change the settings on the left to start generating your first AI composition.</p>
                  </div>
                </motion.div>
              ) : (
                tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isPlaying={playingTrackId === track.id}
                    onPlay={handlePlay}
                    onStop={handleStop}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Floating Global Audio Control (if playing) */}
      <AnimatePresence>
        {playingTrackId && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-4 rounded-full shadow-2xl flex items-center gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-spin-slow">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Now Streaming</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{tracks.find(t => t.id === playingTrackId)?.title}</p>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={handleStop}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <div className="w-3 h-3 bg-black rounded-sm" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

