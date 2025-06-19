import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
  Track,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import { Platform } from 'react-native';

// Define the track interface
export interface HymnTrack extends Track {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
  hymnNumber?: number;
  isDownloaded?: boolean;
}

// Setup the player
export const setupPlayer = async (): Promise<boolean> => {
  let isSetup = false;
  try {
    // Check if the player is already initialized
    await TrackPlayer.getState();
    isSetup = true;
  } catch {
    // Initialize the player
    await TrackPlayer.setupPlayer({
      // Android specific options
      androidStopForegroundOnPause: true,
    });

    // Define the capabilities of the player
    await TrackPlayer.updateOptions({
      // Media controls capabilities
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      // Capabilities that will show up when the notification is in the compact form on Android
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      // Icons for the notification on Android (if you don't like the default ones)
      // notification: {
      //   icon: require('../assets/notification-icon.png'),
      //   color: '#2563eb',
      // },
      // Notification behavior when the app is killed
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
    });

    isSetup = true;
  }

  return isSetup;
};

// Add a track to the queue
export const addTrack = async (track: HymnTrack): Promise<void> => {
  await TrackPlayer.add([track]);
};

// Replace the current queue with a new track
export const playTrack = async (track: HymnTrack): Promise<void> => {
  await TrackPlayer.reset();
  await TrackPlayer.add([track]);
  await TrackPlayer.play();
};

// Replace the current queue with multiple tracks
export const playTracks = async (tracks: HymnTrack[], initialIndex: number = 0): Promise<void> => {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(tracks[initialIndex].id);
  await TrackPlayer.play();
};

// Toggle play/pause
export const togglePlayback = async (playbackState: State): Promise<void> => {
  const currentTrack = await TrackPlayer.getActiveTrack();
  if (currentTrack !== null) {
    if (playbackState === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }
};

// Skip to a specific track by ID
export const skipToTrack = async (trackId: string): Promise<void> => {
  await TrackPlayer.skip(trackId);
};

// Skip to the next track
export const skipToNext = async (): Promise<void> => {
  await TrackPlayer.skipToNext();
};

// Skip to the previous track
export const skipToPrevious = async (): Promise<void> => {
  await TrackPlayer.skipToPrevious();
};

// Seek to a specific position
export const seekTo = async (position: number): Promise<void> => {
  await TrackPlayer.seekTo(position);
};

// Set the volume (0 to 1)
export const setVolume = async (volume: number): Promise<void> => {
  await TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
};

// Set the repeat mode
export const setRepeatMode = async (mode: RepeatMode): Promise<void> => {
  await TrackPlayer.setRepeatMode(mode);
};

// Stop playback and clear the queue
export const stopAndClear = async (): Promise<void> => {
  await TrackPlayer.stop();
  await TrackPlayer.reset();
};

// Get the current track
export const getCurrentTrack = async (): Promise<HymnTrack | null> => {
  return await TrackPlayer.getActiveTrack() as HymnTrack | null;
};

// Get all tracks in the queue
export const getQueue = async (): Promise<HymnTrack[]> => {
  return await TrackPlayer.getQueue() as HymnTrack[];
};

// Cache management
export const cacheTrack = async (track: HymnTrack): Promise<HymnTrack> => {
  // In a real app, this would download the file to local storage
  // and update the track URL to point to the local file
  
  // For this example, we'll just simulate caching by marking it as downloaded
  return {
    ...track,
    isDownloaded: true,
    // In a real implementation, you would change the URL to the local file path
    // url: `file://${localFilePath}`
  };
};

// Check if a track is cached
export const isTrackCached = async (trackId: string): Promise<boolean> => {
  // In a real app, this would check if the file exists in local storage
  // For this example, we'll just check if the track is in our queue and marked as downloaded
  const queue = await getQueue();
  const track = queue.find(t => t.id === trackId);
  return track?.isDownloaded || false;
};

// Remove a track from cache
export const removeCachedTrack = async (trackId: string): Promise<void> => {
  // In a real app, this would delete the file from local storage
  // For this example, we'll just simulate by updating the track in the queue
  const queue = await getQueue();
  const trackIndex = queue.findIndex(t => t.id === trackId);
  
  if (trackIndex !== -1) {
    const track = queue[trackIndex];
    const updatedTrack = {
      ...track,
      isDownloaded: false,
      // In a real implementation, you would change the URL back to the remote URL
      // url: `https://example.com/hymns/${trackId}.mp3`
    };
    
    await TrackPlayer.remove(trackIndex);
    await TrackPlayer.add(updatedTrack, trackIndex);
  }
};

// Get the total size of cached tracks
export const getCachedTracksSize = async (): Promise<number> => {
  // In a real app, this would calculate the total size of cached files
  // For this example, we'll just return a mock value
  return 0; // Mock value in bytes
};

// Clear all cached tracks
export const clearAllCachedTracks = async (): Promise<void> => {
  // In a real app, this would delete all cached files
  // For this example, we'll just reset the player
  await TrackPlayer.reset();
};

// Error handling
export const registerPlaybackError = (callback: (error: Error) => void): void => {
  useTrackPlayerEvents([Event.PlaybackError], (event) => {
    if (event.type === Event.PlaybackError) {
      callback(new Error(event.message));
    }
  });
};

// Export hooks for easy access
export { usePlaybackState, useProgress, useTrackPlayerEvents };

// Export events and states for reference
export { Event, State, RepeatMode };