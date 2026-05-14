import React, { useState } from 'react';
import { GeneratedTrack } from '../types';
import { Play, Pause, Trash2, Clock, Music2, Download, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { audioEngine } from '../lib/audioEngine';

interface TrackCardProps {
  track: GeneratedTrack;
  isPlaying: boolean;
  onPlay: (track: GeneratedTrack) => void;
  onStop: () => void;
  onDelete: (id: string) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, isPlaying, onPlay, onStop, onDelete }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async (format: 'wav' | 'mp3') => {
    setIsExporting(true);
    try {
      // 1. Render to buffer
      const buffer = await audioEngine.renderTrack(track);
      // 2. Convert to blob based on format
      const blob = format === 'mp3' 
        ? audioEngine.bufferToMp3(buffer) 
        : audioEngine.bufferToWav(buffer);
      // 3. Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title.replace(/\s+/g, '_')}_AuraSynth.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
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
              isPlaying ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/5 text-white/40 border-white/10'
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
            <button 
              disabled={isExporting}
              onClick={() => handleDownload('mp3')}
              title="Download as MP3"
              className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" /> : <Download className="w-3 h-3" />}
              <span className="text-[10px] font-mono">MP3</span>
            </button>
            <button 
              disabled={isExporting}
              onClick={() => handleDownload('wav')}
              title="Download as WAV"
              className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <span className="text-[10px] font-mono">WAV</span>
            </button>
            <button 
              onClick={() => onDelete(track.id)}
              className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-6 line-clamp-2 grow font-light">{track.description}</p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-4 text-xs font-mono text-white/40">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.round(track.bpm)} BPM</span>
            </div>
            <span>{new Date(track.createdAt).toLocaleDateString()}</span>
          </div>

          <button
            onClick={() => isPlaying ? onStop() : onPlay(track)}
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
    </motion.div>
  );
};
