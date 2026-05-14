import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CreatorForm } from './components/CreatorForm';
import { TrackCard } from './components/TrackCard';
import { Visualizer } from './components/Visualizer';
import { Genre, Mood, Note, SongSection, GeneratedTrack } from './types';
import { generateMusic } from './lib/gemini';
import { audioEngine } from './lib/audioEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Music, AlertCircle, Headphones, Loader2, Sparkles, Trash2, Cloud } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { trackService } from './services/trackService';

export default function App() {
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    trackService.testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsLoading(true);
        const fetchedTracks = await trackService.getTracks();
        setTracks(fetchedTracks);
        setIsLoading(false);
      } else {
        setTracks([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async (
    genre: Genre, 
    mood: Mood, 
    customPrompt: string, 
    instruments: { melody: string, bass: string, chords: string, drums: string },
    duration: number,
    targetBpm: number,
    midiRef?: { melody: Note[], bassline: Note[], chords: Note[], drums: Note[] },
    structure?: SongSection[],
    theme?: string,
    includeLyrics: boolean = true
  ) => {
    if (!user) {
      setError("Please sign in to generate and save tracks.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateMusic(
        genre, 
        mood, 
        customPrompt, 
        instruments, 
        duration, 
        targetBpm, 
        midiRef, 
        structure,
        theme,
        includeLyrics
      );
      
      const trackData: Omit<GeneratedTrack, 'id'> = {
        title: data.title || 'Untitled Composition',
        description: data.description || 'No description provided.',
        genre,
        mood,
        instruments: data.instruments || [instruments.melody, instruments.bass, instruments.chords, instruments.drums],
        bpm: data.bpm || targetBpm,
        melody: data.melody || [],
        bassline: data.bassline || [],
        chords: data.chords || [],
        drums: data.drums || [],
        structure: structure || [],
        createdAt: Date.now(),
        targetDuration: duration,
        lyrics: data.lyrics
      };

      const actualDuration = audioEngine.calculateTrackDuration(trackData as GeneratedTrack);
      trackData.targetDuration = actualDuration;

      // Local only - No auto-save
      const tempId = `temp-${Date.now()}`;
      const newTrack: GeneratedTrack = { ...trackData, id: tempId };
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
      audioEngine.playTrack(track, () => {
        setPlayingTrackId(null);
      });
      setPlayingTrackId(track.id);
    } catch (err) {
      console.error("Audio playback error", err);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setPlayingTrackId(null);
  };

  const handleSave = async (track: GeneratedTrack) => {
    if (!user) return;
    try {
      const { id, ...trackData } = track;
      const newId = await trackService.saveTrack(trackData);
      if (newId) {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, id: newId } : t));
      }
    } catch (err) {
      setError("Failed to save track to gallery.");
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (deletingIds.has(id)) return;
    
    console.log('Attempting to delete track:', id);
    
    setDeletingIds(prev => new Set(prev).add(id));
    
    if (playingTrackId === id) handleStop();
    
    // If it's a temporary track, just remove from state
    if (id.startsWith('temp-')) {
      console.log('Deleting temporary track');
      setTracks(prev => prev.filter(t => t.id !== id));
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    try {
      console.log('Deleting track from Firestore:', id);
      await trackService.deleteTrack(id);
      setTracks(prev => prev.filter(t => t.id !== id));
      console.log('Track deleted successfully');
    } catch (err) {
      setError("Failed to delete track.");
      console.error('Deletion error:', err);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Generator & Visualizer */}
        <div className="lg:col-span-5 space-y-8">
          <section>
            <div className="mb-6">
              <h2 className="text-4xl font-bold tracking-tight mb-2">Compose <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Atmospheres</span></h2>
              <p className="text-yellow-200/60 text-lg">Define the soul of your sound and let the model weave the notes.</p>
            </div>
            
            <CreatorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-yellow-100/70">Live Waveform</span>
              </div>
              {playingTrackId && (
                <span className="text-[10px] font-mono text-yellow-400 animate-pulse">PLAYING: {tracks.find(t => t.id === playingTrackId)?.title}</span>
              )}
            </div>
            
            <Visualizer isPlaying={!!playingTrackId} />
            
            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-yellow-500/40 font-mono uppercase mb-1">Synthesizer</p>
                <p className="text-xs text-yellow-100/80 font-medium">Multi-Osc Poly</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] text-yellow-500/40 font-mono uppercase mb-1">Processing</p>
                <p className="text-xs text-yellow-100/80 font-medium">Reverb + Delay</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] text-yellow-500/40 font-mono uppercase mb-1">Quality</p>
                <p className="text-xs text-yellow-100/80 font-medium">24-bit PCM</p>
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
              <Headphones className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold tracking-tight">Your AI Gallery</h2>
              <span className="bg-white/5 border border-white/10 text-yellow-100/70 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">{tracks.length} Tracks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="col-span-full py-20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : !user ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl"
                >
                  <Sparkles className="w-8 h-8 text-yellow-500/30" />
                  <div>
                    <p className="text-yellow-200/60 font-medium text-lg">Sign in to save your tracks</p>
                    <p className="text-yellow-500/30 text-sm max-w-xs mt-1">Your generated music will be stored securely in your account.</p>
                  </div>
                </motion.div>
              ) : tracks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl"
                >
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <Music className="w-8 h-8 text-yellow-500/30" />
                  </div>
                  <div>
                    <p className="text-yellow-200/60 font-medium text-lg">Silence is waiting...</p>
                    <p className="text-yellow-500/30 text-sm max-w-xs mt-1">Change the settings on the left to start generating your first AI composition.</p>
                  </div>
                </motion.div>
              ) : (
                tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isPlaying={playingTrackId === track.id}
                    isDeleting={deletingIds.has(track.id)}
                    onPlay={handlePlay}
                    onStop={handleStop}
                    onDelete={(id, e) => handleDelete(id, e)}
                    onSave={track.id.startsWith('temp-') ? () => handleSave(track) : undefined}
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
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-spin-slow">
                <Music className="w-4 h-4 text-black" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-yellow-200/60 font-mono uppercase tracking-widest">Now Streaming</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{tracks.find(t => t.id === playingTrackId)?.title}</p>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleStop}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                title="Stop Playback"
              >
                <div className="w-3 h-3 bg-black rounded-sm" />
              </button>
            </div>
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

