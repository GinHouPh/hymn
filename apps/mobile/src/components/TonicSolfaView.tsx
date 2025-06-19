import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface TonicSolfaViewProps {
  songId: string;
  solfaData?: SolfaData;
  currentPosition?: number; // Current playback position in seconds
  onPositionChange?: (position: number) => void;
  isLoading?: boolean;
  error?: string;
  autoScroll?: boolean;
}

interface SolfaData {
  verses: SolfaVerse[];
  chorus?: SolfaVerse;
  key: string;
  timeSignature: string;
  tempo: number;
  title?: string;
  composer?: string;
}

interface SolfaVerse {
  id: string;
  title: string;
  lines: SolfaLine[];
  timeStart: number;
  timeEnd: number;
}

interface SolfaLine {
  id: string;
  syllables: SolfaSyllable[];
  timeStart: number;
  timeEnd: number;
}

interface SolfaSyllable {
  id: string;
  text: string;
  solfa: string; // e.g., 'do', 'ray', 'me', 'fah', 'soh', 'lah', 'te'
  octave?: number; // 1 = low, 2 = middle, 3 = high
  duration: number;
  timeStart: number;
  timeEnd: number;
  isAccented?: boolean;
}

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_DEFAULT = 16;
const LINE_HEIGHT_MULTIPLIER = 1.8;
const SYLLABLE_SPACING = 8;
const LINE_SPACING = 24;
const VERSE_SPACING = 32;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const TonicSolfaView: React.FC<TonicSolfaViewProps> = ({
  songId,
  solfaData,
  currentPosition = 0,
  onPositionChange,
  isLoading = false,
  error,
  autoScroll = true,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // State
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT);
  const [cachedSolfa, setCachedSolfa] = useState<string | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [syllablePositions, setSyllablePositions] = useState<{ [key: string]: { x: number; y: number; width: number; height: number } }>({});
  
  // Animation values
  const scrollY = useSharedValue(0);
  const highlightOpacity = useSharedValue(0);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const currentSyllableRef = useRef<string | null>(null);
  
  // Load cached solfa data
  useEffect(() => {
    loadCachedSolfa();
    loadFontSize();
  }, [songId]);
  
  // Auto-scroll to current position
  useEffect(() => {
    if (autoScroll && solfaData && currentPosition > 0) {
      scrollToCurrentPosition();
    }
  }, [currentPosition, autoScroll, solfaData]);
  
  const loadCachedSolfa = async () => {
    try {
      setIsLoadingCache(true);
      const cached = await AsyncStorage.getItem(`solfa_cache_${songId}`);
      setCachedSolfa(cached);
    } catch (error) {
      console.error('Error loading cached solfa:', error);
    } finally {
      setIsLoadingCache(false);
    }
  };
  
  const saveCachedSolfa = async (data: string) => {
    try {
      await AsyncStorage.setItem(`solfa_cache_${songId}`, data);
      setCachedSolfa(data);
    } catch (error) {
      console.error('Error saving cached solfa:', error);
    }
  };
  
  const loadFontSize = async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('solfa_font_size');
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize, 10));
      }
    } catch (error) {
      console.error('Error loading font size:', error);
    }
  };
  
  const saveFontSize = async (size: number) => {
    try {
      await AsyncStorage.setItem('solfa_font_size', size.toString());
      setFontSize(size);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  };
  
  const scrollToCurrentPosition = useCallback(() => {
    if (!solfaData || !scrollViewRef.current) return;
    
    const currentSyllable = getCurrentSyllable();
    if (!currentSyllable || !syllablePositions[currentSyllable.id]) return;
    
    const position = syllablePositions[currentSyllable.id];
    const targetY = Math.max(0, position.y - screenHeight / 3);
    
    scrollViewRef.current.scrollTo({
      y: targetY,
      animated: true,
    });
  }, [solfaData, currentPosition, syllablePositions, screenHeight]);
  
  const getCurrentSyllable = useCallback((): SolfaSyllable | null => {
    if (!solfaData) return null;
    
    for (const verse of solfaData.verses) {
      if (currentPosition >= verse.timeStart && currentPosition < verse.timeEnd) {
        for (const line of verse.lines) {
          if (currentPosition >= line.timeStart && currentPosition < line.timeEnd) {
            for (const syllable of line.syllables) {
              if (currentPosition >= syllable.timeStart && currentPosition < syllable.timeEnd) {
                return syllable;
              }
            }
          }
        }
      }
    }
    
    // Check chorus
    if (solfaData.chorus && currentPosition >= solfaData.chorus.timeStart && currentPosition < solfaData.chorus.timeEnd) {
      for (const line of solfaData.chorus.lines) {
        if (currentPosition >= line.timeStart && currentPosition < line.timeEnd) {
          for (const syllable of line.syllables) {
            if (currentPosition >= syllable.timeStart && currentPosition < syllable.timeEnd) {
              return syllable;
            }
          }
        }
      }
    }
    
    return null;
  }, [solfaData, currentPosition]);
  
  const handleSyllableLayout = useCallback((syllableId: string, layout: { x: number; y: number; width: number; height: number }) => {
    setSyllablePositions(prev => ({
      ...prev,
      [syllableId]: layout,
    }));
  }, []);
  
  const handleSyllablePress = useCallback((syllable: SolfaSyllable) => {
    if (onPositionChange) {
      onPositionChange(syllable.timeStart);
    }
  }, [onPositionChange]);
  
  const adjustFontSize = useCallback((delta: number) => {
    const newSize = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, fontSize + delta));
    saveFontSize(newSize);
  }, [fontSize]);
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  
  const getSolfaSymbol = (solfa: string, octave?: number): string => {
    const symbols: { [key: string]: string } = {
      'do': 'd',
      'ray': 'r',
      'me': 'm',
      'fah': 'f',
      'soh': 's',
      'lah': 'l',
      'te': 't',
    };
    
    let symbol = symbols[solfa.toLowerCase()] || solfa;
    
    // Add octave indicators
    if (octave === 1) {
      symbol = symbol.toLowerCase(); // Low octave
    } else if (octave === 3) {
      symbol = symbol.toUpperCase() + "'"; // High octave
    } else {
      symbol = symbol.toUpperCase(); // Middle octave
    }
    
    return symbol;
  };
  
  const renderSyllable = (syllable: SolfaSyllable, lineIndex: number, syllableIndex: number) => {
    const isCurrentSyllable = currentPosition >= syllable.timeStart && currentPosition < syllable.timeEnd;
    const solfaSymbol = getSolfaSymbol(syllable.solfa, syllable.octave);
    
    return (
      <TouchableOpacity
        key={syllable.id}
        style={[
          styles.syllableContainer,
          { marginRight: SYLLABLE_SPACING },
          isCurrentSyllable && styles.currentSyllableContainer,
        ]}
        onPress={() => handleSyllablePress(syllable)}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          handleSyllableLayout(syllable.id, { x, y, width, height });
        }}
      >
        <Text
          style={[
            styles.solfaText,
            {
              fontSize: fontSize * 1.2,
              lineHeight: fontSize * 1.2 * LINE_HEIGHT_MULTIPLIER,
            },
            isCurrentSyllable && styles.currentSolfaText,
            syllable.isAccented && styles.accentedSolfaText,
          ]}
        >
          {solfaSymbol}
        </Text>
        <Text
          style={[
            styles.lyricsText,
            {
              fontSize: fontSize,
              lineHeight: fontSize * LINE_HEIGHT_MULTIPLIER,
            },
            isCurrentSyllable && styles.currentLyricsText,
          ]}
        >
          {syllable.text}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderLine = (line: SolfaLine, verseIndex: number, lineIndex: number) => {
    const isCurrentLine = currentPosition >= line.timeStart && currentPosition < line.timeEnd;
    
    return (
      <View
        key={line.id}
        style={[
          styles.lineContainer,
          { marginBottom: LINE_SPACING },
          isCurrentLine && styles.currentLineContainer,
        ]}
      >
        <View style={styles.syllablesRow}>
          {line.syllables.map((syllable, syllableIndex) =>
            renderSyllable(syllable, lineIndex, syllableIndex)
          )}
        </View>
      </View>
    );
  };
  
  const renderVerse = (verse: SolfaVerse, index: number) => {
    const isCurrentVerse = currentPosition >= verse.timeStart && currentPosition < verse.timeEnd;
    
    return (
      <View
        key={verse.id}
        style={[
          styles.verseContainer,
          { marginBottom: VERSE_SPACING },
          isCurrentVerse && styles.currentVerseContainer,
        ]}
      >
        <Text style={[styles.verseTitle, { fontSize: fontSize * 1.1 }]}>
          {verse.title}
        </Text>
        {verse.lines.map((line, lineIndex) => renderLine(line, index, lineIndex))}
      </View>
    );
  };
  
  const renderFontControls = () => (
    <View style={styles.fontControls}>
      <TouchableOpacity
        style={[styles.fontButton, fontSize <= FONT_SIZE_MIN && styles.fontButtonDisabled]}
        onPress={() => adjustFontSize(-2)}
        disabled={fontSize <= FONT_SIZE_MIN}
      >
        <Ionicons name="remove" size={20} color={fontSize <= FONT_SIZE_MIN ? '#ccc' : '#007AFF'} />
      </TouchableOpacity>
      
      <Text style={styles.fontSizeText}>{fontSize}px</Text>
      
      <TouchableOpacity
        style={[styles.fontButton, fontSize >= FONT_SIZE_MAX && styles.fontButtonDisabled]}
        onPress={() => adjustFontSize(2)}
        disabled={fontSize >= FONT_SIZE_MAX}
      >
        <Ionicons name="add" size={20} color={fontSize >= FONT_SIZE_MAX ? '#ccc' : '#007AFF'} />
      </TouchableOpacity>
    </View>
  );
  
  if (isLoading || isLoadingCache) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sol-fa notation...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading sol-fa notation</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }
  
  if (!solfaData || !solfaData.verses.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sol-fa notation available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {solfaData.title && (
          <Text style={[styles.title, { fontSize: fontSize * 1.3 }]}>
            {solfaData.title}
          </Text>
        )}
        {solfaData.composer && (
          <Text style={[styles.composer, { fontSize: fontSize * 0.9 }]}>
            {solfaData.composer}
          </Text>
        )}
        <View style={styles.keyInfo}>
          <Text style={[styles.keyText, { fontSize: fontSize * 0.8 }]}>
            Key: {solfaData.key} | Time: {solfaData.timeSignature} | Tempo: {solfaData.tempo}
          </Text>
        </View>
      </View>
      
      {/* Font Controls */}
      {renderFontControls()}
      
      {/* Content */}
      <AnimatedScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        {/* Verses */}
        {solfaData.verses.map((verse, index) => renderVerse(verse, index))}
        
        {/* Chorus */}
        {solfaData.chorus && (
          <View style={styles.chorusSection}>
            <Text style={[styles.chorusLabel, { fontSize: fontSize * 1.1 }]}>Chorus</Text>
            {renderVerse(solfaData.chorus, -1)}
          </View>
        )}
      </AnimatedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  composer: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  keyInfo: {
    alignItems: 'center',
  },
  keyText: {
    color: '#888',
  },
  fontControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fontButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  fontButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  verseContainer: {
    backgroundColor: '#fff',
  },
  currentVerseContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: -8,
  },
  verseTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  lineContainer: {
    backgroundColor: 'transparent',
  },
  currentLineContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 6,
    padding: 4,
    marginHorizontal: -4,
  },
  syllablesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  syllableContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  currentSyllableContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  solfaText: {
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  currentSolfaText: {
    color: '#ff6b6b',
  },
  accentedSolfaText: {
    textDecorationLine: 'underline',
  },
  lyricsText: {
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
  currentLyricsText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  chorusSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  chorusLabel: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default TonicSolfaView;
export type { SolfaData, SolfaVerse, SolfaLine, SolfaSyllable };