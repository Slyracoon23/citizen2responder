import { useState, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import ApiService, { ConversationMessage } from '../services/apiService';
import { useTextToSpeech } from './useTextToSpeech';

export function useConversation() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const chatScrollViewRef = useRef<ScrollView>(null);
  const { speak, stop: stopSpeech, isSpeaking } = useTextToSpeech();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    // Stop any ongoing speech when user sends a message
    console.log('🔍 CONV DEBUG: User sending message, stopping speech');
    stopSpeech();
    
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added user message:', content);
    scrollToBottom();
    return message.id;
  }, [scrollToBottom, stopSpeech]);

  const addAiMessage = useCallback((content: string, enableSpeech: boolean = true) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added AI message:', content);
    
    // Speak the AI message if speech is enabled
    if (enableSpeech && content.trim()) {
      console.log('🔍 CONV DEBUG: Attempting to speak AI message');
      // Add a small delay to ensure UI updates before speech starts
      setTimeout(() => {
        speak(content.trim());
      }, 200);
    } else {
      console.log('🔍 CONV DEBUG: Speech disabled or empty content, skipping TTS');
    }
    
    scrollToBottom();
    return message.id;
  }, [scrollToBottom, speak]);

  return {
    conversationHistory,
    isApiLoading,
    setIsApiLoading,
    textInput,
    setTextInput,
    chatScrollViewRef,
    addUserMessage,
    addAiMessage,
    stopSpeech,
    isSpeaking,
  };
}