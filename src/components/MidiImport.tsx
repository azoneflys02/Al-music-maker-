import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileMusic, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';
import { Note } from '../types';
import { motion } from 'motion/react';

interface MidiImportProps {
  onMidiParsed: (data: { melody: Note[], bassline: Note[], chords: Note[], drums: Note[], bpm: number, fileName: string }) => void;
  currentFile?: string | null;
}

export const MidiImport: React.FC<MidiImportProps> = ({ onMidiParsed, currentFile }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const reader = new FileReader();
    
    reader.onload = async () => {
      if (reader.result instanceof ArrayBuffer) {
        try {
          const result = await audioEngine.parseMidi(reader.result);
          onMidiParsed({ ...result, fileName: file.name });
        } catch (err) {
          console.error("Failed to parse MIDI", err);
        }
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [onMidiParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/midi': ['.mid', '.midi'] },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
        isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 bg-black/20'
      } ${currentFile ? 'border-green-500/50 bg-green-500/5' : ''}`}
    >
      <input {...getInputProps()} />
      
      {currentFile ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-green-400 uppercase tracking-widest">MIDI Loaded</p>
            <p className="text-[10px] text-yellow-500/50 mt-1 truncate max-w-[200px]">{currentFile}</p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            {isDragActive ? <Upload className="w-5 h-5 text-purple-400" /> : <FileMusic className="w-5 h-5 text-yellow-500/50" />}
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-yellow-200/60">
              {isDragActive ? "Drop MIDI" : "Import MIDI"}
            </p>
            <p className="text-[10px] text-yellow-500/30 mt-1">Use as composition seed</p>
          </div>
        </>
      )}
    </div>
  );
};
