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
});