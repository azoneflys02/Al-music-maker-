import { GoogleGenAI } from "@google/genai";
import { Note, Genre, Mood, SongSection, GeneratedTrack, TrainingExample } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GenerationReference {
  melody?: Note[];
  bassline?: Note[];
  chords?: Note[];
  drums?: Note[];
}

export async function generateMusic(
  genre: Genre, 
  mood: Mood, 
  customPrompt?: string,
  preferredInstruments?: { melody: string, bass: string, chords: string, drums: string },
  durationSeconds: number = 60,
  targetBpm: number = 100,
  reference?: GenerationReference,
  structure?: SongSection[],
  theme?: string,
  includeLyrics: boolean = true,
  trainingExamples: TrainingExample[] = []
): Promise<Partial<GeneratedTrack>> {
  const trainingText = trainingExamples.length > 0 
    ? `
    AI TRAINING EXAMPLES:
    I have provided ${trainingExamples.length} audio/MIDI files as training examples.
    Analyze the style, instrumentation, and rhythmic patterns from these files.
    Your output should be a synthesis of the requested genre/mood AND the specific aesthetic found in these examples.
    ` : "";

  const referenceText = reference ? `
    REFERENCE MATERIAL:
    The user has provided a base MIDI structure. 
    Use the provided notes as a thematic seed. 
    You can extend, harmonize, or completely re-imagine the following structure in the requested ${genre} style.
    Reference Melody Seed: ${reference.melody?.slice(0, 8).map(n => n.pitch).join(', ') || 'None'}
    Reference Bass Seed: ${reference.bassline?.slice(0, 8).map(n => n.pitch).join(', ') || 'None'}
  ` : "";

  const structureText = structure ? `
    SONG STRUCTURE REQUIREMENT:
    The user has defined a specific layout: ${structure.map(s => `${s.type} (${s.durationBars} bars)`).join(' then ')}.
    You MUST generate content that matches this progression.
    Start each section at the correct bar.
  ` : "";

  const lyricsPrompt = includeLyrics ? `
    "lyrics": "Write full song lyrics (e.g. [Verse 1], [Chorus], [Verse 2], [Chorus], [Outro]) that are thematically consistent with ${theme || 'any'} and the specified ${genre} style and ${mood} mood. The lyrics should reflect the instrument choices and any custom instructions.",
  ` : `"lyrics": "",`;

  const prompt = `
    You are an avant-garde AI composer. Generate a musical composition (Target Duration: ${durationSeconds} seconds) in JSON format.
    
    Target:
    Genre: ${genre}
    Mood: ${mood}
    Song Theme/Topic: ${theme || "None"}
    Target Length: ${durationSeconds} seconds
    Target BPM: ${targetBpm}
    Melody Instrument: ${preferredInstruments?.melody || "Any"}
    Bass Instrument: ${preferredInstruments?.bass || "Any"}
    Chords Instrument: ${preferredInstruments?.chords || "Any"}
    Drum Kit Style: ${preferredInstruments?.drums || "Any"}
    Additional Request: ${customPrompt || "None"}
    ${trainingText}
    ${referenceText}
    ${structureText}

    Return exactly this JSON structure:
    {
      "title": "Clear evocative title",
      "description": "Short poetic description of the sound (mentioning the instruments used)",
      "bpm": ${targetBpm}, // Use exactly this BPM
      "instruments": ["${preferredInstruments?.melody}", "${preferredInstruments?.bass}", "${preferredInstruments?.chords}", "${preferredInstruments?.drums}"],
      ${lyricsPrompt}
      "melody": [{"pitch": "C4", "time": "0:0:0", "duration": "8n", "velocity": 0.8}],
      "bassline": [{"pitch": "C2", "time": "0:0:0", "duration": "4n", "velocity": 0.6}],
      "chords": [{"pitch": "C3", "time": "0:0:0", "duration": "2n", "velocity": 0.5}],
      "drums": [{"pitch": "C1", "time": "0:0:0", "duration": "16n", "velocity": 1.0}] 
    }

    Rules for the music:
    - Drums Pitch Mapping: C1=Kick, D1=Snare, F#1=Closed Hi-hat, G#1=Open Hi-hat, A1=Tom.
    - Max Duration: The absolute maximum length is 5 minutes.
    - Pitch: Use scientific pitch notation (e.g., C4, Eb3, F#5).
    - Time: Use Tone.js transport format (measure:beat:sixteenth). E.g. '0:0:0', '0:1:0', '1:0:2'.
    - Duration: Use Tone.js duration notation ('4n', '8n', '2n', '1n', '8n.').
    - Velocity: 0 to 1.
    - Consistency: Ensure the melody, bass, and chords harmonize in a standard key.
    - Length: Provide enough notes to create a cohesive musical idea.
  `;

  try {
    const parts = [
      { text: prompt },
      ...trainingExamples.filter(ex => ex.data).map(ex => ({
        inlineData: {
          mimeType: ex.fileType,
          data: ex.data!
        }
      }))
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: parts,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate music content:", error);
    throw error;
  }
}
