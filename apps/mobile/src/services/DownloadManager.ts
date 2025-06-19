import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';

// Conditional import for notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not installed. Notifications will be disabled.');
}

// Types
export interface DownloadableSong {
  id: string;
  number: number;
  title: string;
  lyricsUrl?: string;
  audioUrl?: string;
  notationUrl?: string;
  size?: {
    lyrics?: number; // in bytes
    audio?: number; // in bytes
    notation?: number; // in bytes
  };
}

export interface DownloadedSong {
  id: string;
  number: number;
  title: string;
  downloadDate: string;
  lyrics?: {
    localUri: string;
    size: number;
  };
  audio?: {
    localUri: string;
    size: number;
  };
  notation?: {
    localUri: string;
    size: number;
  };
  totalSize: number;
}

export interface DownloadProgress {
  songId: string;
  progress: number; // 0 to 1
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

export interface DownloadOptions {
  includeAudio?: boolean;
  includeNotation?: boolean;
  showNotification?: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  DOWNLOADED_SONGS: 'downloaded_songs',
  DOWNLOAD_SETTINGS: 'download_settings',
  DOWNLOAD_QUEUE: 'download_queue',
};

// File system directories
const BASE_DIRECTORY = FileSystem.documentDirectory + 'downloads/';
const LYRICS_DIRECTORY = BASE_DIRECTORY + 'lyrics/';
const AUDIO_DIRECTORY = BASE_DIRECTORY + 'audio/';
const NOTATION_DIRECTORY = BASE_DIRECTORY + 'notation/';

// Default download settings
export interface DownloadSettings {
  maxStorageSize: number;
  autoDownloadOnWifi: boolean;
  downloadAudioByDefault: boolean;
  downloadNotationByDefault: boolean;
  notifyOnComplete: boolean;
}

const DEFAULT_SETTINGS: DownloadSettings = {
  maxStorageSize: 500 * 1024 * 1024, // 500 MB
  autoDownloadOnWifi: false,
  downloadAudioByDefault: false,
  downloadNotationByDefault: false,
  notifyOnComplete: true,
};

// Initialize directories
export const initializeDownloadManager = async (): Promise<void> => {
  try {
    // Create base directories if they don't exist
    const directories = [BASE_DIRECTORY, LYRICS_DIRECTORY, AUDIO_DIRECTORY, NOTATION_DIRECTORY];
    
    for (const dir of directories) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
    }
    
    // Initialize settings if not already set
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_SETTINGS);
    if (!settings) {
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOAD_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    
    // Setup notification handler
    await setupNotifications();
    
    console.log('Download manager initialized successfully');
  } catch (error) {
    console.error('Error initializing download manager:', error);
    throw error;
  }
};

// Setup notifications for download progress and completion
const setupNotifications = async (): Promise<void> => {
  if (!Notifications) {
    console.warn('Notifications not available');
    return;
  }
  
  try {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
};

// Get all downloaded songs
export const getDownloadedSongs = async (): Promise<DownloadedSong[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting downloaded songs:', error);
    return [];
  }
};

// Check if a song is downloaded
export const isSongDownloaded = async (songId: string): Promise<boolean> => {
  try {
    const downloadedSongs = await getDownloadedSongs();
    return downloadedSongs.some(song => song.id === songId);
  } catch (error) {
    console.error('Error checking if song is downloaded:', error);
    return false;
  }
};

// Get a specific downloaded song
export const getDownloadedSong = async (songId: string): Promise<DownloadedSong | null> => {
  try {
    const downloadedSongs = await getDownloadedSongs();
    return downloadedSongs.find(song => song.id === songId) || null;
  } catch (error) {
    console.error('Error getting downloaded song:', error);
    return null;
  }
};

// Download a song
export const downloadSong = async (
  song: DownloadableSong,
  options: DownloadOptions = {},
  progressCallback?: (progress: DownloadProgress) => void
): Promise<DownloadedSong | null> => {
  let downloadedFiles: string[] = [];
  
  try {
    // Validate input
    if (!song || !song.id || !song.title) {
      throw new Error('Invalid song data');
    }
    
    // Check if we're online
    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }
    
    // Check if song is already downloaded
    const isAlreadyDownloaded = await isSongDownloaded(song.id);
    if (isAlreadyDownloaded) {
      return await getDownloadedSong(song.id);
    }
    
    // Get download settings
    const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_SETTINGS);
    const settings = settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS;
    
    // Check if we have enough storage
    const totalSize = calculateTotalSize(song, options);
    const currentUsage = await getCurrentStorageUsage();
    
    if (currentUsage + totalSize > settings.maxStorageSize) {
      throw new Error('Not enough storage space');
    }
    
    // Update progress
    if (progressCallback) {
      progressCallback({
        songId: song.id,
        progress: 0,
        status: 'downloading',
      });
    }
    
    // Create download record
    const downloadedSong: DownloadedSong = {
      id: song.id,
      number: song.number,
      title: song.title,
      downloadDate: new Date().toISOString(),
      totalSize: 0, // Will be updated as files are downloaded
    };
    
    // Download lyrics (always included)
    if (song.lyricsUrl) {
      const lyricsFileName = `${song.id}_lyrics.txt`;
      const lyricsUri = LYRICS_DIRECTORY + lyricsFileName;
      
      try {
        await FileSystem.downloadAsync(song.lyricsUrl, lyricsUri);
        downloadedFiles.push(lyricsUri);
        
        const lyricsInfo = await FileSystem.getInfoAsync(lyricsUri, { size: true });
        
        downloadedSong.lyrics = {
          localUri: lyricsUri,
          size: (lyricsInfo.exists && 'size' in lyricsInfo) ? lyricsInfo.size || 0 : 0,
        };
        
        downloadedSong.totalSize += (lyricsInfo.exists && 'size' in lyricsInfo) ? lyricsInfo.size || 0 : 0;
      } catch (error) {
        console.error('Error downloading lyrics:', error);
        throw new Error(`Failed to download lyrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Download audio if requested
    if (options.includeAudio && song.audioUrl) {
      const audioExtension = song.audioUrl.split('.').pop() || 'mp3';
      const audioFileName = `${song.id}_audio.${audioExtension}`;
      const audioUri = AUDIO_DIRECTORY + audioFileName;
      
      try {
        const downloadResumable = FileSystem.createDownloadResumable(
          song.audioUrl,
          audioUri,
          {},
          (downloadProgress) => {
            if (progressCallback && downloadProgress.totalBytesExpectedToWrite > 0) {
              const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
              progressCallback({
                songId: song.id,
                progress: Math.min(progress, 1),
                status: 'downloading',
              });
            }
          }
        );
        
        const result = await downloadResumable.downloadAsync();
        if (!result) {
          throw new Error('Download failed');
        }
        
        downloadedFiles.push(audioUri);
        
        const audioInfo = await FileSystem.getInfoAsync(audioUri, { size: true });
        
        downloadedSong.audio = {
          localUri: audioUri,
          size: (audioInfo.exists && 'size' in audioInfo) ? audioInfo.size || 0 : 0,
        };
        
        downloadedSong.totalSize += (audioInfo.exists && 'size' in audioInfo) ? audioInfo.size || 0 : 0;
      } catch (error) {
        console.error('Error downloading audio:', error);
        throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Download notation if requested
    if (options.includeNotation && song.notationUrl) {
      const notationExtension = song.notationUrl.split('.').pop() || 'pdf';
      const notationFileName = `${song.id}_notation.${notationExtension}`;
      const notationUri = NOTATION_DIRECTORY + notationFileName;
      
      try {
        await FileSystem.downloadAsync(song.notationUrl, notationUri);
        downloadedFiles.push(notationUri);
        
        const notationInfo = await FileSystem.getInfoAsync(notationUri, { size: true });
        
        downloadedSong.notation = {
          localUri: notationUri,
          size: (notationInfo.exists && 'size' in notationInfo) ? notationInfo.size || 0 : 0,
        };
        
        downloadedSong.totalSize += (notationInfo.exists && 'size' in notationInfo) ? notationInfo.size || 0 : 0;
      } catch (error) {
        console.error('Error downloading notation:', error);
        throw new Error(`Failed to download notation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Save to downloaded songs list
    const downloadedSongs = await getDownloadedSongs();
    downloadedSongs.push(downloadedSong);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS, JSON.stringify(downloadedSongs));
    
    // Show notification if requested
    if (options.showNotification && Notifications) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Download Complete',
            body: `"${song.title}" has been downloaded for offline use.`,
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
    
    // Update progress
    if (progressCallback) {
      progressCallback({
        songId: song.id,
        progress: 1,
        status: 'completed',
      });
    }
    
    return downloadedSong;
  } catch (error) {
    console.error('Error downloading song:', error);
    
    // Clean up any partially downloaded files
    for (const filePath of downloadedFiles) {
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch (cleanupError) {
        console.error('Error cleaning up file:', filePath, cleanupError);
      }
    }
    
    // Update progress with error
    if (progressCallback) {
      progressCallback({
        songId: song.id,
        progress: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Download failed',
      });
    }
    
    return null;
  }
};

// Delete a downloaded song
export const deleteSong = async (songId: string): Promise<boolean> => {
  try {
    const downloadedSong = await getDownloadedSong(songId);
    
    if (!downloadedSong) {
      return false;
    }
    
    // Delete lyrics file
    if (downloadedSong.lyrics) {
      await FileSystem.deleteAsync(downloadedSong.lyrics.localUri, { idempotent: true });
    }
    
    // Delete audio file
    if (downloadedSong.audio) {
      await FileSystem.deleteAsync(downloadedSong.audio.localUri, { idempotent: true });
    }
    
    // Delete notation file
    if (downloadedSong.notation) {
      await FileSystem.deleteAsync(downloadedSong.notation.localUri, { idempotent: true });
    }
    
    // Remove from downloaded songs list
    const downloadedSongs = await getDownloadedSongs();
    const updatedSongs = downloadedSongs.filter(song => song.id !== songId);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS, JSON.stringify(updatedSongs));
    
    return true;
  } catch (error) {
    console.error('Error deleting song:', error);
    return false;
  }
};

// Get download settings
export const getDownloadSettings = async (): Promise<DownloadSettings> => {
  try {
    const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_SETTINGS);
    return settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting download settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Update download settings
export const updateDownloadSettings = async (settings: Partial<DownloadSettings>): Promise<boolean> => {
  try {
    const currentSettings = await getDownloadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOAD_SETTINGS, JSON.stringify(updatedSettings));
    return true;
  } catch (error) {
    console.error('Error updating download settings:', error);
    return false;
  }
};

// Get current storage usage
export const getCurrentStorageUsage = async (): Promise<number> => {
  try {
    const downloadedSongs = await getDownloadedSongs();
    return downloadedSongs.reduce((total, song) => total + song.totalSize, 0);
  } catch (error) {
    console.error('Error getting current storage usage:', error);
    return 0;
  }
};

// Clear all downloads
export const clearAllDownloads = async (): Promise<boolean> => {
  try {
    const downloadedSongs = await getDownloadedSongs();
    
    // Delete all files
    for (const song of downloadedSongs) {
      await deleteSong(song.id);
    }
    
    // Clear downloaded songs list
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS, JSON.stringify([]));
    
    return true;
  } catch (error) {
    console.error('Error clearing all downloads:', error);
    return false;
  }
};

// Helper function to calculate total size of a download
const calculateTotalSize = (song: DownloadableSong, options: DownloadOptions): number => {
  let totalSize = 0;
  
  // Add lyrics size (always included)
  if (song.size?.lyrics) {
    totalSize += song.size.lyrics;
  }
  
  // Add audio size if requested
  if (options.includeAudio && song.size?.audio) {
    totalSize += song.size.audio;
  }
  
  // Add notation size if requested
  if (options.includeNotation && song.size?.notation) {
    totalSize += song.size.notation;
  }
  
  return totalSize;
};

// Check if we're online
export const isOnline = async (): Promise<boolean> => {
  try {
    const netInfo = await Network.getNetworkStateAsync();
    return netInfo.isConnected || false;
  } catch (error) {
    console.error('Error checking online status:', error);
    return false;
  }
};

// Check if we're on WiFi
export const isOnWifi = async (): Promise<boolean> => {
  try {
    const netInfo = await Network.getNetworkStateAsync();
    return netInfo.type === Network.NetworkStateType.WIFI;
  } catch (error) {
    console.error('Error checking WiFi status:', error);
    return false;
  }
};

// Sync offline changes when back online
export const syncOfflineChanges = async (): Promise<void> => {
  // In a real app, this would sync any offline changes with the server
  // For this example, we'll just log a message
  console.log('Syncing offline changes...');
};