import React from 'react';
import { SongSection, SectionType } from '../types';
import { Plus, X, ChevronUp, ChevronDown, Layout } from 'lucide-react';
import { motion, Reorder } from 'motion/react';

interface StructureEditorProps {
  sections: SongSection[];
  onChange: (sections: SongSection[]) => void;
}

const SECTION_OPTIONS: SectionType[] = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'];

const SECTION_COLORS: Record<SectionType, string> = {
  Intro: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  Verse: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  Chorus: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
  Bridge: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  Outro: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
};

export const StructureEditor: React.FC<StructureEditorProps> = ({ sections, onChange }) => {
  const addSection = (type: SectionType) => {
    const newSection: SongSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      durationBars: type === 'Intro' || type === 'Outro' ? 4 : 8,
    };
    onChange([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    onChange(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<SongSection>) => {
    onChange(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-yellow-200/60 uppercase tracking-widest flex items-center gap-2">
          <Layout className="w-3 h-3 text-yellow-400" />
          Song Structure Arrangement
        </label>
        <div className="flex gap-1">
          {SECTION_OPTIONS.map(options => (
            <button
              key={options}
              onClick={() => addSection(options)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase font-bold text-yellow-100/70 transition-colors flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5" />
              {options}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {sections.length === 0 ? (
          <div className="border-2 border-dashed border-white/5 rounded-2xl p-8 text-center bg-black/20">
            <p className="text-[10px] text-yellow-500/30 uppercase tracking-[0.2em]">No sections added yet</p>
            <p className="text-[9px] text-yellow-500/20 mt-2">Add sections above to guide the AI composer</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={sections} onReorder={onChange} className="space-y-2">
            {sections.map((section, index) => (
              <Reorder.Item 
                key={section.id} 
                value={section}
                className={`flex items-center gap-4 p-3 rounded-xl border backdrop-blur-sm cursor-grab active:cursor-grabbing group transition-all ${SECTION_COLORS[section.type]}`}
              >
                <div className="flex flex-col items-center justify-center text-yellow-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-current mb-0.5" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current mb-0.5" />
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{section.type}</span>
                    <button 
                      onClick={() => removeSection(section.id)}
                      className="text-yellow-500/30 hover:text-yellow-200/60 p-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/5 rounded-full h-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-current opacity-30" style={{ width: '100%' }} />
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-2 py-0.5 rounded text-[10px] font-mono">
                      <span>Bars:</span>
                      <input 
                        type="number"
                        min="2"
                        max="32"
                        value={section.durationBars}
                        onChange={(e) => updateSection(section.id, { durationBars: parseInt(e.target.value) || 4 })}
                        className="bg-transparent border-none w-8 text-white focus:outline-none focus:ring-0 text-center"
                      />
                    </div>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-yellow-500/30 uppercase tracking-widest px-1">
        <span>Total Bars: {sections.reduce((acc, s) => acc + s.durationBars, 0)}</span>
        <span>Est. Duration: {Math.round((sections.reduce((acc, s) => acc + s.durationBars, 0) * 4) / 120 * 60)}s (at 120 BPM)</span>
      </div>
    </div>
  );
};
