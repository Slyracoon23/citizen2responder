
interface KokoroRequest {
  version: string;
  input: {
    text: string;
    voice: string;
    speed: number;
  };
}

interface KokoroResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string;
  error?: string;
}

interface Voice {
  id: string;
  name: string;
  description: string;
}

const KOKORO_VOICES: Voice[] = [
  { id: "af_alloy", name: "Alloy", description: "Default female voice with natural tone" },
  { id: "af_echo", name: "Echo", description: "Warm female voice" },
  { id: "af_fable", name: "Fable", description: "Professional female voice" },
  { id: "af_onyx", name: "Onyx", description: "Clear deep voice" },
  { id: "af_nova", name: "Nova", description: "Bright female voice" },
  { id: "af_shimmer", name: "Shimmer", description: "Gentle female voice" }
];

class KokoroService {
  private static instance: KokoroService;
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.replicate.com/v1/predictions";
  private readonly modelVersion = "jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13";

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_REPLICATE_PUBLIC_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_REPLICATE_PUBLIC_KEY not found in environment variables');
    }
    this.apiKey = apiKey;
  }

  static getInstance(): KokoroService {
    if (!KokoroService.instance) {
      KokoroService.instance = new KokoroService();
    }
    return KokoroService.instance;
  }

  /**
   * Generate speech from text using Kokoro via Replicate API
   * @param text The text to convert to speech
   * @param voiceId The voice ID to use (defaults to af_alloy)
   * @returns Promise resolving to ArrayBuffer containing audio data
   */
  async generateSpeech(text: string, voiceId: string = "af_alloy"): Promise<ArrayBuffer> {
    try {
      console.log('🎙️ KOKORO: Generating speech -', { voice: voiceId, textLength: text.length });
      
      const requestBody: KokoroRequest = {
        version: this.modelVersion,
        input: {
          text,
          voice: voiceId,
          speed: 1.1
        }
      };

      // Start the prediction
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎙️ KOKORO ERROR: API request failed:', response.status, errorText);
        throw new Error(`Kokoro API error: ${response.status} - ${errorText}`);
      }

      const result: KokoroResponse = await response.json();
      
      if (result.status === 'failed') {
        throw new Error(`Kokoro generation failed: ${result.error}`);
      }

      if (!result.output) {
        throw new Error(`No output URL provided (status: ${result.status})`);
      }

      console.log('🎙️ KOKORO: Downloading audio from:', result.output.substring(0, 60) + '...');
      
      const audioResponse = await fetch(result.output);
      if (!audioResponse.ok) {
        throw new Error(`Audio download failed: ${audioResponse.status}`);
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      console.log('🎙️ KOKORO: ✅ Generated audio (', audioBuffer.byteLength, 'bytes)');
      
      return audioBuffer;

    } catch (error) {
      console.error('🎙️ KOKORO ERROR: Failed to generate speech:', error);
      throw error;
    }
  }

  /**
   * Get available Kokoro voices
   * @returns Array of available voice options
   */
  getAvailableVoices(): Voice[] {
    return KOKORO_VOICES;
  }

  /**
   * Convert ArrayBuffer to base64 data URI for audio playback
   */
  private arrayBufferToDataUri(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';
    
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binaryString);
    return `data:audio/wav;base64,${base64}`;
  }

  /**
   * Generate speech and return as data URI for immediate playback
   * @param text The text to convert to speech
   * @param voiceId The voice ID to use
   * @returns Promise resolving to data URI string for audio playback
   */
  async generateSpeechDataUri(text: string, voiceId?: string): Promise<string> {
    const audioBuffer = await this.generateSpeech(text, voiceId);
    return this.arrayBufferToDataUri(audioBuffer);
  }
}

export default KokoroService.getInstance();