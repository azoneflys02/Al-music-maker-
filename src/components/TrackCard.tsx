import React, { useState } from 'react';
import { GeneratedTrack } from '../types';
import { Play, Pause, Trash2, Clock, Music2, Type, Cloud, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../lib/audioEngine';

interface TrackCardProps {
  track: GeneratedTrack;
  isPlaying: boolean;
  isDeleting?: boolean;
  onPlay: (track: GeneratedTrack) => void;
  onStop: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onSave?: () => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, isPlaying, isDeleting, onPlay, onStop, onDelete, onSave }) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isPlaying) {
      audioEngine.setVolume(newVol);
    }
  };

  const handlePlay = () => {
    audioEngine.setVolume(volume);
    onPlay(track);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative p-6 rounded-3xl border transition-all duration-500 overflow-hidden ${
        isPlaying 
          ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/50 shadow-2xl shadow-purple-900/20' 
          : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
      }`}
    >
      {/* Decorative pulse when playing */}
      {isPlaying && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-indigo-500/20 blur-[100px] rounded-full" />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border transition-colors ${
              isPlaying ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/5 text-yellow-500/50 border-white/10'
            }`}>
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight group-hover:text-purple-300 transition-colors">{track.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400/80 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">{track.genre}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400/80 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">{track.mood}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onSave && (
              <button 
                onClick={onSave}
                className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all animate-pulse"
                title="Save to Gallery"
              >
                <Cloud className="w-4 h-4" />
              </button>
            )}
            {track.lyrics && (
              <button 
                onClick={() => setShowLyrics(!showLyrics)}
                title="View Lyrics"
                className={`p-2 rounded-lg transition-all ${
                  showLyrics ? 'bg-purple-500 text-white shadow-lg shadow-purple-900/40' : 'text-yellow-500/30 hover:text-white hover:bg-white/5'
                }`}
              >
                <Type className="w-4 h-4" />
              </button>
            )}
            <button 
              disabled={isDeleting}
              onClick={(e) => onDelete(track.id, e)}
              className="p-2 text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all active:scale-90 disabled:opacity-50"
              title="Delete Track"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showLyrics ? (
            <motion.div
              key="lyrics"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-black/30 rounded-2xl p-4 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap italic font-serif">
                  {track.lyrics}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.p 
              key="desc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-yellow-100/70 text-sm mb-6 line-clamp-2 grow font-light"
            >
              {track.description}
            </motion.p>
          )}
        </AnimatePresence>

        {track.structure && track.structure.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
              {track.structure.map((section, idx) => (
                <div 
                  key={`${section.id}-${idx}`}
                  className="flex-shrink-0"
                  style={{ width: `${Math.max(40, section.durationBars * 10)}px` }}
                >
                  <div className={`h-6 rounded-md border flex items-center justify-center text-[8px] font-bold uppercase tracking-tighter transition-all ${
                    section.type === 'Intro' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' :
                    section.type === 'Verse' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                    section.type === 'Chorus' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' :
                    section.type === 'Bridge' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' :
                    'border-rose-500/50 bg-rose-500/10 text-rose-400'
                  }`}>
                    {section.type.slice(0, 3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-4 text-xs font-mono text-yellow-200/60">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-500/50" />
              <span>{Math.round(track.bpm)} BPM</span>
            </div>
            {track.targetDuration && (
              <span>{Math.floor(track.targetDuration / 60)}:{(track.targetDuration % 60).toString().padStart(2, '0')}</span>
            )}
            <span>{new Date(track.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-6 grow-0 shrink-0">
            {isPlaying && (
              <div className="flex items-center gap-3 bg-black/20 rounded-full px-4 py-2 border border-white/5">
                <Music2 className="w-3 h-3 text-yellow-500/50" />
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-purple-400"
                />
              </div>
            )}
            <button
              onClick={() => isPlaying ? onStop() : handlePlay()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform ${
              isPlaying 
                ? 'bg-white text-black scale-110 shadow-lg' 
                : 'bg-indigo-600 text-white hover:scale-105 hover:bg-indigo-500'
            }`}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
  );
};
