import * as Tone from 'tone';
import { GeneratedTrack, Note } from '../types';
import * as lamejs from 'lamejs';

class AudioEngine {
  private melodySynth: Tone.PolySynth;
  private bassSynth: Tone.MonoSynth;
  private chordSynth: Tone.PolySynth;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private isInitialized = false;

  constructor() {
    this.reverb = new Tone.Reverb(2).toDestination();
    this.delay = new Tone.FeedbackDelay("8n", 0.5).connect(this.reverb);
    
    this.melodySynth = new Tone.PolySynth(Tone.Synth).connect(this.delay);
    this.chordSynth = new Tone.PolySynth(Tone.Synth).connect(this.reverb);
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, release: 1 }
    }).connect(this.reverb);
  }

  async init() {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
    console.log("Audio Context Started");
  }

  playTrack(track: GeneratedTrack) {
    this.stop();
    
    Tone.Transport.bpm.value = track.bpm;

    const playNotes = (notes: Note[], synth: Tone.PolySynth | Tone.MonoSynth) => {
      new Tone.Part((time, note) => {
        synth.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
      }, notes.map(n => ({ time: n.time, pitch: n.pitch, duration: n.duration, velocity: n.velocity }))).start(0);
    };

    playNotes(track.melody, this.melodySynth);
    playNotes(track.bassline, this.bassSynth);
    playNotes(track.chords, this.chordSynth);

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
  async renderTrack(track: GeneratedTrack): Promise<AudioBuffer> {
    const MAX_DURATION = 300; // 5 minutes limit
    // Estimate length based on 16 bars or actual content
    let duration = (60 / track.bpm) * 4 * 16; 
    
    // Safety cap
    if (duration > MAX_DURATION) duration = MAX_DURATION;

    const toneBuffer = await Tone.Offline(({ transport }) => {
      transport.bpm.value = track.bpm;
      
      const offlineReverb = new Tone.Reverb(2).toDestination();
      const offlineDelay = new Tone.FeedbackDelay("8n", 0.5).connect(offlineReverb);
      
      const offlineMelody = new Tone.PolySynth(Tone.Synth).connect(offlineDelay);
      const offlineChord = new Tone.PolySynth(Tone.Synth).connect(offlineReverb);
      const offlineBass = new Tone.MonoSynth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, release: 1 }
      }).connect(offlineReverb);

      const scheduleNotes = (notes: Note[], synth: Tone.PolySynth | Tone.MonoSynth) => {
        notes.forEach(note => {
          synth.triggerAttackRelease(note.pitch, note.duration, note.time, note.velocity);
        });
      };

      scheduleNotes(track.melody, offlineMelody);
      scheduleNotes(track.bassline, offlineBass);
      scheduleNotes(track.chords, offlineChord);

      transport.start(0);
    }, duration);

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

  get state() {
    return Tone.Transport.state;
  }
}

export const audioEngine = new AudioEngine();
