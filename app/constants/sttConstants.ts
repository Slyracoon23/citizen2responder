import type { RecordingState } from '../hooks/useSpeechToText';

// STT Button Configuration
export const STT_CONFIG = {
  // Button dimensions
  BUTTON_SIZE: 60,
  GLOW_SIZE: 80,
  ICON_SIZE: 28,
  
  // Animation timings (in milliseconds)
  ANIMATION_DURATION: {
    PRESS: 150,
    RELEASE: 300,
    PULSE: 800,
    GLOW: 1000,
    FADE: 200,
  },
  
  // Animation values
  SCALE: {
    NORMAL: 1,
    PRESSED: 0.9,
    PULSE_MAX: 1.05,
  },
  
  // Colors
  COLORS: {
    RECORDING: '#FF3B30',
    PROCESSING: '#FFA500',
    ERROR: '#FF3B30',
    SUCCESS: '#4CAF50',
    IDLE_BACKGROUND: 'white',
    IDLE_ICON: '#000',
    ACTIVE_ICON: 'white',
  },
  
  // Audio recording settings
  RECORDING: {
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
    BIT_RATE: 128000,
    EXTENSION: '.wav',
  },
  
  // Shadow configuration
  SHADOW: {
    COLOR: '#000',
    OFFSET: { width: 0, height: 4 },
    OPACITY: 0.3,
    RADIUS: 6,
    ELEVATION: 8,
  },
} as const;

// Button state configuration - eliminates need for multiple switch statements
export interface ButtonStateConfig {
  icon: string;
  iconColor: string;
  backgroundColor: string;
  label: string;
  isDisabled?: boolean;
}

export const STT_BUTTON_STATES: Record<RecordingState, ButtonStateConfig> = {
  idle: {
    icon: 'keyboard-voice',
    iconColor: STT_CONFIG.COLORS.IDLE_ICON,
    backgroundColor: STT_CONFIG.COLORS.IDLE_BACKGROUND,
    label: 'Hold to Talk',
    isDisabled: false,
  },
  recording: {
    icon: 'stop',
    iconColor: STT_CONFIG.COLORS.ACTIVE_ICON,
    backgroundColor: STT_CONFIG.COLORS.RECORDING,
    label: 'Recording...',
    isDisabled: false,
  },
  processing: {
    icon: 'hourglass-empty',
    iconColor: STT_CONFIG.COLORS.IDLE_ICON,
    backgroundColor: STT_CONFIG.COLORS.PROCESSING,
    label: 'Processing...',
    isDisabled: true,
  },
  error: {
    icon: 'error',
    iconColor: STT_CONFIG.COLORS.ACTIVE_ICON,
    backgroundColor: STT_CONFIG.COLORS.ERROR,
    label: 'Error',
    isDisabled: false,
  },
} as const;

// Spring animation configuration
export const SPRING_CONFIG = {
  tension: 300,
  friction: 10,
} as const;

// Haptic feedback types
export const HAPTIC_TYPES = {
  PRESS: 'light',
  RELEASE: 'medium',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;