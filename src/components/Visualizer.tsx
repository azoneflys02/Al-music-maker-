import React from 'react';
import { motion } from 'motion/react';

interface VisualizerProps {
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const bars = Array.from({ length: 48 });

  return (
    <div className="w-full h-32 flex items-end justify-center gap-1 overflow-hidden px-4">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={isPlaying ? {
            height: [
              Math.random() * 20 + 20 + '%',
              Math.random() * 60 + 40 + '%',
              Math.random() * 30 + 10 + '%'
            ],
            opacity: [0.3, 0.8, 0.3],
            backgroundColor: i % 2 === 0 ? '#8b5cf6' : '#6366f1'
          } : {
            height: '10%',
            opacity: 0.1,
            backgroundColor: '#ffffff'
          }}
          transition={{
            duration: Math.random() * 0.5 + 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "easeInOut"
          }}
          className="flex-1 min-w-[2px] max-w-[6px] rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        />
      ))}
    </div>
  );
};
