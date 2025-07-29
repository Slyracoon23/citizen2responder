export const colors = {
  primary: '#007AFF',
  secondary: '#34C759',
  error: '#FF3B30',
  warning: '#FF9F0A',
  accent: '#FFD600',
  
  // Enhanced color palette
  success: '#34C759',
  info: '#5AC8FA',
  purple: '#AF52DE',
  pink: '#FF2D92',
  
  background: '#000',
  surface: '#1C1C1E',
  surfaceSecondary: 'rgba(34, 34, 34, 0.95)',
  
  // Glass morphism colors
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    strong: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Gradient colors
  gradients: {
    primary: ['#007AFF', '#0051D0'],
    secondary: ['#34C759', '#248A3D'],
    error: ['#FF3B30', '#D70015'],
    warning: ['#FF9F0A', '#FF8700'],
    accent: ['#FFD600', '#FFCC00'],
    glass: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)'],
    darkGlass: ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.1)'],
    gray: ['#666666', '#444444'],
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: '#FFD600',
    tertiary: '#888',
    quaternary: '#666',
    inverse: '#000000',
  },
  
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    medium: 'rgba(0, 0, 0, 0.8)',
    dark: 'rgba(128, 128, 128, 0.8)',
    ultraLight: 'rgba(0, 0, 0, 0.2)',
  },
  
  // Control-specific colors
  controls: {
    active: '#FFFFFF',
    inactive: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.15)',
    backgroundActive: 'rgba(255, 255, 255, 0.25)',
  },
  
  shadow: '#000',
  border: 'rgba(255, 255, 255, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  
  // Control-specific spacing
  control: {
    padding: 16,
    gap: 20,
    radius: 28,
  },
  
  // Button-specific spacing
  button: {
    small: { padding: 8, radius: 20 },
    medium: { padding: 12, radius: 24 },
    large: { padding: 16, radius: 28 },
    xlarge: { padding: 20, radius: 32 },
  },
};

export const borderRadius = {
  small: 4,
  medium: 12,
  large: 20,
  round: 25,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  xxxxl: 28,
  
  // Control-specific font sizes
  control: {
    label: 13,
    button: 16,
    title: 20,
  },
};

export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  xlarge: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 0,
  },
};

// Animation timings
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
};