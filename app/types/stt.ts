import type { Animated } from 'react-native';
import type { RecordingState } from '../hooks/useSpeechToText';

// Button state and configuration types
export interface ButtonStateConfig {
  icon: string;
  iconColor: string;
  backgroundColor: string;
  label: string;
  isDisabled?: boolean;
}

// Animation-related types
export interface AnimationRefs {
  scaleAnim: Animated.Value;
  glowAnim: Animated.Value;
  recordingPulseAnim: Animated.Value;
}

export interface AnimationControls {
  animatePress: () => void;
  animateRelease: () => void;
  startRecordingAnimation: () => void;
  stopRecordingAnimation: () => void;
}

// Component prop types
export interface SttButtonProps {
  recordingState: RecordingState;
  onPressIn: () => void;
  onPressOut: () => void;
  pulseAnim?: Animated.Value;
}

export interface SttButtonStyles {
  container: any;
  touchable: any;
  button: any;
  glow: any;
  label: any;
}

// Hook return types
export interface UseSttButtonReturn extends AnimationRefs, AnimationControls {
  getButtonStyle: (recordingState: RecordingState) => any;
  getGlowStyle: () => any;
}

// Service types
export interface DeepgramServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  smartFormat: boolean;
}

export interface AudioRecordingConfig {
  sampleRate: number;
  numberOfChannels: number;
  bitRate: number;
  extension: string;
}

// Error handling types
export interface SttError {
  type: 'recording' | 'transcription' | 'network' | 'permission';
  message: string;
  details?: any;
}

export interface SttErrorHandler {
  handleError: (error: SttError) => void;
  clearError: () => void;
  getErrorMessage: (error: SttError) => string;
}