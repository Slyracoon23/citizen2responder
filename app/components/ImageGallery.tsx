import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { videoCallStyles } from '../styles/videoCallStyles';

interface ImageGalleryProps {
  images: string[];
  onImageSelect?: (imageUri: string, index: number) => void;
  selectedIndex?: number;
  showThumbnails?: boolean;
  showCounter?: boolean;
}

const ImageGallery = memo(function ImageGallery({ 
  images, 
  onImageSelect, 
  selectedIndex = 0,
  showThumbnails = true,
  showCounter = true
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  const handleImageSelect = useCallback((index: number) => {
    setCurrentIndex(index);
    onImageSelect?.(images[index], index);
  }, [images, onImageSelect]);

  if (!images || images.length === 0) {
    return (
      <View style={videoCallStyles.reportImagePlaceholder}>
        <MaterialIcons name="image" size={48} color="#666" />
        <Text style={videoCallStyles.reportImagePlaceholderText}>
          Evidence Photo/Video{'\n'}(Captured during incident)
        </Text>
      </View>
    );
  }

  return (
    <View style={videoCallStyles.reportImageSection}>
      {showCounter && (
        <Text style={videoCallStyles.reportSectionTitle}>
          Evidence Images ({images.length})
        </Text>
      )}
      
      {/* Main Selected Image */}
      <View style={videoCallStyles.reportImageContainer}>
        <Image 
          source={{ uri: images[currentIndex] }}
          style={videoCallStyles.reportMainImage}
          resizeMode="contain"
        />
      </View>
      
      {/* Image Selector Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <ScrollView horizontal style={videoCallStyles.reportImageThumbnails}>
          {images.map((imageUri, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleImageSelect(index)}
              style={[
                videoCallStyles.reportThumbnail,
                currentIndex === index && videoCallStyles.reportThumbnailSelected
              ]}
            >
              <Image 
                source={{ uri: imageUri }}
                style={videoCallStyles.reportThumbnailImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

export default ImageGallery;