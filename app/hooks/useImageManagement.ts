import { useState, useEffect, useCallback } from 'react';
import imageStorageService from '../services/imageStorageService';

export function useImageManagement() {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  // Initialize image session on mount
  useEffect(() => {
    const initializeSession = async () => {
      await imageStorageService.startNewSession();
      setCapturedImages([]);
    };
    initializeSession();

    // Cleanup on unmount
    return () => {
      imageStorageService.clearSessionImages().catch((error) => {
        console.error('Failed to clear session images on component unmount:', error);
      });
    };
  }, []);

  // Add image to captured images list
  const addCapturedImage = useCallback(async (base64Data: string): Promise<string | null> => {
    const savedImageUri = await imageStorageService.saveImageToTemp(base64Data);
    if (savedImageUri) {
      setCapturedImages(prev => [...prev, savedImageUri]);
      return savedImageUri;
    }
    return null;
  }, []);

  // Get image count
  const getImageCount = useCallback(() => {
    return capturedImages.length;
  }, [capturedImages.length]);

  // Clear all images
  const clearImages = useCallback(async () => {
    await imageStorageService.clearSessionImages();
    setCapturedImages([]);
  }, []);

  // Get all image URIs
  const getImageURIs = useCallback(() => {
    return [...capturedImages];
  }, [capturedImages]);

  return {
    capturedImages,
    addCapturedImage,
    getImageCount,
    clearImages,
    getImageURIs,
  };
}