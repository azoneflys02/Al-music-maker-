import React, { useState, useEffect } from 'react';
import { Music, Sparkles, Volume2, VolumeX, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { audioEngine } from '../lib/audioEngine';
import { auth } from '../lib/firebase';
import { AudioSettings } from './AudioSettings';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export const Header: React.FC = () => {
  const [volume, setVolume] = useState(0.8);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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
          <p className="text-xs text-yellow-200/60 font-mono tracking-widest uppercase">Generative Soundscape Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          {volume === 0 ? <VolumeX className="w-4 h-4 text-yellow-500" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
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

        <AudioSettings />

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-white font-medium">{user.displayName}</span>
              <span className="text-[10px] text-yellow-500/50 font-mono">{user.email}</span>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <UserIcon className="w-4 h-4 text-yellow-500" />
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 text-yellow-500/50 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-full transition-all text-sm font-bold shadow-lg shadow-indigo-500/20"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}

        <button className="hidden lg:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white font-medium">Pro Access</span>
        </button>
      </div>
    </header>
  );
};
