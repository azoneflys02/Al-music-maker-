import React, { useState, useRef } from 'react';
import { Upload, X, FileMusic, Loader2, Music, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TrainingExample {
  id: string;
  fileName: string;
  fileType: string;
  description?: string;
  data?: string; // base64
}

interface TrainingGalleryProps {
  examples: TrainingExample[];
  onAdd: (example: TrainingExample) => void;
  onRemove: (id: string) => void;
}

export const TrainingGallery: React.FC<TrainingGalleryProps> = ({ examples, onAdd, onRemove }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/midi', 'audio/x-midi', 'audio/mid', 'audio/webm', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.mid') && !file.name.endsWith('.midi')) {
      alert("Please upload a valid audio or MIDI file.");
      return;
    }

    // Limit size
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    await processFile(file);
  };

  const processFile = async (file: File | Blob, customName?: string) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const newExample: TrainingExample = {
          id: crypto.randomUUID(),
          fileName: customName || (file instanceof File ? file.name : `voice-recording-${Date.now()}.webm`),
          fileType: file.type || 'audio/mpeg',
          data: base64Data.split(',')[1] // Just the B64 part
        };
        onAdd(newExample);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed", error);
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processFile(audioBlob, `Voice Note ${new Date().toLocaleTimeString()}`);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Could not start recording", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {examples.map((example) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-2 px-3 flex items-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <FileMusic className="w-4 h-4 text-yellow-500/60" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-white/80 font-medium truncate max-w-[120px]">{example.fileName}</span>
                <span className="text-[8px] text-yellow-200/30 uppercase font-mono tracking-tighter">Training Example</span>
              </div>
              <button 
                onClick={() => onRemove(example.id)}
                className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-500/40 hover:text-rose-400 transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isRecording}
          className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-yellow-500/30 hover:bg-white/10 transition-all group min-w-[100px]"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
          ) : (
            <>
              <div className="p-2 bg-yellow-500/10 rounded-full group-hover:bg-yellow-500/20 transition-colors">
                <Upload className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="text-[10px] font-mono text-yellow-200/40 uppercase tracking-tighter">Add Example</span>
            </>
          )}
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
          className={`bg-white/5 border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group min-w-[100px] ${
            isRecording 
              ? 'border-red-500/50 bg-red-500/10 animate-pulse' 
              : 'border-white/20 hover:border-purple-500/30 hover:bg-white/10'
          }`}
        >
          <div className={`p-2 rounded-full transition-colors ${
            isRecording ? 'bg-red-500/20' : 'bg-purple-500/10 group-hover:bg-purple-500/20'
          }`}>
            {isRecording ? (
              <Square className="w-4 h-4 text-red-500 fill-red-500" />
            ) : (
              <Mic className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-tighter ${
            isRecording ? 'text-red-400' : 'text-purple-300/40'
          }`}>
            {isRecording ? 'Stop Voice' : 'Train by Voice'}
          </span>
        </button>

        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".mp3,.wav,.mid,.midi"
        />
      </div>

      {examples.length === 0 && !isUploading && !isRecording && (
        <div className="text-center py-4 px-6 rounded-2xl bg-black/20 border border-white/5">
          <Music className="w-6 h-6 text-yellow-500/10 mx-auto mb-2" />
          <p className="text-[10px] text-yellow-200/20 font-mono uppercase tracking-widest leading-relaxed">
            Upload sound files or record your voice.<br />The AI will analyze their style to inspire generation.
          </p>
        </div>
      )}
    </div>
  );
};
