import React, { useState } from 'react';
import { Settings, X, SlidersHorizontal, Waves, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine, AudioQuality } from '../lib/audioEngine';

export const AudioSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [quality, setQuality] = useState<AudioQuality>('Medium');
  const [sampleRate, setSampleRate] = useState(44100);

  const handleQualityChange = (q: AudioQuality) => {
    setQuality(q);
    audioEngine.setQuality(q);
  };

  const handleSampleRateChange = (sr: number) => {
    setSampleRate(sr);
    // Note: Sample rate change in Tone.js usually requires a full context restart,
    // so we mostly use this for offline rendering or future init calls.
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-yellow-100/70 hover:text-white"
        title="Audio Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setIsOpen(false)} className="text-yellow-500/50 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Engine Settings</h2>
                <p className="text-yellow-200/60 text-sm">Fine-tune the synthesis engine performance and fidelity.</p>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-yellow-100/70">Synthesis Quality</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Low', 'Medium', 'High'] as AudioQuality[]).map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQualityChange(q)}
                        className={`py-3 rounded-xl border transition-all text-sm font-medium ${
                          quality === q 
                            ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                            : 'bg-white/5 border-white/5 text-yellow-500/50 hover:bg-white/10'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-yellow-500/30 italic">
                    {quality === 'Low' && "Optimized for performance. Simple oscillators and short reverb."}
                    {quality === 'Medium' && "Balanced fidelity. Sawtooth oscillators and standard reverb."}
                    {quality === 'High' && "Maximum depth. Fat multi-voice oscillators and long decay reverb."}
                  </p>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Waves className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-yellow-100/70">Sample Rate (Export)</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[44100, 48000].map((sr) => (
                      <button
                        key={sr}
                        onClick={() => handleSampleRateChange(sr)}
                        className={`py-3 rounded-xl border transition-all text-sm font-medium ${
                          sampleRate === sr 
                            ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-white/5 border-white/5 text-yellow-500/50 hover:bg-white/10'
                        }`}
                      >
                        {sr / 1000} kHz
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-yellow-500/30">
                    Determines the resolution of offline renders and exports.
                  </p>
                </section>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
