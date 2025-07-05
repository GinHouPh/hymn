import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

// Types
type DownloadedSong = {
  id: string;
  number: number;
  title: string;
  author?: string;
  category?: string;
  isFavorite: boolean;
  downloadedAt: Date;
  fileSize: string;
  filePath: string;
};

const DownloadsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [downloads, setDownloads] = useState<DownloadedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const loadDownloads = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Implement actual downloads loading logic
      // This is a placeholder - replace with actual file system check
      const mockDownloads: DownloadedSong[] = [];
      setDownloads(mockDownloads);
    } catch (error) {
      console.error('Error loading downloads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  }, [loadDownloads]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleSongPress = (song: DownloadedSong) => {
    // TODO: Navigate to song view
    // navigation.navigate('SongView', { songId: song.id, isOffline: true });
  };

  const toggleFavorite = async (songId: string) => {
    try {
      // TODO: Implement toggle favorite logic
      setDownloads(prev => 
        prev.map(song => 
          song.id === songId 
            ? { ...song, isFavorite: !song.isFavorite }
            : song
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteDownload = async (songId: string, title: string) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${title}" from your device?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingIds(prev => new Set(prev).add(songId));
              
              // TODO: Implement actual file deletion logic
              // Remove from local storage/file system
              
              setDownloads(prev => prev.filter(song => song.id !== songId));
            } catch (error) {
              console.error('Error deleting download:', error);
              Alert.alert('Error', 'Failed to delete the download. Please try again.');
            } finally {
              setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(songId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const renderSongItem = ({ item }: { item: DownloadedSong }) => {
    const isDeleting = deletingIds.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.songItem, isDeleting && styles.songItemDeleting]}
        onPress={() => handleSongPress(item)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <View style={styles.songContent}>
          <View style={styles.songInfo}>
            <Text style={styles.songNumber}>#{item.number}</Text>
            <View style={styles.songDetails}>
              <Text style={styles.songTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.author && (
                <Text style={styles.songAuthor} numberOfLines={1}>
                  {item.author}
                </Text>
              )}
              <View style={styles.downloadInfo}>
                <Text style={styles.fileSize}>{item.fileSize}</Text>
                <Text style={styles.downloadDate}>
                  Downloaded: {item.downloadedAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.songActions}>
            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              style={styles.actionButton}
              disabled={isDeleting}
            >
              <Ionicons
                name={item.isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={item.isFavorite ? '#FF6B6B' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteDownload(item.id, item.title)}
              style={styles.actionButton}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="download-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Downloads</Text>
      <Text style={styles.emptySubtitle}>
        Download songs to access them offline
      </Text>
    </View>
  );

  const getTotalSize = () => {
    // TODO: Calculate actual total size
    return '0 MB';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading downloads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        {downloads.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {downloads.length} songs • {getTotalSize()}
          </Text>
        )}
      </View>
      
      {downloads.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlashList
          data={downloads}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  songItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  songItemDeleting: {
    opacity: 0.5,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  songNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 40,
  },
  songDetails: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    lineHeight: 22,
  },
  songAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  downloadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  downloadDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DownloadsScreen;