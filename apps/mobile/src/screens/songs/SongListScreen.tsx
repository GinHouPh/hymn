import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';

// Types
type Song = {
  id: string;
  number: number;
  title: string;
  author?: string;
  category?: string;
  isFavorite: boolean;
  isDownloaded: boolean;
};

type Category = {
  id: string;
  name: string;
};

type SortOption = 'number' | 'title' | 'recent';

// Mock data for demonstration
const mockSongs: Song[] = Array.from({ length: 100 }, (_, i) => ({
  id: `song-${i + 1}`,
  number: i + 1,
  title: `Hymn ${i + 1}: ${['Amazing Grace', 'How Great Thou Art', 'Holy, Holy, Holy', 'Great Is Thy Faithfulness', 'Blessed Assurance'][i % 5]}`,
  author: ['John Newton', 'Stuart K. Hine', 'Reginald Heber', 'Thomas O. Chisholm', 'Fanny J. Crosby'][i % 5],
  category: ['Praise', 'Worship', 'Prayer', 'Communion', 'Salvation'][i % 5],
  isFavorite: i % 7 === 0,
  isDownloaded: i % 5 === 0,
}));

const mockCategories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'praise', name: 'Praise' },
  { id: 'worship', name: 'Worship' },
  { id: 'prayer', name: 'Prayer' },
  { id: 'communion', name: 'Communion' },
  { id: 'salvation', name: 'Salvation' },
];

export default function SongListScreen() {
  const navigation = useNavigation();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('number');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch songs on initial load
  useEffect(() => {
    fetchSongs();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [songs, searchQuery, selectedCategory, sortOption, showFavoritesOnly, showDownloadedOnly]);

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await SongService.getSongs();
      // setSongs(response.data);
      
      // For demo purposes, use mock data after a delay
      setTimeout(() => {
        setSongs(mockSongs);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSongs();
    setIsRefreshing(false);
  };

  const loadMoreSongs = async () => {
    if (isLoadingMore || !hasMoreData) return;

    try {
      setIsLoadingMore(true);
      // In a real app, this would be a paginated API call
      // const response = await SongService.getSongs({ page: page + 1 });
      // const newSongs = response.data;
      // setSongs(prevSongs => [...prevSongs, ...newSongs]);
      // setHasMoreData(newSongs.length > 0);
      
      // For demo purposes, simulate pagination
      setTimeout(() => {
        setPage(prevPage => prevPage + 1);
        setIsLoadingMore(false);
        // Stop loading more after page 3 for demo
        if (page >= 3) {
          setHasMoreData(false);
        }
      }, 1000);
    } catch (error) {
      console.error('Error loading more songs:', error);
      setIsLoadingMore(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  const applyFilters = () => {
    let result = [...songs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        song =>
          song.title.toLowerCase().includes(query) ||
          (song.author && song.author.toLowerCase().includes(query)) ||
          song.number.toString().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        song => song.category && song.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      result = result.filter(song => song.isFavorite);
    }

    // Apply downloaded filter
    if (showDownloadedOnly) {
      result = result.filter(song => song.isDownloaded);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortOption === 'number') {
        return a.number - b.number;
      } else if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }
      // For 'recent' sorting, we would need actual view timestamps
      // This is just a placeholder implementation
      return 0;
    });

    setFilteredSongs(result);
  };

  const toggleFavorite = (songId: string) => {
    setSongs(prevSongs =>
      prevSongs.map(song =>
        song.id === songId ? { ...song, isFavorite: !song.isFavorite } : song
      )
    );
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => navigation.navigate('SongView', { songId: item.id, songNumber: item.number })}
    >
      <View style={styles.songNumberContainer}>
        <Text style={styles.songNumber}>{item.number}</Text>
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.author && (
          <Text style={styles.songAuthor} numberOfLines={1}>
            {item.author}
          </Text>
        )}
      </View>
      <View style={styles.songActions}>
        {item.isDownloaded && (
          <Ionicons name="download" size={18} color="#2563eb" style={styles.icon} />
        )}
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={item.isFavorite ? '#ef4444' : '#6b7280'}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.footerText}>Loading more songs...</Text>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <>
          <Ionicons name="musical-notes-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Songs Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : showFavoritesOnly
              ? 'You have no favorite songs yet'
              : showDownloadedOnly
              ? 'You have no downloaded songs yet'
              : 'Try adjusting your filters'}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, number, or author"
            onChangeText={debouncedSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlashList
          data={mockCategories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={100}
          contentContainerStyle={styles.categoriesList}
        />

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={[styles.filterButton, showFavoritesOnly && styles.activeFilterButton]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Ionicons
              name={showFavoritesOnly ? 'heart' : 'heart-outline'}
              size={18}
              color={showFavoritesOnly ? '#ffffff' : '#6b7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, showDownloadedOnly && styles.activeFilterButton]}
            onPress={() => setShowDownloadedOnly(!showDownloadedOnly)}
          >
            <Ionicons
              name={showDownloadedOnly ? 'download' : 'download-outline'}
              size={18}
              color={showDownloadedOnly ? '#ffffff' : '#6b7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              // Cycle through sort options
              if (sortOption === 'number') setSortOption('title');
              else if (sortOption === 'title') setSortOption('recent');
              else setSortOption('number');
            }}
          >
            <Ionicons name="swap-vertical-outline" size={18} color="#6b7280" />
            <Text style={styles.sortButtonText}>
              {sortOption === 'number'
                ? 'Number'
                : sortOption === 'title'
                ? 'Title'
                : 'Recent'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlashList
        data={filteredSongs}
        renderItem={renderSongItem}
        keyExtractor={item => item.id}
        estimatedItemSize={70}
        contentContainerStyle={styles.songsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2563eb']} />
        }
        onEndReached={loadMoreSongs}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1f2937',
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedCategoryItem: {
    backgroundColor: '#2563eb',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginLeft: 4,
  },
  songsList: {
    paddingBottom: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  songNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  songNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  songAuthor: {
    fontSize: 14,
    color: '#6b7280',
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 16,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    height: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});