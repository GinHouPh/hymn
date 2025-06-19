import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// Import enhanced view components
import ViewSwitcher, { ViewType } from '../../components/ViewSwitcher';
import { NotationData } from '../../components/StaffNotationView';
import { SolfaData } from '../../components/TonicSolfaView';

// Types
type Song = {
  id: string;
  number: number;
  title: string;
  author?: string;
  category?: string;
  lyrics: string;
  hasAudio: boolean;
  hasNotation: boolean;
  isFavorite: boolean;
  isDownloaded: boolean;
  notationData?: NotationData;
  solfaData?: SolfaData;
};

// Mock data for demonstration
const mockSong: Song = {
  id: 'song-1',
  number: 1,
  title: 'Amazing Grace',
  author: 'John Newton',
  category: 'Salvation',
  lyrics: `Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.\n\n'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.\n\nThrough many dangers, toils and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.\n\nThe Lord has promised good to me,\nHis Word my hope secures;\nHe will my Shield and Portion be,\nAs long as life endures.\n\nYea, when this flesh and heart shall fail,\nAnd mortal life shall cease,\nI shall possess, within the veil,\nA life of joy and peace.\n\nThe earth shall soon dissolve like snow,\nThe sun forbear to shine;\nBut God, who called me here below,\nWill be forever mine.\n\nWhen we've been there ten thousand years,\nBright shining as the sun,\nWe've no less days to sing God's praise\nThan when we'd first begun.`,
  hasAudio: true,
  hasNotation: true,
  isFavorite: false,
  isDownloaded: true,
};

export default function SongViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { songId, songNumber } = route.params as { songId: string; songNumber?: number };
  
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
  const [showOptions, setShowOptions] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showAutoScrollModal, setShowAutoScrollModal] = useState(false);
  const [showNightMode, setShowNightMode] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('lyrics');
  const [currentPosition, setCurrentPosition] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const autoScrollAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Fetch song on initial load
  useEffect(() => {
    fetchSong();
    return () => {
      // Clean up auto-scroll animation when component unmounts
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
      }
    };
  }, []);

  // Load enhanced song data
  useEffect(() => {
    if (song) {
      loadEnhancedSongData();
    }
  }, [song]);

  const fetchSong = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await SongService.getSongById(songId);
      // setSong(response.data);
      
      // For demo purposes, use mock data after a delay
      setTimeout(() => {
        setSong(mockSong);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching song:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load song. Please try again.');
    }
  };

  const loadEnhancedSongData = async () => {
    try {
      // Mock notation data
      const mockNotationData: NotationData = {
        measures: [
          {
            id: 'measure1',
            notes: [
              { id: 'note1', pitch: 'C4', duration: 0.5, position: 0, timeStart: 0, timeEnd: 0.5 },
              { id: 'note2', pitch: 'D4', duration: 0.5, position: 0.5, timeStart: 0.5, timeEnd: 1 },
              { id: 'note3', pitch: 'E4', duration: 0.5, position: 0, timeStart: 1, timeEnd: 1.5 },
              { id: 'note4', pitch: 'F4', duration: 0.5, position: 0.5, timeStart: 1.5, timeEnd: 2 },
            ],
            timeStart: 0,
            timeEnd: 2,
          },
          {
            id: 'measure2',
            notes: [
              { id: 'note5', pitch: 'G4', duration: 0.5, position: 0, timeStart: 2, timeEnd: 2.5 },
              { id: 'note6', pitch: 'A4', duration: 0.5, position: 0.5, timeStart: 2.5, timeEnd: 3 },
              { id: 'note7', pitch: 'B4', duration: 0.5, position: 0, timeStart: 3, timeEnd: 3.5 },
              { id: 'note8', pitch: 'C5', duration: 0.5, position: 0.5, timeStart: 3.5, timeEnd: 4 },
            ],
            timeStart: 2,
            timeEnd: 4,
          },
        ],
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major', sharps: 0, flats: 0 },
        tempo: 120,
        title: song?.title,
      };

      // Mock solfa data
      const mockSolfaData: SolfaData = {
        verses: [
          {
            id: 'verse1',
            title: 'Verse 1',
            lines: [
              {
                id: 'line1',
                syllables: [
                  { id: 'syl1', text: 'A-', solfa: 'do', octave: 2, duration: 0.5, timeStart: 0, timeEnd: 0.5 },
                  { id: 'syl2', text: 'ma-', solfa: 'ray', octave: 2, duration: 0.5, timeStart: 0.5, timeEnd: 1 },
                  { id: 'syl3', text: 'zing', solfa: 'me', octave: 2, duration: 0.5, timeStart: 1, timeEnd: 1.5 },
                  { id: 'syl4', text: 'grace!', solfa: 'fah', octave: 2, duration: 0.5, timeStart: 1.5, timeEnd: 2 },
                ],
                timeStart: 0,
                timeEnd: 2,
              },
              {
                id: 'line2',
                syllables: [
                  { id: 'syl5', text: 'How', solfa: 'soh', octave: 2, duration: 0.5, timeStart: 2, timeEnd: 2.5 },
                  { id: 'syl6', text: 'sweet', solfa: 'lah', octave: 2, duration: 0.5, timeStart: 2.5, timeEnd: 3 },
                  { id: 'syl7', text: 'the', solfa: 'te', octave: 2, duration: 0.5, timeStart: 3, timeEnd: 3.5 },
                  { id: 'syl8', text: 'sound', solfa: 'do', octave: 3, duration: 0.5, timeStart: 3.5, timeEnd: 4 },
                ],
                timeStart: 2,
                timeEnd: 4,
              },
            ],
            timeStart: 0,
            timeEnd: 4,
          },
        ],
        key: 'C major',
        timeSignature: '4/4',
        tempo: 120,
        title: song?.title,
      };

      // Update song with enhanced data
      setSong(prev => prev ? {
        ...prev,
        notationData: mockNotationData,
        solfaData: mockSolfaData,
      } : null);
    } catch (error) {
      console.error('Error loading enhanced song data:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!song) return;

    try {
      // In a real app, this would be an API call
      // await SongService.toggleFavorite(songId);
      setSong({ ...song, isFavorite: !song.isFavorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status.');
    }
  };

  const startAutoScroll = () => {
    if (!scrollViewRef.current) return;

    // Get the content height
    scrollViewRef.current.measure((x, y, width, height, pageX, pageY) => {
      scrollViewRef.current?.getScrollResponder()?.scrollResponderScrollTo({ x: 0, y: 0, animated: false });

      // Calculate scroll duration based on content height and speed
      const duration = 100000 / autoScrollSpeed; // Adjust this value to control scroll speed

      // Start the animation
      autoScrollAnimation.current = Animated.timing(scrollY, {
        toValue: 5000, // A large value to ensure it scrolls to the end
        duration,
        useNativeDriver: true,
      });

      autoScrollAnimation.current.start();
    });
  };

  const stopAutoScroll = () => {
    if (autoScrollAnimation.current) {
      autoScrollAnimation.current.stop();
      autoScrollAnimation.current = null;
    }
  };

  const toggleAutoScroll = () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
    setIsAutoScrolling(!isAutoScrolling);
  };

  // Swipe gesture for navigation between songs
  const swipeGesture = Gesture.Fling()
    .direction(Gesture.DIRECTION.RIGHT | Gesture.DIRECTION.LEFT)
    .onEnd((event) => {
      if (event.direction === Gesture.DIRECTION.LEFT) {
        // Navigate to next song
        if (songNumber && songNumber < 100) { // Mock limit
          navigation.navigate('SongView', { songId: `song-${songNumber + 1}`, songNumber: songNumber + 1 });
        }
      } else if (event.direction === Gesture.DIRECTION.RIGHT) {
        // Navigate to previous song
        if (songNumber && songNumber > 1) {
          navigation.navigate('SongView', { songId: `song-${songNumber - 1}`, songNumber: songNumber - 1 });
        }
      }
    });

  if (isLoading || !song) {
    return (
      <SafeAreaView style={[styles.container, showNightMode && styles.nightModeContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading song...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, showNightMode && styles.nightModeContainer]} edges={['top']}>
      <StatusBar barStyle={showNightMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, showNightMode && styles.nightModeHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={showNightMode ? '#ffffff' : '#2563eb'} 
          />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.songNumber, showNightMode && styles.nightModeText]} 
            numberOfLines={1}
          >
            {song.number}
          </Text>
          <Text 
            style={[styles.songTitle, showNightMode && styles.nightModeText]} 
            numberOfLines={1}
          >
            {song.title}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
            <Ionicons
              name={song.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={song.isFavorite ? '#ef4444' : (showNightMode ? '#ffffff' : '#2563eb')}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowOptions(true)}>
            <Ionicons 
              name="ellipsis-vertical" 
              size={24} 
              color={showNightMode ? '#ffffff' : '#2563eb'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Song Info */}
      <View style={[styles.songInfo, showNightMode && styles.nightModeSongInfo]}>
        {song.author && (
          <Text style={[styles.songAuthor, showNightMode && styles.nightModeText]}>
            By {song.author}
          </Text>
        )}
        {song.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{song.category}</Text>
          </View>
        )}
      </View>
      
      {/* Enhanced Song Views */}
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.contentContainer}>
          <ViewSwitcher
            songId={song.id}
            lyricsContent={song.lyrics}
            notationData={song.notationData}
            solfaData={song.solfaData}
            currentPosition={currentPosition}
            onPositionChange={setCurrentPosition}
            initialView={currentView}
            onViewChange={setCurrentView}
          />
        </View>
      </GestureDetector>
      
      {/* Auto-scroll Controls */}
      {isAutoScrolling && (
        <View style={styles.autoScrollControls}>
          <TouchableOpacity 
            style={styles.autoScrollButton} 
            onPress={() => setAutoScrollSpeed(Math.max(0.5, autoScrollSpeed - 0.5))}
          >
            <Ionicons name="remove" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.autoScrollStopButton} onPress={toggleAutoScroll}>
            <Ionicons name="pause" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.autoScrollButton} 
            onPress={() => setAutoScrollSpeed(Math.min(5, autoScrollSpeed + 0.5))}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bottom Controls */}
      <View style={[styles.bottomControls, showNightMode && styles.nightModeBottomControls]}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowFontSizeModal(true)}
        >
          <Ionicons 
            name="text" 
            size={22} 
            color={showNightMode ? '#ffffff' : '#4b5563'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={toggleAutoScroll}
        >
          <Ionicons 
            name={isAutoScrolling ? 'pause' : 'play'} 
            size={22} 
            color={showNightMode ? '#ffffff' : '#4b5563'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowNightMode(!showNightMode)}
        >
          <Ionicons 
            name={showNightMode ? 'sunny' : 'moon'} 
            size={22} 
            color={showNightMode ? '#ffffff' : '#4b5563'} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Song Options</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="musical-notes-outline" size={24} color="#2563eb" />
              <Text style={styles.optionText}>Play Audio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setCurrentView('notation');
                setShowOptions(false);
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#2563eb" />
              <Text style={styles.optionText}>View Staff Notation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setCurrentView('solfa');
                setShowOptions(false);
              }}
            >
              <Ionicons name="text-outline" size={24} color="#2563eb" />
              <Text style={styles.optionText}>View Tonic Sol-fa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={toggleFavorite}>
              <Ionicons 
                name={song.isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={song.isFavorite ? '#ef4444' : '#2563eb'} 
              />
              <Text style={styles.optionText}>
                {song.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons 
                name={song.isDownloaded ? 'cloud-done-outline' : 'cloud-download-outline'} 
                size={24} 
                color="#2563eb" 
              />
              <Text style={styles.optionText}>
                {song.isDownloaded ? 'Remove Download' : 'Download for Offline'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="share-social-outline" size={24} color="#2563eb" />
              <Text style={styles.optionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Font Size Modal */}
      <Modal
        visible={showFontSizeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFontSizeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFontSizeModal(false)}
        >
          <View style={styles.fontSizeContainer}>
            <Text style={styles.fontSizeTitle}>Adjust Font Size</Text>
            
            <View style={styles.fontSizeControls}>
              <TouchableOpacity 
                style={styles.fontSizeButton} 
                onPress={() => setFontSize(Math.max(12, fontSize - 2))}
              >
                <Ionicons name="remove" size={24} color="#4b5563" />
              </TouchableOpacity>
              
              <Text style={styles.fontSizeValue}>{fontSize}</Text>
              
              <TouchableOpacity 
                style={styles.fontSizeButton} 
                onPress={() => setFontSize(Math.min(32, fontSize + 2))}
              >
                <Ionicons name="add" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.fontSizePreview, { fontSize }]}>Sample Text</Text>
            
            <TouchableOpacity 
              style={styles.fontSizeDoneButton} 
              onPress={() => setShowFontSizeModal(false)}
            >
              <Text style={styles.fontSizeDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Auto Scroll Modal */}
      <Modal
        visible={showAutoScrollModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAutoScrollModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAutoScrollModal(false)}
        >
          <View style={styles.autoScrollModalContainer}>
            <Text style={styles.autoScrollTitle}>Auto-Scroll Speed</Text>
            
            <Slider
              style={styles.autoScrollSlider}
              minimumValue={0.5}
              maximumValue={5}
              step={0.5}
              value={autoScrollSpeed}
              onValueChange={setAutoScrollSpeed}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#2563eb"
            />
            
            <View style={styles.autoScrollSpeedLabels}>
              <Text style={styles.autoScrollSpeedLabel}>Slow</Text>
              <Text style={styles.autoScrollSpeedValue}>{autoScrollSpeed.toFixed(1)}x</Text>
              <Text style={styles.autoScrollSpeedLabel}>Fast</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.autoScrollStartButton} 
              onPress={() => {
                toggleAutoScroll();
                setShowAutoScrollModal(false);
              }}
            >
              <Text style={styles.autoScrollStartButtonText}>
                {isAutoScrolling ? 'Stop Auto-Scroll' : 'Start Auto-Scroll'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  nightModeContainer: {
    backgroundColor: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  nightModeHeader: {
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginRight: 8,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  nightModeText: {
    color: '#f9fafb',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  nightModeSongInfo: {
    borderBottomColor: '#374151',
  },
  songAuthor: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  lyricsContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding at the bottom for controls
  },
  lyrics: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1f2937',
  },
  autoScrollControls: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  autoScrollButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoScrollStopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  nightModeBottomControls: {
    backgroundColor: '#111827',
    borderTopColor: '#374151',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 231, 235, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionText: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 16,
  },
  fontSizeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 32,
    alignItems: 'center',
  },
  fontSizeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fontSizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    width: 30,
    textAlign: 'center',
  },
  fontSizePreview: {
    color: '#4b5563',
    marginBottom: 16,
  },
  fontSizeDoneButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  fontSizeDoneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  autoScrollModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 32,
  },
  autoScrollTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  autoScrollSlider: {
    width: '100%',
    height: 40,
  },
  autoScrollSpeedLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  autoScrollSpeedLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  autoScrollSpeedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  autoScrollStartButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  autoScrollStartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});