import * as Tone from 'tone';
import { GeneratedTrack, Note } from '../types';
import * as lamejs from 'lamejs';
import MidiWriter from 'midi-writer-js';
import { Midi } from '@tonejs/midi';

export type AudioQuality = 'Low' | 'Medium' | 'High';

class AudioEngine {
  private melodySynth: any;
  private bassSynth: any;
  private chordSynth: any;
  private kickSynth: any;
  private snareSynth: any;
  private hihatSynth: any;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private isInitialized = false;
  private analyser: Tone.Analyser;
  private phaser: Tone.Phaser;
  private tremolo: Tone.Tremolo;
  private distortion: Tone.Distortion;
  private quality: AudioQuality = 'Medium';

  constructor() {
    this.analyser = new Tone.Analyser("fft", 1024);
    this.reverb = new Tone.Reverb(2).connect(this.analyser);
    this.analyser.toDestination();
    
    this.delay = new Tone.FeedbackDelay("8n", 0.5).connect(this.reverb);
    
    this.phaser = new Tone.Phaser({ frequency: 15, octaves: 5, baseFrequency: 1000 }).connect(this.reverb);
    this.tremolo = new Tone.Tremolo(9, 0.75).connect(this.reverb).start();
    this.distortion = new Tone.Distortion(0.4).connect(this.reverb);

    this.melodySynth = new Tone.PolySynth(Tone.Synth).connect(this.delay);
    this.chordSynth = new Tone.PolySynth(Tone.Synth).connect(this.reverb);
    this.bassSynth = new Tone.PolySynth(Tone.MonoSynth as any).connect(this.reverb);

    // Drum Synths - using PolySynth wrapper to avoid "Start time must be strictly greater than previous" errors
    // when multiple hits occur at the exact same time
    this.kickSynth = new Tone.PolySynth(Tone.MembraneSynth).connect(this.reverb);
    this.snareSynth = new Tone.NoiseSynth({
      volume: -10,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).connect(this.reverb);
    this.hihatSynth = new Tone.PolySynth(Tone.MetalSynth).connect(this.reverb);
  }

  private configureInstruments(instruments: string[]) {
    // Model Melody Synth
    const melody = instruments[0]?.toLowerCase() || '';
    if (melody.includes('piano') || melody.includes('rhodes') || melody.includes('wurlitzer')) {
      this.melodySynth.set({ envelope: { attack: 0.01, decay: 1, sustain: 0.3, release: 1 }, oscillator: { type: 'sine' as any } });
    } else if (melody.includes('trumpet') || melody.includes('brass') || melody.includes('sax')) {
      this.melodySynth.set({ envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.1 }, oscillator: { type: 'sawtooth' as any } });
    } else if (melody.includes('guitar') || melody.includes('pluck')) {
      this.melodySynth.set({ envelope: { attack: 0.02, decay: 0.5, sustain: 0.1, release: 0.5 }, oscillator: { type: 'triangle' as any } });
    } else if (melody.includes('violin') || melody.includes('strings') || melody.includes('pad')) {
      this.melodySynth.set({ envelope: { attack: 0.4, decay: 1, sustain: 0.8, release: 1 }, oscillator: { type: 'sawtooth' as any } });
    } else if (melody.includes('square') || melody.includes('chip') || melody.includes('8-bit')) {
      this.melodySynth.set({ envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.1 }, oscillator: { type: 'square' as any } });
    } else if (melody.includes('moog') || melody.includes('lead')) {
      this.melodySynth.set({ envelope: { attack: 0.05, decay: 0.5, sustain: 0.7, release: 0.2 }, oscillator: { type: 'sawtooth' as any } });
    }

    // Model Bass Synth
    const bass = instruments[1]?.toLowerCase() || '';
    if (bass.includes('sub') || bass.includes('808') || bass.includes('boom')) {
      this.bassSynth.set({ oscillator: { type: 'sine' }, envelope: { attack: 0.1, release: 1.5 } });
    } else if (bass.includes('acid') || bass.includes('growl') || bass.includes('reese')) {
      this.bassSynth.set({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, release: 0.5 } });
    } else if (bass.includes('electric') || bass.includes('slap') || bass.includes('walking') || bass.includes('fretless')) {
      this.bassSynth.set({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, release: 0.8 } });
    }

    // Model Chord Synth
    const chord = instruments[2]?.toLowerCase() || '';
    if (chord.includes('piano') || chord.includes('rhodes') || chord.includes('wurlitzer')) {
      this.chordSynth.set({ envelope: { attack: 0.01, decay: 2, sustain: 0.2, release: 1.5 }, oscillator: { type: 'sine' as any } });
    } else if (chord.includes('guitar')) {
      this.chordSynth.set({ envelope: { attack: 0.05, decay: 1, sustain: 0, release: 0.5 }, oscillator: { type: 'triangle' as any } });
    } else if (chord.includes('organ')) {
      this.chordSynth.set({ envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.1 }, oscillator: { type: 'square' as any } });
    } else if (chord.includes('pad') || chord.includes('strings')) {
      this.chordSynth.set({ envelope: { attack: 0.8, decay: 1, sustain: 0.8, release: 2 }, oscillator: { type: 'sine' as any } });
    }
  }

  setQuality(quality: AudioQuality) {
    this.quality = quality;
    this.applyQualitySettings();
  }

  private applyQualitySettings() {
    switch (this.quality) {
      case 'Low':
        this.distortion.oversample = 'none';
        this.reverb.decay = 1.5;
        this.melodySynth.set({ oscillator: { type: 'triangle' } });
        this.chordSynth.set({ oscillator: { type: 'sine' } });
        break;
      case 'Medium':
        this.distortion.oversample = '2x';
        this.reverb.decay = 2.5;
        this.melodySynth.set({ oscillator: { type: 'sawtooth' } });
        this.chordSynth.set({ oscillator: { type: 'triangle' } });
        break;
      case 'High':
        this.distortion.oversample = '4x';
        this.reverb.decay = 4;
        this.melodySynth.set({ oscillator: { type: 'fatsawtooth', count: 3, spread: 30 } });
        this.chordSynth.set({ oscillator: { type: 'fatsquare', count: 3, spread: 20 } });
        break;
    }
  }

  async init(sampleRate?: number) {
    if (this.isInitialized) return;
    if (sampleRate && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      Tone.setContext(new Tone.Context(new AudioCtx({ sampleRate })));
    }
    await Tone.start();
    this.isInitialized = true;
    this.applyQualitySettings();
    console.log("Audio Context Started with Sample Rate:", Tone.getContext().sampleRate);
  }

  getAnalyser() {
    return this.analyser;
  }

  calculateTrackDuration(track: GeneratedTrack): number {
    const prevBpm = Tone.Transport.bpm.value;
    Tone.Transport.bpm.value = track.bpm;
    
    let maxSeconds = 0;
    const allNotes = [
      ...track.melody, 
      ...track.bassline, 
      ...track.chords, 
      ...(track.drums || [])
    ];
    
    allNotes.forEach(note => {
      try {
        const time = Tone.Time(note.time).toSeconds();
        const duration = Tone.Time(note.duration).toSeconds();
        if (time + duration > maxSeconds) {
          maxSeconds = time + duration;
        }
      } catch (e) {
        // ignore invalid notes
      }
    });
    
    Tone.Transport.bpm.value = prevBpm;
    return Math.ceil(maxSeconds);
  }

  playTrack(track: GeneratedTrack, onFinished?: () => void) {
    this.stop();
    
    Tone.Transport.bpm.value = track.bpm;
    this.configureInstruments(track.instruments);

    // Apply genre-specific effects
    this.melodySynth.disconnect();
    this.melodySynth.connect(this.delay); // default

    if (track.genre === 'Cyberpunk') {
      this.melodySynth.connect(this.phaser);
    } else if (track.genre === 'Lo-fi') {
      this.melodySynth.connect(this.tremolo);
    } else if (track.genre === 'Rock') {
      this.melodySynth.connect(this.distortion);
    }

    const playNotes = (notes: Note[], synth: any) => {
      new Tone.Part((time, note) => {
        synth.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
      }, notes.map(n => ({ time: n.time, pitch: n.pitch, duration: n.duration, velocity: n.velocity }))).start(0);
    };

    const playDrums = (notes: Note[]) => {
      new Tone.Part((time, note) => {
        const p = note.pitch.toUpperCase();
        if (p === 'C1') this.kickSynth.triggerAttackRelease("C1", "16n", time, note.velocity);
        else if (p === 'D1') this.snareSynth.triggerAttackRelease("16n", time, note.velocity);
        else if (p === 'F#1' || p === 'G#1') this.hihatSynth.triggerAttackRelease("C3", "32n", time, note.velocity);
      }, notes.map(n => ({ time: n.time, pitch: n.pitch, duration: n.duration, velocity: n.velocity }))).start(0);
    };

    playNotes(track.melody, this.melodySynth);
    playNotes(track.bassline, this.bassSynth);
    playNotes(track.chords, this.chordSynth);
    if (track.drums) playDrums(track.drums);

    // Schedule automatic stop
    const duration = this.calculateTrackDuration(track);
    Tone.Transport.scheduleOnce((time) => {
      Tone.Draw.schedule(() => {
        if (onFinished) onFinished();
        this.stop();
      }, time);
    }, duration + 0.5);

    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }

  setVolume(value: number) {
    // Value expected 0 to 1
    // Map to decibels (0 -> -60dB (silence), 1 -> 0dB)
    const db = value === 0 ? -Infinity : 20 * Math.log10(value);
    Tone.getDestination().volume.rampTo(db, 0.1);
  }

  /**
   * Renders the track to an AudioBuffer using Tone.Offline
   */
  async renderTrack(track: GeneratedTrack, sampleRate: number = 44100): Promise<AudioBuffer> {
    const MAX_DURATION = 300; // 5 minutes limit
    // Use targetDuration if available, otherwise estimate
    let duration = track.targetDuration || (60 / track.bpm) * 4 * 16; 
    
    // Safety cap
    if (duration > MAX_DURATION) duration = MAX_DURATION;
    if (duration < 5) duration = 5; // Minimum 5s for safety

    const toneBuffer = await Tone.Offline(({ transport }) => {
      transport.bpm.value = track.bpm;
      
      const offlineReverb = new Tone.Reverb(this.quality === 'High' ? 4 : (this.quality === 'Medium' ? 2.5 : 1.5)).toDestination();
      const offlineDelay = new Tone.FeedbackDelay("8n", 0.5).connect(offlineReverb);
      
      const oscTypeMelody = this.quality === 'High' ? 'fatsawtooth' : (this.quality === 'Medium' ? 'sawtooth' : 'triangle');
      const oscTypeChord = this.quality === 'High' ? 'fatsquare' : (this.quality === 'Medium' ? 'triangle' : 'sine');

      const offlineMelody = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscTypeMelody as any }
      }).connect(offlineDelay);
      
      const offlineChord = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: oscTypeChord as any }
      }).connect(offlineReverb);

      const offlineBass = new Tone.MonoSynth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, release: 1 }
      }).connect(offlineReverb);

      // Offline Drums
      const offlineKick = new Tone.PolySynth(Tone.MembraneSynth).connect(offlineReverb);
      const offlineSnare = new Tone.NoiseSynth({ volume: -10, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(offlineReverb);
      const offlineHihat = new Tone.PolySynth(Tone.MetalSynth).connect(offlineReverb);

      // Model Offline Instruments
      const melody = track.instruments[0]?.toLowerCase() || '';
      if (melody.includes('piano') || melody.includes('rhodes') || melody.includes('wurlitzer')) {
        offlineMelody.set({ envelope: { attack: 0.01, decay: 1, sustain: 0.3, release: 1 } });
      } else if (melody.includes('trumpet') || melody.includes('brass') || melody.includes('sax')) {
        offlineMelody.set({ envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.1 } });
      } else if (melody.includes('guitar') || melody.includes('pluck')) {
        offlineMelody.set({ envelope: { attack: 0.02, decay: 0.5, sustain: 0.1, release: 0.5 } });
      } else if (melody.includes('violin') || melody.includes('strings') || melody.includes('pad')) {
        offlineMelody.set({ envelope: { attack: 0.4, decay: 1, sustain: 0.8, release: 1 } });
      }

      const bass = track.instruments[1]?.toLowerCase() || '';
      if (bass.includes('sub') || bass.includes('808') || bass.includes('boom')) {
        offlineBass.set({ oscillator: { type: 'sine' }, envelope: { attack: 0.1, release: 1.5 } });
      } else if (bass.includes('acid') || bass.includes('growl') || bass.includes('reese')) {
        offlineBass.set({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, release: 0.5 } });
      }

      const chord = track.instruments[2]?.toLowerCase() || '';
      if (chord.includes('piano') || chord.includes('rhodes') || chord.includes('wurlitzer')) {
        offlineChord.set({ envelope: { attack: 0.01, decay: 2, sustain: 0.2, release: 1.5 } });
      } else if (chord.includes('pad') || chord.includes('strings')) {
        offlineChord.set({ envelope: { attack: 0.8, decay: 1, sustain: 0.8, release: 2 } });
      }

      const scheduleNotes = (notes: Note[], synth: any) => {
        notes.forEach(note => {
          synth.triggerAttackRelease(note.pitch, note.duration, note.time, note.velocity);
        });
      };

      const scheduleDrums = (notes: Note[]) => {
        notes.forEach(note => {
          const p = note.pitch.toUpperCase();
          if (p === 'C1') offlineKick.triggerAttackRelease("C1", "16n", note.time, note.velocity);
          else if (p === 'D1') offlineSnare.triggerAttackRelease("16n", note.time, note.velocity);
          else if (p === 'F#1' || p === 'G#1') offlineHihat.triggerAttackRelease("C3", "32n", note.time, note.velocity);
        });
      };

      scheduleNotes(track.melody, offlineMelody);
      scheduleNotes(track.bassline, offlineBass);
      scheduleNotes(track.chords, offlineChord);
      if (track.drums) scheduleDrums(track.drums);

      transport.start(0);
    }, duration, 2, sampleRate);

    return toneBuffer.get() as AudioBuffer;
  }

  /**
   * Encodes an AudioBuffer to a WAV blob
   */
  bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // write 16-bit sample
            pos += 2;
        }
        offset++;                                     // next sample index
    }

    return new Blob([bufferArray], { type: "audio/wav" });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
  }

  /**
   * Encodes an AudioBuffer to an MP3 blob
   */
  bufferToMp3(buffer: AudioBuffer): Blob {
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const kbps = 128;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Data = [];

    const left = this.floatTo16BitInt(buffer.getChannelData(0));
    const right = channels > 1 ? this.floatTo16BitInt(buffer.getChannelData(1)) : left;

    const sampleBlockSize = 1152;
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  }

  private floatTo16BitInt(samples: Float32Array): Int16Array {
    const buffer = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buffer;
  }

  /**
   * Parses a MIDI file into Note arrays
   */
  async parseMidi(arrayBuffer: ArrayBuffer): Promise<{ melody: Note[], bassline: Note[], chords: Note[], drums: Note[], bpm: number }> {
    const midi = new Midi(arrayBuffer);
    const bpm = Math.round(midi.header.tempos[0]?.bpm || 120);

    const translateTrack = (track: any): Note[] => {
      return track.notes.map((n: any) => ({
        pitch: n.name,
        time: Tone.Time(n.time).toBarsBeatsSixteenths(),
        duration: n.durationTicks + 'i', // Using ticks for precise duration
        velocity: n.velocity
      }));
    };

    // Heuristics or simple mapping
    // We'll try to find tracks by name first, otherwise use indices
    const findTrack = (nameRegex: RegExp, index: number) => {
      const track = midi.tracks.find(t => nameRegex.test(t.name.toLowerCase()));
      return track || midi.tracks[index];
    };

    return {
      melody: translateTrack(findTrack(/melody|lead|solo/i, 0) || { notes: [] }),
      bassline: translateTrack(findTrack(/bass/i, 1) || { notes: [] }),
      chords: translateTrack(findTrack(/chord|pad|harmony/i, 2) || { notes: [] }),
      drums: translateTrack(midi.tracks.find(t => t.instrument.family === 'drums' || /drum|percussion/i.test(t.name)) || { notes: [] }),
      bpm
    };
  }

  /**
   * Generates a MIDI file from the track data
   */
  generateMidi(track: GeneratedTrack): Blob {
    const tracks = [];

    const createMidiTrack = (notes: Note[], name: string) => {
      const midiTrack = new MidiWriter.Track();
      midiTrack.setTempo(track.bpm);
      midiTrack.addTrackName(name);

      notes.forEach(note => {
        // Convert Tone.js time (m:b:s) to ticks if possible, 
        // but MidiWriter often handles duration/wait as strings or numbers.
        // Simplified approach: use the note data to create MIDI events.
        // Tone.js duration '4n' = 128 ticks usually, but MidiWriter likes its own formats.
        
        const pitch = note.pitch.replace('#', 's'); // MidiWriter uses 'Cs4' instead of 'C#4'
        
        midiTrack.addEvent(new MidiWriter.NoteEvent({
          pitch: [pitch],
          duration: note.duration.replace('n', ''), // '4n' -> '4'
          startTick: this.timeToTicks(note.time, track.bpm),
          velocity: Math.floor(note.velocity * 100)
        }));
      });

      return midiTrack;
    };

    tracks.push(createMidiTrack(track.melody, 'Melody'));
    tracks.push(createMidiTrack(track.bassline, 'Bass'));
    tracks.push(createMidiTrack(track.chords, 'Chords'));

    const write = new MidiWriter.Writer(tracks);
    const uint8Array = write.buildFile();
    return new Blob([uint8Array], { type: 'audio/midi' });
  }

  private timeToTicks(time: string, bpm: number): number {
    // Basic conversion for Tone.js "m:b:s" to ticks (assuming 128 ticks per quarter note)
    const [m, b, s] = time.split(':').map(Number);
    const ticksPerBeat = 128;
    const beatsPerMeasure = 4;
    
    const totalBeats = (m * beatsPerMeasure) + b + (s / 4);
    return totalBeats * ticksPerBeat;
  }

  get state() {
    return Tone.Transport.state;
  }
}

export const audioEngine = new AudioEngine();
