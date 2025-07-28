import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

interface DeepgramResponse {
  metadata: {
    request_id: string;
    transaction_key: string;
    sha256: string;
    created: string;
    duration: number;
    channels: number;
  };
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
          punctuated_word: string;
        }>;
      }>;
    }>;
  };
}

interface DeepgramError {
  error: string;
  message?: string;
}

class DeepgramService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.deepgram.com/v1/listen';

  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_DEEPGRAM_PUBLIC_KEY || 
                   process.env.EXPO_PUBLIC_DEEPGRAM_PUBLIC_KEY;
    
    if (!apiKey) {
      throw new Error('Deepgram API key not found. Please set EXPO_PUBLIC_DEEPGRAM_PUBLIC_KEY in your environment.');
    }
    
    this.apiKey = apiKey;
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      console.log('🎤 DEEPGRAM: Starting transcription for audio file:', audioUri);

      // Read the audio file as binary data
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary for the request
      const binaryData = Uint8Array.from(atob(audioFile), c => c.charCodeAt(0));

      const response = await fetch(`${this.baseUrl}?model=nova-3&smart_format=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'audio/wav',
        },
        body: binaryData,
      });

      if (!response.ok) {
        const errorData: DeepgramError = await response.json();
        console.error('🎤 DEEPGRAM ERROR:', response.status, errorData);
        throw new Error(`Deepgram API error: ${errorData.error || response.statusText}`);
      }

      const data: DeepgramResponse = await response.json();
      console.log('🎤 DEEPGRAM: Raw response:', JSON.stringify(data, null, 2));

      // Extract transcript from response
      const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      
      if (!transcript || transcript.trim() === '') {
        console.warn('🎤 DEEPGRAM: No transcript found in response');
        throw new Error('No speech detected in audio');
      }

      console.log('🎤 DEEPGRAM: Transcription successful:', transcript);
      return transcript.trim();

    } catch (error) {
      console.error('🎤 DEEPGRAM: Transcription error:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred during transcription');
      }
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    try {
      // Simple health check - try to make a request with minimal data
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://dpgr.am/spacewalk.wav' // Deepgram's test audio file
        }),
      });

      return response.status === 200 || response.status === 400; // 400 is ok, means API is reachable
    } catch (error) {
      console.error('🎤 DEEPGRAM: Service availability check failed:', error);
      return false;
    }
  }
}

export default new DeepgramService();