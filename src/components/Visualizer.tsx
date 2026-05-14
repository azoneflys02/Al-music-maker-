import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../lib/audioEngine';

interface VisualizerProps {
  isPlaying: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  hue: number;
  alpha: number;
  life: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(null);
  const [mode, setMode] = useState<'spectrum' | 'waveform' | 'particles' | 'radial'>('spectrum');

  // Particle system state
  const particles = useRef<Particle[]>([]);
  const lastIntensity = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    // Create initial background particles
    const createParticle = (burst = false, intensity = 0) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? (Math.random() * 5 + 2) * (1 + intensity) : Math.random() * 1 + 0.5;
      
      return {
        x: burst ? canvas.width / 2 : Math.random() * canvas.width,
        y: burst ? canvas.height / 2 : Math.random() * canvas.height,
        size: Math.random() * (burst ? 3 : 2) + 1,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        hue: burst ? (260 + Math.random() * 60) : Math.random() * 360,
        alpha: burst ? 1 : 0.5,
        life: burst ? 1 : -1 // -1 means infinite until screen exit
      };
    };

    if (particles.current.length === 0) {
      for (let i = 0; i < 60; i++) {
        particles.current.push(createParticle());
      }
    }

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const analyser = audioEngine.getAnalyser();
      const values = analyser.getValue() as Float32Array;
      const avgIntensity = Array.from(values).reduce((a, b) => a + (b + 100) / 100, 0) / values.length;

      // Detect "beats" (sudden intensity jumps)
      if (isPlaying && avgIntensity > lastIntensity.current + 0.1 && avgIntensity > 0.4) {
        // Create a burst
        for (let i = 0; i < 15; i++) {
          particles.current.push(createParticle(true, avgIntensity));
        }
      }
      lastIntensity.current = avgIntensity;

      // Clear/Fade
      ctx.fillStyle = isPlaying ? 'rgba(10, 10, 18, 0.2)' : 'rgb(10, 10, 18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying) {
        const midY = canvas.height / 2;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(canvas.width, midY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        return;
      }

      if (mode === 'spectrum') {
        const count = Math.min(values.length / 2, 128);
        const barWidth = (canvas.width / count);
        let x = 0;

        for (let i = 0; i < count; i++) {
          const val = values[i];
          const normalized = Math.max(0, (val + 100) / 100);
          const barHeight = normalized * canvas.height * 0.9;
          const hue = 260 + (i / count) * 60;
          
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${0.2 + normalized * 0.8})`;
          
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - barHeight, barWidth - 1, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          }
          x += barWidth;
        }
      } else if (mode === 'radial') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.4;
        const count = Math.min(values.length / 2, 128);

        for (let i = 0; i < count; i++) {
          const val = values[i];
          const normalized = Math.max(0, (val + 100) / 100);
          const barHeight = normalized * radius * 1.5;
          const angle = (i / count) * Math.PI * 2;
          
          const startX = centerX + Math.cos(angle) * radius;
          const startY = centerY + Math.sin(angle) * radius;
          const endX = centerX + Math.cos(angle) * (radius + barHeight);
          const endY = centerY + Math.sin(angle) * (radius + barHeight);

          const hue = 260 + (i / count) * 60;
          ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${0.3 + normalized * 0.7})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        // Inner Glow Circle
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `hsla(260, 70%, 60%, ${0.2 * avgIntensity})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

      } else if (mode === 'waveform') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#8b5cf6';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8b5cf6';
        const sliceWidth = canvas.width / values.length;
        let x = 0;

        for (let i = 0; i < values.length; i++) {
          const val = values[i];
          const normalized = (val + 100) / 100;
          const y = (normalized * canvas.height) / 2 + canvas.height / 4;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Process particles
      particles.current = particles.current.filter(p => {
        p.x += p.speedX * (1 + avgIntensity * 2);
        p.y += p.speedY * (1 + avgIntensity * 2);
        
        if (p.life > 0) {
          p.life -= 0.01;
          p.alpha = p.life;
        }

        // Screen wrap or delete
        if (p.life < 0) {
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;
          return true;
        }

        return p.life > 0;
      });

      // Render Particles
      particles.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + Math.max(0, avgIntensity - 0.5) * 4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha * (0.2 + avgIntensity * 0.8)})`;
        ctx.fill();

        if (mode === 'particles' && avgIntensity > 0.5) {
          ctx.shadowBlur = avgIntensity * 25;
          ctx.shadowColor = `hsla(${p.hue}, 70%, 60%, 0.5)`;
        }
      });
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, mode]);

  return (
    <div ref={containerRef} className="w-full h-52 relative group bg-black/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent pointer-events-none" />
      
      {/* Mode Controls */}
      <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {(['spectrum', 'radial', 'waveform', 'particles'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-[10px] font-mono rounded-lg border transition-all uppercase tracking-wider ${
              mode === m 
                ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' 
                : 'bg-white/5 border-white/10 text-yellow-500/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <canvas 
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Music Sync Signal */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isPlaying ? 'bg-purple-400 animate-pulse shadow-[0_0_10px_#a855f7]' : 'bg-white/10'}`} />
        <span className="text-[10px] font-mono text-yellow-500/30 uppercase tracking-widest">Signal Sync</span>
      </div>
    </div>
  );
};
