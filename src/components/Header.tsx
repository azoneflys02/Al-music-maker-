import React, { useState } from 'react';
import { Music, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { audioEngine } from '../lib/audioEngine';

export const Header: React.FC = () => {
  const [volume, setVolume] = useState(0.8);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
  };

  return (
    <header className="py-8 px-6 border-b border-white/10 flex items-center justify-between backdrop-blur-md sticky top-0 z-50 bg-black/50">
      <div className="flex items-center gap-3">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="p-2 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-xl"
        >
          <Music className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-white">AuraSynth <span className="text-purple-400">AI</span></h1>
          <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Generative Soundscape Engine</p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          {volume === 0 ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <span className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer">Archive</span>
        <span className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer">Synthesizers</span>
        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white font-medium">Pro Access</span>
        </button>
      </div>
    </header>
  );
};
