import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  setupPlayer,
  playTrack,
  togglePlayback,
  seekTo,
  setVolume,
  stopAndClear,
  HymnTrack,
  usePlaybackState,
  useProgress,
  State,
  Event,
  useTrackPlayerEvents,
  cacheTrack,
  isTrackCached,
  removeCachedTrack,
} from '../../services/AudioService';

interface AudioPlayerProps {
  track: HymnTrack;
  onClose: () => void;
  isMinimized?: boolean;
  onExpand?: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  onClose,
  isMinimized = false,
  onExpand,
}) => {
  const insets = useSafeAreaInsets();
  const playbackState = usePlaybackState();
  const progress = useProgress();
  
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const volumeVisible = useSharedValue(0);
  const volumeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: volumeVisible.value,
    };
  });
  
  const volumeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Setup player on mount
  useEffect(() => {
    let isMounted = true;
    
    const setup = async () => {
      try {
        const isSetup = await setupPlayer();
        
        if (isSetup && isMounted) {
          setIsPlayerReady(true);
          
          // Check if track is already cached
          const cached = await isTrackCached(track.id);
          setIsDownloaded(cached);
          
          // Start playback
          await playTrack(track);
        }
      } catch (error) {
        console.error('Error setting up the player:', error);
        if (isMounted) {
          setError('Failed to setup audio player');
        }
      }
    };
    
    setup();
    
    return () => {
      isMounted = false;
      if (volumeTimeout.current) {
        clearTimeout(volumeTimeout.current);
      }
    };
  }, [track]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop and clear the player when component unmounts
      stopAndClear();
    };
  }, []);
  
  // Handle playback errors
  useTrackPlayerEvents([Event.PlaybackError], (event) => {
    if (event.type === Event.PlaybackError) {
      setError(`Playback error: ${event.message}`);
    }
  });

  const handlePlayPause = async () => {
    if (!isPlayerReady) return;
    
    try {
      await togglePlayback(playbackState);
      
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling playback:', error);
      setError('Failed to play/pause');
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekValue(progress.position);
  };

  const handleSeekComplete = async () => {
    try {
      await seekTo(seekValue);
      setIsSeeking(false);
    } catch (error) {
      console.error('Error seeking:', error);
      setError('Failed to seek');
      setIsSeeking(false);
    }
  };

  const handleVolumeChange = async (value: number) => {
    try {
      setVolumeState(value);
      await setVolume(value);
      
      // Show volume indicator
      volumeVisible.value = withTiming(1, { duration: 200 });
      
      // Hide volume indicator after a delay
      if (volumeTimeout.current) {
        clearTimeout(volumeTimeout.current);
      }
      
      volumeTimeout.current = setTimeout(() => {
        volumeVisible.value = withTiming(0, { duration: 500 });
      }, 1500);
    } catch (error) {
      console.error('Error changing volume:', error);
      setError('Failed to change volume');
    }
  };

  const handleDownload = async () => {
    if (isDownloaded) {
      // Remove from downloads
      try {
        setIsDownloading(true);
        await removeCachedTrack(track.id);
        setIsDownloaded(false);
        setIsDownloading(false);
      } catch (error) {
        console.error('Error removing download:', error);
        setError('Failed to remove download');
        setIsDownloading(false);
      }
    } else {
      // Add to downloads
      try {
        setIsDownloading(true);
        await cacheTrack(track);
        setIsDownloaded(true);
        setIsDownloading(false);
      } catch (error) {
        console.error('Error downloading track:', error);
        setError('Failed to download track');
        setIsDownloading(false);
      }
    }
  };

  // Render minimized player
  if (isMinimized) {
    return (
      <TouchableOpacity
        style={[styles.minimizedContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}
        onPress={onExpand}
        activeOpacity={0.9}
      >
        <BlurView intensity={80} style={styles.blurView}>
          <View style={styles.minimizedContent}>
            <Image 
              source={track.artwork ? { uri: track.artwork } : require('../../../assets/default-album.png')} 
              style={styles.minimizedArtwork} 
            />
            
            <View style={styles.minimizedInfo}>
              <Text style={styles.minimizedTitle} numberOfLines={1}>
                {track.title}
              </Text>
              {track.artist && (
                <Text style={styles.minimizedArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.minimizedButton} onPress={handlePlayPause}>
              <Ionicons 
                name={playbackState === State.Playing ? 'pause' : 'play'} 
                size={24} 
                color="#2563eb" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.minimizedButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  }

  // Render full player
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="chevron-down" size={28} color="#6b7280" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Now Playing</Text>
        </View>
        
        <TouchableOpacity style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {/* Album Artwork */}
      <View style={styles.artworkContainer}>
        <Image 
          source={track.artwork ? { uri: track.artwork } : require('../../../assets/default-album.png')} 
          style={styles.artwork} 
          resizeMode="cover"
        />
      </View>
      
      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{track.title}</Text>
        {track.artist && <Text style={styles.artist}>{track.artist}</Text>}
        {track.hymnNumber && <Text style={styles.hymnNumber}>Hymn #{track.hymnNumber}</Text>}
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>
          {isSeeking ? formatTime(seekValue) : formatTime(progress.position)}
        </Text>
        
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={progress.duration > 0 ? progress.duration : 1}
          value={isSeeking ? seekValue : progress.position}
          onValueChange={setSeekValue}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekComplete}
          minimumTrackTintColor="#2563eb"
          maximumTrackTintColor="#d1d5db"
          thumbTintColor="#2563eb"
        />
        
        <Text style={styles.timeText}>
          {formatTime(progress.duration)}
        </Text>
      </View>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.secondaryControlButton} onPress={handleDownload}>
          {isDownloading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons 
              name={isDownloaded ? 'cloud-done' : 'cloud-download'} 
              size={24} 
              color={isDownloaded ? '#2563eb' : '#6b7280'} 
            />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
          {!isPlayerReady ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <Ionicons 
              name={playbackState === State.Playing ? 'pause' : 'play'} 
              size={32} 
              color="#ffffff" 
            />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryControlButton}>
          <Ionicons name="repeat" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {/* Volume Control */}
      <View style={styles.volumeContainer}>
        <TouchableOpacity>
          <Ionicons name="volume-low" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor="#2563eb"
          maximumTrackTintColor="#d1d5db"
          thumbTintColor="#2563eb"
        />
        
        <TouchableOpacity>
          <Ionicons name="volume-high" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {/* Volume Indicator */}
      <Animated.View style={[styles.volumeIndicator, volumeAnimatedStyle]}>
        <Ionicons 
          name={volume === 0 ? 'volume-mute' : volume < 0.3 ? 'volume-low' : 'volume-high'} 
          size={20} 
          color="#ffffff" 
        />
        <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
      </Animated.View>
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  optionsButton: {
    padding: 8,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  artwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  hymnNumber: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    width: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 40,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  secondaryControlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  volumeIndicator: {
    position: 'absolute',
    top: 100,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  volumeText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  minimizedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  blurView: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  minimizedArtwork: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  minimizedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  minimizedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  minimizedArtist: {
    fontSize: 12,
    color: '#6b7280',
  },
  minimizedButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default AudioPlayer;