import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/theme';

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

  // Report Modal Styles
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  reportModalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    borderRadius: borderRadius.md,
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
});