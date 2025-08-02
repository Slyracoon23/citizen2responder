import { initLlama, LlamaContext } from 'llama.rn';
import { parseGemmaResponse } from '../config/gemmaPrompts';
import { ConversationMessage } from './apiService';
import { JSON_TOOL_SYSTEM_PROMPT } from './apiToolSchemas';

// Constants for the local model
const STOP_WORDS = [
  '<end_of_turn>', '</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>',
  '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>',
  '<|end_of_turn|>', '<|endoftext|>'
];

const MODEL_CONFIG = {
  use_mlock: true,
  n_ctx: 32768,
  n_gpu_layers: 99,
  temperature: 0.7,
  top_k: 64,
  top_p: 0.95,
  min_p: 0.0,
};

// Get the model path from environment variable
const MODEL_PATH = process.env.EXPO_PUBLIC_MODEL_PATH;

export interface LocalModelResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: Array<{
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
}

class LocalModelService {
  private static instance: LocalModelService;
  private llamaContext: LlamaContext | null = null;
  private isInitialized = false;
  private isInitializing = false;
  
  static getInstance(): LocalModelService {
    if (!LocalModelService.instance) {
      LocalModelService.instance = new LocalModelService();
    }
    return LocalModelService.instance;
  }

  async initializeModel(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;

    try {
      this.isInitializing = true;
      console.log('🦙 LOCAL MODEL: Initializing Gemma model...');

      // Release existing context if any
      if (this.llamaContext) {
        await this.llamaContext.release();
        this.llamaContext = null;
        this.isInitialized = false;
      }

      this.llamaContext = await initLlama({ 
        model: MODEL_PATH, 
        ...MODEL_CONFIG 
      });
      
      this.isInitialized = true;
      console.log('🦙 LOCAL MODEL: Gemma model initialized successfully');
    } catch (error) {
      console.error('🦙 LOCAL MODEL ERROR: Failed to initialize model:', error);
      this.llamaContext = null;
      this.isInitialized = false;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private convertConversationToGemmaFormat(conversationHistory: ConversationMessage[], currentMessage: string): string {
    let conversationText = '<bos>';

    // Add system message
    conversationText += `<start_of_turn>system\n${JSON_TOOL_SYSTEM_PROMPT}<end_of_turn>\n`;

    // Add conversation history
    conversationHistory.forEach(msg => {
      const role = msg.type === 'user' ? 'user' : 'model';
      conversationText += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
    });

    // Add current user message
    conversationText += `<start_of_turn>user\n${currentMessage.trim()}<end_of_turn>\n`;

    // Start model response
    conversationText += '<start_of_turn>model\n';

    return conversationText;
  }

  async callLocalModel(conversationHistory: ConversationMessage[], currentMessage: string): Promise<LocalModelResponse> {
    // Ensure model is initialized
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    if (!this.llamaContext || !this.isInitialized) {
      throw new Error('Local model not initialized');
    }

    try {
      console.log('🦙 LOCAL MODEL: Processing text message with local Gemma model');

      const prompt = this.convertConversationToGemmaFormat(conversationHistory, currentMessage);
      
      let fullResponse = '';

      await this.llamaContext.completion(
        {
          prompt: prompt,
          n_predict: 1000,
          stop: STOP_WORDS,
          ...MODEL_CONFIG,
        },
        (data) => {
          if (data.token) {
            fullResponse += data.token;
          }
        }
      );

      // Clean up response by removing any stop words that might have leaked through
      for (const stopWord of STOP_WORDS) {
        fullResponse = fullResponse.replace(new RegExp(stopWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }

      const cleanedResponse = fullResponse.trim() || 'I understand what you said, but I need a moment to process it properly.';
      
      console.log('🦙 LOCAL MODEL: Raw response:', cleanedResponse);

      // Parse response to check for tool calls
      const parsedResponse = parseGemmaResponse(cleanedResponse);
      
      // Format response to match OpenRouter API structure
      const response: LocalModelResponse = {
        choices: [{
          message: {
            content: parsedResponse.isToolCall ? '' : parsedResponse.content,
            ...(parsedResponse.standardToolCalls && {
              tool_calls: parsedResponse.standardToolCalls
            })
          }
        }]
      };

      console.log('🦙 LOCAL MODEL: Formatted response:', JSON.stringify(response, null, 2));
      console.log('🦙 LOCAL MODEL: Tool calls detected:', response.choices[0].message.tool_calls ? 'YES' : 'NO');
      return response;

    } catch (error) {
      console.error('🦙 LOCAL MODEL ERROR: Inference failed:', error);
      throw error;
    }
  }

  async callLocalModelWithForcedTool(conversationHistory: ConversationMessage[], toolName: string, promptMessage: string = 'Generate based on our conversation'): Promise<LocalModelResponse> {
    // Enhance the prompt to force tool usage
    const enhancedPrompt = `${promptMessage}\n\nYou MUST respond with a ${toolName} tool call. Use the JSON format specified in your instructions.`;
    
    return this.callLocalModel(conversationHistory, enhancedPrompt);
  }

  async releaseModel(): Promise<void> {
    if (this.llamaContext) {
      try {
        console.log('🦙 LOCAL MODEL: Releasing model context...');
        await this.llamaContext.release();
        this.llamaContext = null;
        this.isInitialized = false;
        console.log('🦙 LOCAL MODEL: Model context released successfully');
      } catch (error) {
        console.error('🦙 LOCAL MODEL ERROR: Failed to release model context:', error);
      }
    }
  }

  get isModelReady(): boolean {
    return this.isInitialized && this.llamaContext !== null;
  }

  get isModelInitializing(): boolean {
    return this.isInitializing;
  }
}

export default LocalModelService.getInstance();