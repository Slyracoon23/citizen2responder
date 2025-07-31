import * as FileSystem from 'expo-file-system';

export interface StoredImage {
  uri: string;
  filename: string;
  timestamp: number;
}

class ImageStorageService {
  private static instance: ImageStorageService;
  private sessionImages: StoredImage[] = [];
  private sessionId: string;
  
  static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService();
    }
    return ImageStorageService.instance;
  }

  constructor() {
    this.sessionId = Date.now().toString();
    this.initializeSession();
  }

  private async initializeSession() {
    await this.cleanupOldImages();
  }

  private async cleanupOldImages() {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const imageFiles = files.filter(file => 
        file.startsWith('evidence_') && 
        (file.endsWith('.jpg') || file.endsWith('.png'))
      );

      for (const file of imageFiles) {
        const filePath = `${cacheDir}${file}`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
      
      console.log('🧹 Cleaned up old evidence images');
    } catch (error) {
      console.error('Error cleaning up old images:', error);
    }
  }

  async saveImageToTemp(base64Data: string): Promise<string | null> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        throw new Error('Cache directory not available');
      }

      const timestamp = Date.now();
      const filename = `evidence_${this.sessionId}_${timestamp}.jpg`;
      const filePath = `${cacheDir}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const storedImage: StoredImage = {
        uri: filePath,
        filename,
        timestamp,
      };

      this.sessionImages.push(storedImage);
      console.log('📸 Saved evidence image:', filename);
      
      return filePath;
    } catch (error) {
      console.error('Error saving image to temp storage:', error);
      return null;
    }
  }

  getImageURIs(): string[] {
    return this.sessionImages.map(img => img.uri);
  }

  getImageCount(): number {
    return this.sessionImages.length;
  }

  async clearSessionImages() {
    try {
      for (const image of this.sessionImages) {
        await FileSystem.deleteAsync(image.uri, { idempotent: true });
      }
      this.sessionImages = [];
      console.log('🧹 Cleared session images');
    } catch (error) {
      console.error('Error clearing session images:', error);
    }
  }

  async startNewSession() {
    await this.clearSessionImages();
    this.sessionId = Date.now().toString();
    console.log('🔄 Started new image session:', this.sessionId);
  }
}

export default ImageStorageService.getInstance();