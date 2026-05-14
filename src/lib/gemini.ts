import { GoogleGenAI } from "@google/genai";
import { Genre, Mood, GeneratedTrack } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateMusic(
  genre: Genre, 
  mood: Mood, 
  customPrompt?: string,
  preferredInstruments?: { melody: string, bass: string, chords: string }
): Promise<Partial<GeneratedTrack>> {
  const prompt = `
    You are an avant-garde AI composer. Generate a musical composition (typically 8-16 measures, maximum 5 minutes in duration) in JSON format.
    
    Target:
    Genre: ${genre}
    Mood: ${mood}
    Melody Instrument: ${preferredInstruments?.melody || "Any"}
    Bass Instrument: ${preferredInstruments?.bass || "Any"}
    Chords Instrument: ${preferredInstruments?.chords || "Any"}
    Additional Request: ${customPrompt || "None"}

    Return exactly this JSON structure:
    {
      "title": "Clear evocative title",
      "description": "Short poetic description of the sound (mentioning the instruments used)",
      "bpm": 80, // Recommended BPM between 60 and 160
      "instruments": ["${preferredInstruments?.melody}", "${preferredInstruments?.bass}", "${preferredInstruments?.chords}"],
      "melody": [{"pitch": "C4", "time": "0:0:0", "duration": "8n", "velocity": 0.8}],
      "bassline": [{"pitch": "C2", "time": "0:0:0", "duration": "4n", "velocity": 0.6}],
      "chords": [{"pitch": "C3", "time": "0:0:0", "duration": "2n", "velocity": 0.5}]
    }

    Rules for the music:
    - Max Duration: The absolute maximum length is 5 minutes.
    - Pitch: Use scientific pitch notation (e.g., C4, Eb3, F#5).
    - Time: Use Tone.js transport format (measure:beat:sixteenth). E.g. '0:0:0', '0:1:0', '1:0:2'.
    - Duration: Use Tone.js duration notation ('4n', '8n', '2n', '1n', '8n.').
    - Velocity: 0 to 1.
    - Consistency: Ensure the melody, bass, and chords harmonize in a standard key.
    - Length: Provide enough notes to create a cohesive musical idea.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
