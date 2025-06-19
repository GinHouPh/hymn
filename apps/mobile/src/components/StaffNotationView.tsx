import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, {
  G,
  Line,
  Circle,
  Path,
  Text as SvgText,
  Defs,
  ClipPath,
  Rect,
} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StaffNotationViewProps {
  songId: string;
  notationData?: NotationData;
  currentPosition?: number; // Current playback position in seconds
  onPositionChange?: (position: number) => void;
  isLoading?: boolean;
  error?: string;
}

interface NotationData {
  measures: Measure[];
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  tempo: number;
  title?: string;
  composer?: string;
}

interface Measure {
  id: string;
  notes: Note[];
  timeStart: number; // Start time in seconds
  timeEnd: number; // End time in seconds
}

interface Note {
  id: string;
  pitch: string; // e.g., 'C4', 'F#5'
  duration: number; // Note duration (1 = whole note, 0.5 = half note, etc.)
  position: number; // Position within measure (0-1)
  timeStart: number; // Absolute time in seconds
  timeEnd: number; // Absolute time in seconds
}

interface TimeSignature {
  numerator: number;
  denominator: number;
}

interface KeySignature {
  key: string; // e.g., 'C', 'G', 'F'
  mode: 'major' | 'minor';
  sharps: number;
  flats: number;
}

const STAFF_LINE_COUNT = 5;
const STAFF_LINE_SPACING = 12;
const MEASURE_WIDTH = 200;
const STAFF_HEIGHT = STAFF_LINE_SPACING * (STAFF_LINE_COUNT - 1);
const MARGIN = 40;

const StaffNotationView: React.FC<StaffNotationViewProps> = ({
  songId,
  notationData,
  currentPosition = 0,
  onPositionChange,
  isLoading = false,
  error,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  
  // State
  const [cachedNotation, setCachedNotation] = useState<string | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  
  // Refs
  const panRef = useRef();
  const pinchRef = useRef();
  
  // Load cached notation
  useEffect(() => {
    loadCachedNotation();
  }, [songId]);
  
  const loadCachedNotation = async () => {
    try {
      setIsLoadingCache(true);
      const cached = await AsyncStorage.getItem(`notation_cache_${songId}`);
      setCachedNotation(cached);
    } catch (error) {
      console.error('Error loading cached notation:', error);
    } finally {
      setIsLoadingCache(false);
    }
  };
  
  const saveCachedNotation = async (data: string) => {
    try {
      await AsyncStorage.setItem(`notation_cache_${songId}`, data);
      setCachedNotation(data);
    } catch (error) {
      console.error('Error saving cached notation:', error);
    }
  };
  
  // Gesture handlers
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = context.startScale * event.scale;
      scale.value = Math.max(0.5, Math.min(3, newScale));
      
      // Adjust translation to keep focal point centered
      const deltaX = (event.focalX - focalX.value) * (scale.value - 1);
      const deltaY = (event.focalY - focalY.value) * (scale.value - 1);
      
      translateX.value = translateX.value - deltaX;
      translateY.value = translateY.value - deltaY;
      
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    },
    onEnd: () => {
      scale.value = withSpring(Math.max(0.5, Math.min(3, scale.value)));
    },
  });
  
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const maxTranslateX = (screenWidth * scale.value - screenWidth) / 2;
      const maxTranslateY = (screenHeight * scale.value - screenHeight) / 2;
      
      translateX.value = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, context.startX + event.translationX)
      );
      translateY.value = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, context.startY + event.translationY)
      );
    },
  });
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  // Helper functions for rendering notation
  const getNoteY = (pitch: string): number => {
    const noteMap: { [key: string]: number } = {
      'C4': STAFF_HEIGHT + STAFF_LINE_SPACING,
      'D4': STAFF_HEIGHT + STAFF_LINE_SPACING / 2,
      'E4': STAFF_HEIGHT,
      'F4': STAFF_HEIGHT - STAFF_LINE_SPACING / 2,
      'G4': STAFF_HEIGHT - STAFF_LINE_SPACING,
      'A4': STAFF_HEIGHT - STAFF_LINE_SPACING * 1.5,
      'B4': STAFF_HEIGHT - STAFF_LINE_SPACING * 2,
      'C5': STAFF_HEIGHT - STAFF_LINE_SPACING * 2.5,
      'D5': STAFF_HEIGHT - STAFF_LINE_SPACING * 3,
      'E5': STAFF_HEIGHT - STAFF_LINE_SPACING * 3.5,
      'F5': STAFF_HEIGHT - STAFF_LINE_SPACING * 4,
    };
    return noteMap[pitch] || STAFF_HEIGHT;
  };
  
  const renderStaffLines = (measureIndex: number) => {
    const x = MARGIN + measureIndex * MEASURE_WIDTH;
    const lines = [];
    
    for (let i = 0; i < STAFF_LINE_COUNT; i++) {
      const y = MARGIN + i * STAFF_LINE_SPACING;
      lines.push(
        <Line
          key={`staff-${measureIndex}-${i}`}
          x1={x}
          y1={y}
          x2={x + MEASURE_WIDTH}
          y2={y}
          stroke="#000"
          strokeWidth={1}
        />
      );
    }
    
    return lines;
  };
  
  const renderNote = (note: Note, measureIndex: number) => {
    const x = MARGIN + measureIndex * MEASURE_WIDTH + note.position * MEASURE_WIDTH;
    const y = MARGIN + getNoteY(note.pitch);
    const isCurrentNote = currentPosition >= note.timeStart && currentPosition < note.timeEnd;
    
    return (
      <G key={note.id}>
        {/* Note head */}
        <Circle
          cx={x}
          cy={y}
          r={6}
          fill={isCurrentNote ? '#ff6b6b' : '#000'}
          stroke={isCurrentNote ? '#ff6b6b' : '#000'}
          strokeWidth={1}
        />
        
        {/* Note stem */}
        {note.duration < 1 && (
          <Line
            x1={x + 6}
            y1={y}
            x2={x + 6}
            y2={y - 30}
            stroke={isCurrentNote ? '#ff6b6b' : '#000'}
            strokeWidth={2}
          />
        )}
        
        {/* Note flag for eighth notes and shorter */}
        {note.duration <= 0.25 && (
          <Path
            d={`M ${x + 6} ${y - 30} Q ${x + 20} ${y - 25} ${x + 6} ${y - 15}`}
            fill={isCurrentNote ? '#ff6b6b' : '#000'}
          />
        )}
      </G>
    );
  };
  
  const renderMeasure = (measure: Measure, index: number) => {
    const isCurrentMeasure = currentPosition >= measure.timeStart && currentPosition < measure.timeEnd;
    
    return (
      <G key={measure.id}>
        {/* Staff lines */}
        {renderStaffLines(index)}
        
        {/* Measure separator */}
        <Line
          x1={MARGIN + index * MEASURE_WIDTH}
          y1={MARGIN}
          x2={MARGIN + index * MEASURE_WIDTH}
          y2={MARGIN + STAFF_HEIGHT}
          stroke="#000"
          strokeWidth={2}
        />
        
        {/* Current measure highlight */}
        {isCurrentMeasure && (
          <Rect
            x={MARGIN + index * MEASURE_WIDTH}
            y={MARGIN - 10}
            width={MEASURE_WIDTH}
            height={STAFF_HEIGHT + 20}
            fill="rgba(255, 107, 107, 0.1)"
            stroke="rgba(255, 107, 107, 0.3)"
            strokeWidth={2}
          />
        )}
        
        {/* Notes */}
        {measure.notes.map(note => renderNote(note, index))}
      </G>
    );
  };
  
  const renderKeySignature = () => {
    if (!notationData?.keySignature) return null;
    
    const { sharps, flats } = notationData.keySignature;
    const symbols = [];
    
    // Render sharps
    for (let i = 0; i < sharps; i++) {
      symbols.push(
        <SvgText
          key={`sharp-${i}`}
          x={MARGIN - 30 + i * 8}
          y={MARGIN + STAFF_HEIGHT / 2}
          fontSize={16}
          fill="#000"
          textAnchor="middle"
        >
          ♯
        </SvgText>
      );
    }
    
    // Render flats
    for (let i = 0; i < flats; i++) {
      symbols.push(
        <SvgText
          key={`flat-${i}`}
          x={MARGIN - 30 + i * 8}
          y={MARGIN + STAFF_HEIGHT / 2}
          fontSize={16}
          fill="#000"
          textAnchor="middle"
        >
          ♭
        </SvgText>
      );
    }
    
    return symbols;
  };
  
  const renderTimeSignature = () => {
    if (!notationData?.timeSignature) return null;
    
    const { numerator, denominator } = notationData.timeSignature;
    
    return (
      <G>
        <SvgText
          x={MARGIN - 15}
          y={MARGIN + STAFF_LINE_SPACING}
          fontSize={14}
          fill="#000"
          textAnchor="middle"
          fontWeight="bold"
        >
          {numerator}
        </SvgText>
        <SvgText
          x={MARGIN - 15}
          y={MARGIN + STAFF_LINE_SPACING * 3}
          fontSize={14}
          fill="#000"
          textAnchor="middle"
          fontWeight="bold"
        >
          {denominator}
        </SvgText>
      </G>
    );
  };
  
  const handleTap = useCallback((event: any) => {
    if (!notationData || !onPositionChange) return;
    
    const tapX = event.nativeEvent.locationX / scale.value - translateX.value / scale.value;
    const measureIndex = Math.floor((tapX - MARGIN) / MEASURE_WIDTH);
    const positionInMeasure = ((tapX - MARGIN) % MEASURE_WIDTH) / MEASURE_WIDTH;
    
    if (measureIndex >= 0 && measureIndex < notationData.measures.length) {
      const measure = notationData.measures[measureIndex];
      const targetTime = measure.timeStart + (measure.timeEnd - measure.timeStart) * positionInMeasure;
      onPositionChange(targetTime);
    }
  }, [notationData, onPositionChange, scale.value, translateX.value]);
  
  if (isLoading || isLoadingCache) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notation...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading notation</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }
  
  if (!notationData || !notationData.measures.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No notation available</Text>
      </View>
    );
  }
  
  const svgWidth = MARGIN * 2 + notationData.measures.length * MEASURE_WIDTH;
  const svgHeight = MARGIN * 2 + STAFF_HEIGHT;
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={pinchGestureHandler}
        simultaneousHandlers={panRef}
      >
        <Animated.View style={styles.gestureContainer}>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={panGestureHandler}
            simultaneousHandlers={pinchRef}
            minPointers={1}
            maxPointers={1}
          >
            <Animated.View style={[styles.svgContainer, animatedStyle]}>
              <Svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                onPress={handleTap}
              >
                <Defs>
                  <ClipPath id="staffClip">
                    <Rect x={0} y={0} width={svgWidth} height={svgHeight} />
                  </ClipPath>
                </Defs>
                
                <G clipPath="url(#staffClip)">
                  {/* Title */}
                  {notationData.title && (
                    <SvgText
                      x={svgWidth / 2}
                      y={20}
                      fontSize={18}
                      fill="#000"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {notationData.title}
                    </SvgText>
                  )}
                  
                  {/* Key signature */}
                  {renderKeySignature()}
                  
                  {/* Time signature */}
                  {renderTimeSignature()}
                  
                  {/* Measures */}
                  {notationData.measures.map((measure, index) => renderMeasure(measure, index))}
                  
                  {/* Final bar line */}
                  <Line
                    x1={MARGIN + notationData.measures.length * MEASURE_WIDTH}
                    y1={MARGIN}
                    x2={MARGIN + notationData.measures.length * MEASURE_WIDTH}
                    y2={MARGIN + STAFF_HEIGHT}
                    stroke="#000"
                    strokeWidth={3}
                  />
                </G>
              </Svg>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gestureContainer: {
    flex: 1,
  },
  svgContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default StaffNotationView;
export type { NotationData, Measure, Note, TimeSignature, KeySignature };