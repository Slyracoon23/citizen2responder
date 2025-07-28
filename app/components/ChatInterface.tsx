import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ConversationMessage } from '../services/apiService';

interface ChatInterfaceProps {
  isTranscriptionEnabled: boolean;
  conversationHistory: ConversationMessage[];
  textInput: string;
  setTextInput: (text: string) => void;
  chatScrollViewRef: React.RefObject<ScrollView>;
  onSendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInterface({
  isTranscriptionEnabled,
  conversationHistory,
  textInput,
  setTextInput,
  chatScrollViewRef,
  onSendMessage,
  isLoading
}: ChatInterfaceProps) {
  if (!isTranscriptionEnabled) return null;

  return (
    <View style={styles.chatOverlay}>
      {/* Conversation History */}
      {conversationHistory.length > 0 ? (
        <ScrollView
          ref={chatScrollViewRef}
          style={styles.chatScrollContainer}
          contentContainerStyle={styles.chatContentContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {conversationHistory.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
              ]}
            >
              <View
                style={[
                  styles.chatBubble,
                  message.type === 'user' ? styles.userBubble : styles.aiBubble
                ]}
              >
                <Text
                  style={[
                    styles.chatText,
                    message.type === 'user' ? styles.userText : styles.aiText
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Welcome message when no conversation history */
        <View style={styles.welcomeContainer}>
          <View style={[styles.chatBubble, styles.welcomeBubble]}>
            <Text style={styles.welcomeText}>
              Type a message to get started!
            </Text>
          </View>
        </View>
      )}

      {/* Text Input Area */}
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          value={textInput}
          onChangeText={setTextInput}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!textInput.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={onSendMessage}
          disabled={!textInput.trim() || isLoading}
        >
          {isLoading ? (
            <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chatOverlay: {
    position: 'absolute',
    top: 40,
    left: 15,
    right: 15,
    bottom: 15,
    zIndex: 5,
    flexDirection: 'column',
  },
  chatScrollContainer: {
    flex: 1,
  },
  chatContentContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 3,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    maxWidth: '80%',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    maxWidth: '80%',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  aiText: {
    color: '#FFD600',
    fontSize: 12,
    fontWeight: '400',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignSelf: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 13,
    textAlign: 'center',
  },
  chatBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  chatText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
    minHeight: 20,
    paddingVertical: 0,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
});