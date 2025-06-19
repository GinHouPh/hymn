import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  StatusBar,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import the view components
import StaffNotationView, { NotationData } from './StaffNotationView';
import TonicSolfaView, { SolfaData } from './TonicSolfaView';

interface ViewSwitcherProps {
  songId: string;
  lyricsContent?: string;
  notationData?: NotationData;
  solfaData?: SolfaData;
  currentPosition?: number;
  onPositionChange?: (position: number) => void;
  isLoading?: boolean;
  error?: string;
  initialView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

export type ViewType = 'lyrics' | 'notation' | 'solfa';

interface ViewConfig {
  id: ViewType;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_HEIGHT = 50;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ANIMATION_DURATION = 300;

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  songId,
  lyricsContent,
  notationData,
  solfaData,
  currentPosition = 0,
  onPositionChange,
  isLoading = false,
  error,
  initialView = 'lyrics',
  onViewChange,
}) => {
  // State
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Animation values
  const translateX = useSharedValue(0);
  const tabIndicatorX = useSharedValue(0);
  const gestureActive = useSharedValue(false);
  
  // Refs
  const scrollViewRef = useRef<any>(null);
  
  // View configurations
  const viewConfigs: ViewConfig[] = [
    {
      id: 'lyrics',
      title: 'Lyrics',
      icon: 'musical-notes-outline',
      component: LyricsView,
    },
    {
      id: 'notation',
      title: 'Staff',
      icon: 'library-outline',
      component: StaffNotationView,
    },
    {
      id: 'solfa',
      title: 'Sol-fa',
      icon: 'text-outline',
      component: TonicSolfaView,
    },
  ];
  
  const currentViewIndex = viewConfigs.findIndex(config => config.id === currentView);
  
  // Load saved view preference
  useEffect(() => {
    loadSavedView();
  }, [songId]);
  
  // Update tab indicator position when view changes
  useEffect(() => {
    const targetX = currentViewIndex * (SCREEN_WIDTH / viewConfigs.length);
    tabIndicatorX.value = withTiming(targetX, { duration: ANIMATION_DURATION });
    translateX.value = withTiming(-currentViewIndex * SCREEN_WIDTH, { duration: ANIMATION_DURATION });
  }, [currentViewIndex]);
  
  const loadSavedView = async () => {
    try {
      const savedView = await AsyncStorage.getItem(`song_view_${songId}`);
      if (savedView && viewConfigs.some(config => config.id === savedView)) {
        setCurrentView(savedView as ViewType);
      }
    } catch (error) {
      console.error('Error loading saved view:', error);
    }
  };
  
  const saveViewPreference = async (view: ViewType) => {
    try {
      await AsyncStorage.setItem(`song_view_${songId}`, view);
    } catch (error) {
      console.error('Error saving view preference:', error);
    }
  };
  
  const switchToView = useCallback((view: ViewType) => {
    if (view === currentView || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentView(view);
    saveViewPreference(view);
    
    if (onViewChange) {
      onViewChange(view);
    }
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, ANIMATION_DURATION);
  }, [currentView, isTransitioning, onViewChange]);
  
  const handleSwipeGesture = useAnimatedGestureHandler({
    onStart: () => {
      gestureActive.value = true;
    },
    onActive: (event) => {
      const newTranslateX = -currentViewIndex * SCREEN_WIDTH + event.translationX;
      const minTranslateX = -(viewConfigs.length - 1) * SCREEN_WIDTH;
      const maxTranslateX = 0;
      
      translateX.value = Math.max(minTranslateX, Math.min(maxTranslateX, newTranslateX));
    },
    onEnd: (event) => {
      gestureActive.value = false;
      
      const velocity = event.velocityX;
      const translation = event.translationX;
      
      let targetIndex = currentViewIndex;
      
      // Determine target view based on swipe distance and velocity
      if (Math.abs(translation) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
        if (translation > 0 && velocity >= 0) {
          // Swipe right - go to previous view
          targetIndex = Math.max(0, currentViewIndex - 1);
        } else if (translation < 0 && velocity <= 0) {
          // Swipe left - go to next view
          targetIndex = Math.min(viewConfigs.length - 1, currentViewIndex + 1);
        }
      }
      
      // Animate to target position
      translateX.value = withSpring(-targetIndex * SCREEN_WIDTH, {
        velocity: velocity * 0.5,
        damping: 20,
        stiffness: 90,
      });
      
      // Update current view if changed
      if (targetIndex !== currentViewIndex) {
        const newView = viewConfigs[targetIndex].id;
        runOnJS(switchToView)(newView);
      }
    },
  });
  
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
  const tabIndicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabIndicatorX.value }],
    };
  });
  
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <Reanimated.View style={[styles.tabIndicator, tabIndicatorAnimatedStyle]} />
      {viewConfigs.map((config, index) => {
        const isActive = config.id === currentView;
        
        return (
          <TouchableOpacity
            key={config.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => switchToView(config.id)}
            disabled={isTransitioning}
          >
            <Ionicons
              name={config.icon as any}
              size={20}
              color={isActive ? '#007AFF' : '#666'}
            />
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {config.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
  
  const renderView = (config: ViewConfig, index: number) => {
    const Component = config.component;
    
    const commonProps = {
      songId,
      currentPosition,
      onPositionChange,
      isLoading,
      error,
    };
    
    let specificProps = {};
    
    switch (config.id) {
      case 'lyrics':
        specificProps = { content: lyricsContent };
        break;
      case 'notation':
        specificProps = { notationData };
        break;
      case 'solfa':
        specificProps = { solfaData };
        break;
    }
    
    return (
      <View key={config.id} style={styles.viewContainer}>
        <Component {...commonProps} {...specificProps} />
      </View>
    );
  };
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Tab Bar */}
      {renderTabBar()}
      
      {/* Content Views */}
      <PanGestureHandler
        onGestureEvent={handleSwipeGesture}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Reanimated.View style={styles.contentContainer}>
          <Reanimated.View style={[styles.viewsWrapper, containerAnimatedStyle]}>
            {viewConfigs.map((config, index) => renderView(config, index))}
          </Reanimated.View>
        </Reanimated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

// Simple Lyrics View Component
const LyricsView: React.FC<{
  songId: string;
  content?: string;
  currentPosition?: number;
  onPositionChange?: (position: number) => void;
  isLoading?: boolean;
  error?: string;
}> = ({ content, isLoading, error }) => {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading lyrics...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading lyrics</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }
  
  if (!content) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No lyrics available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.lyricsContainer}>
      <Text style={styles.lyricsText}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: SCREEN_WIDTH / 3,
    backgroundColor: '#007AFF',
    borderRadius: 1.5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  viewsWrapper: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3, // 3 views
    height: '100%',
  },
  viewContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lyricsContainer: {
    flex: 1,
    padding: 16,
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
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
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ViewSwitcher;
export type { ViewSwitcherProps };