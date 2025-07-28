import { useState, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import ApiService, { ConversationMessage } from '../services/apiService';

export function useConversation() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const chatScrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const addUserMessage = useCallback((content: string) => {
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
  }, [scrollToBottom]);

  const addAiMessage = useCallback((content: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added AI message:', content);
    scrollToBottom();
    return message.id;
  }, [scrollToBottom]);

  return {
    conversationHistory,
    isApiLoading,
    setIsApiLoading,
    textInput,
    setTextInput,
    chatScrollViewRef,
    addUserMessage,
    addAiMessage,
  };
}