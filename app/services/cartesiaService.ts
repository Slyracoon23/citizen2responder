interface CartesiaVoice {
  mode: "id";
  id: string;
}

interface CartesiaOutputFormat {
  container: "mp3" | "wav" | "raw";
  bit_rate?: number;
  sample_rate: number;
}

interface CartesiaRequest {
  model_id: string;
  transcript: string;
  voice: CartesiaVoice;
  output_format: CartesiaOutputFormat;
  language?: string;
  duration?: number;
  speed?: "slow" | "normal" | "fast";
}

class CartesiaService {
  private static instance: CartesiaService;
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.cartesia.ai/tts/bytes";
  private readonly apiVersion = "2025-04-16";

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_CARTESIA_PUBLIC_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_CARTESIA_PUBLIC_KEY not found in environment variables');
    }
    this.apiKey = apiKey;
  }

  static getInstance(): CartesiaService {
    if (!CartesiaService.instance) {
      CartesiaService.instance = new CartesiaService();
    }
    return CartesiaService.instance;
  }

  /**
   * Generate speech from text using Cartesia API
   */
  async generateSpeech(
    text: string,
    voiceId: string = "a0e99841-438c-4a64-b679-ae501e7d6091", // Default voice - Barbershop Man
    options: {
      language?: string;
      speed?: "slow" | "normal" | "fast";
      modelId?: string;
      outputFormat?: CartesiaOutputFormat;
    } = {}
  ): Promise<ArrayBuffer> {
    try {
      console.log('🎙️ CARTESIA: Generating speech for text:', text.substring(0, 50) + '...');
      
      const requestBody: CartesiaRequest = {
        model_id: options.modelId || "sonic-2",
        transcript: text,
        voice: {
          mode: "id",
          id: voiceId
        },
        output_format: options.outputFormat || {
          container: "mp3",
          bit_rate: 128000,
          sample_rate: 44100
        },
        ...(options.language && { language: options.language }),
        ...(options.speed && { speed: options.speed })
      };

      console.log('🎙️ CARTESIA: Making API request with params:', {
        model_id: requestBody.model_id,
        voice_id: requestBody.voice.id,
        output_format: requestBody.output_format,
        text_length: text.length
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Cartesia-Version': this.apiVersion
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎙️ CARTESIA ERROR: API request failed:', response.status, errorText);
        throw new Error(`Cartesia API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('🎙️ CARTESIA: Successfully generated audio, size:', audioBuffer.byteLength, 'bytes');
      
      return audioBuffer;

    } catch (error) {
      console.error('🎙️ CARTESIA ERROR: Failed to generate speech:', error);
      throw error;
    }
  }

  /**
   * Get available voices (placeholder - would need separate API endpoint)
   */
  getAvailableVoices(): Array<{ id: string; name: string; description: string }> {
    // Common Cartesia voice IDs - in a real implementation, this would come from an API
    return [
      {
        id: "a0e99841-438c-4a64-b679-ae501e7d6091",
        name: "Barbershop Man",
        description: "Warm, friendly male voice"
      },
      {
        id: "95856005-0332-41b0-935f-352e296aa0df", 
        name: "Doctor Mischief",
        description: "Professional, clear voice"
      },
      {
        id: "fb26447f-308b-471e-8b00-8e9f04284eb5",
        name: "Newscaster",
        description: "Clear, authoritative voice"
      },
      {
        id: "41534e16-2966-4c6b-9670-111411def906",
        name: "Customer Support",
        description: "Helpful, warm voice"
      }
    ];
  }

  /**
   * Convert ArrayBuffer to base64 data URI for audio playback
   */
  private arrayBufferToDataUri(buffer: ArrayBuffer, mimeType: string = 'audio/mp3'): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Generate speech and return as data URI for immediate playback
   */
  async generateSpeechDataUri(
    text: string,
    voiceId?: string,
    options?: {
      language?: string;
      speed?: "slow" | "normal" | "fast";
      modelId?: string;
    }
  ): Promise<string> {
    const audioBuffer = await this.generateSpeech(text, voiceId, options);
    return this.arrayBufferToDataUri(audioBuffer);
  }
}

export default CartesiaService.getInstance();