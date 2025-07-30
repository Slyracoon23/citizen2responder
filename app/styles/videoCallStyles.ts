import { StyleSheet } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../constants/theme';

export const videoCallStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.xl,
  },
  permissionText: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: colors.error,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: borderRadius.round,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
  },
  backButton: {
    marginTop: spacing.xl,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: borderRadius.round,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#6C6C70',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    width: '60%',
    backgroundColor: colors.text.primary,
    borderRadius: 2,
  },

  // Status indicators
  statusIndicator: {
    position: 'absolute',
    top: 100,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorIndicator: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    top: 150,
  },
  statusText: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
  },

  // AI Processing Banner
  aiProcessingBanner: {
    position: 'absolute',
    top: 0, // Further down from status bar
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Semi-transparent blue
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    zIndex: 2000, // Above all other overlays
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiProcessingText: {
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginLeft: spacing.xs,
  },
  aiProcessingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.primary,
    marginHorizontal: 2,
  },

  // Full screen layout styles
  fullScreenVideoContainer: {
    flex: 1,
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Header overlay on top of video
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1002,
  },
  chatOverlayTop: {
    position: 'absolute',
    top: 0, // Align to very top of screen
    left: 0,
    right: 0,
    height: '30%', // Reduce vertical height
    zIndex: 1000,
    paddingTop: 0, // Remove all top padding
    paddingHorizontal: spacing.xl, // Keep horizontal padding to clear side buttons
  },
  chatInputAboveControls: {
    position: 'absolute',
    bottom: 300, // Position much higher above the controls
    left: 0,
    right: 0,
    zIndex: 1002,
  },
  controlsOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: spacing.md,
  },

  

  // Report Modal Styles
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  reportModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    width: '95%',
    maxWidth: 500,
    maxHeight: '95%',
    minHeight: 600,
    flex: 0,
    ...shadows.large,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  reportCloseButton: {
    padding: spacing.xs,
  },
  reportContent: {
    flex: 1,
    padding: spacing.lg,
    minHeight: 300,
  },
  reportContentContainer: {
    paddingBottom: spacing.lg,
  },
  reportSection: {
    marginBottom: spacing.lg,
  },
  reportRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  reportHalfSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  reportSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  reportText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  reportSubText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  reportWarning: {
    color: '#ff9500',
    fontWeight: fontWeight.bold,
  },
  reportDanger: {
    color: '#ff4444',
    fontWeight: fontWeight.bold,
  },
  reportActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    gap: spacing.xs,
  },
  reportCancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportSendButton: {
    backgroundColor: '#ff4444',
  },
  reportCancelButtonText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  reportSendButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  reportImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.overlay.light,
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    borderStyle: 'dashed',
  },
  reportImagePlaceholderText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});