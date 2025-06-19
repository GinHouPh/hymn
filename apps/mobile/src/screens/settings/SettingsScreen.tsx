import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';

import { useAuth } from '../../contexts/AuthContext';
import * as DownloadManager from '../../services/DownloadManager';

const SettingsScreen: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [fontSize, setFontSize] = useState(18);
  const [autoDownloadOnWifi, setAutoDownloadOnWifi] = useState(false);
  const [downloadAudio, setDownloadAudio] = useState(false);
  const [downloadNotation, setDownloadNotation] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 500 * 1024 * 1024, // 500 MB default
    songCount: 0,
  });
  
  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
  }, []);
  
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load theme preference
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark' | 'system');
      }
      
      // Load font size preference
      const savedFontSize = await AsyncStorage.getItem('font_size_preference');
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize, 10));
      }
      
      // Load download settings
      const downloadSettings = await DownloadManager.getDownloadSettings();
      setAutoDownloadOnWifi(downloadSettings.autoDownloadOnWifi);
      setDownloadAudio(downloadSettings.downloadAudioByDefault);
      setDownloadNotation(downloadSettings.downloadNotationByDefault);
      setNotificationsEnabled(downloadSettings.notifyOnComplete);
      
      // Load storage usage
      const usage = await DownloadManager.getCurrentStorageUsage();
      const downloadedSongs = await DownloadManager.getDownloadedSongs();
      
      setStorageUsage({
        used: usage,
        total: downloadSettings.maxStorageSize,
        songCount: downloadedSongs.length,
      });
      
      // Load biometric setting
      const biometricSetting = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(biometricSetting === 'true');
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    }
  };
  
  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };
  
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem('theme_preference', newTheme);
      
      // If user is authenticated, update their preferences
      if (user) {
        // In a real app, this would update the user's preferences on the server
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
      Alert.alert('Error', 'Failed to save theme preference.');
    }
  };
  
  const handleFontSizeChange = async (newSize: number) => {
    try {
      setFontSize(newSize);
      await AsyncStorage.setItem('font_size_preference', newSize.toString());
      
      // If user is authenticated, update their preferences
      if (user) {
        // In a real app, this would update the user's preferences on the server
      }
    } catch (error) {
      console.error('Error saving font size preference:', error);
      Alert.alert('Error', 'Failed to save font size preference.');
    }
  };
  
  const handleDownloadSettingChange = async (
    setting: 'autoDownloadOnWifi' | 'downloadAudio' | 'downloadNotation' | 'notifications',
    value: boolean
  ) => {
    try {
      switch (setting) {
        case 'autoDownloadOnWifi':
          setAutoDownloadOnWifi(value);
          await DownloadManager.updateDownloadSettings({ autoDownloadOnWifi: value });
          break;
        case 'downloadAudio':
          setDownloadAudio(value);
          await DownloadManager.updateDownloadSettings({ downloadAudioByDefault: value });
          break;
        case 'downloadNotation':
          setDownloadNotation(value);
          await DownloadManager.updateDownloadSettings({ downloadNotationByDefault: value });
          break;
        case 'notifications':
          setNotificationsEnabled(value);
          await DownloadManager.updateDownloadSettings({ notifyOnComplete: value });
          break;
      }
    } catch (error) {
      console.error(`Error updating ${setting}:`, error);
      Alert.alert('Error', `Failed to update ${setting} setting.`);
    }
  };
  
  const handleBiometricToggle = async () => {
    try {
      if (!biometricAvailable) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Your device does not support biometric authentication or you have not set it up in your device settings.'
        );
        return;
      }
      
      if (biometricEnabled) {
        // Disable biometric
        setBiometricEnabled(false);
        await AsyncStorage.setItem('biometric_enabled', 'false');
      } else {
        // Enable biometric with authentication
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use password',
        });
        
        if (result.success) {
          setBiometricEnabled(true);
          await AsyncStorage.setItem('biometric_enabled', 'true');
        }
      }
    } catch (error) {
      console.error('Error toggling biometric authentication:', error);
      Alert.alert('Error', 'Failed to update biometric authentication setting.');
    }
  };
  
  const handleClearDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      `Are you sure you want to delete all ${storageUsage.songCount} downloaded songs? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const success = await DownloadManager.clearAllDownloads();
              
              if (success) {
                // Update storage usage
                setStorageUsage(prev => ({
                  ...prev,
                  used: 0,
                  songCount: 0,
                }));
                
                Alert.alert('Success', 'All downloads have been cleared.');
              } else {
                throw new Error('Failed to clear downloads');
              }
            } catch (error) {
              console.error('Error clearing downloads:', error);
              Alert.alert('Error', 'Failed to clear downloads. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@hymnalapp.com?subject=Hymnal%20App%20Support');
  };
  
  const handlePrivacyPolicy = () => {
    Linking.openURL('https://hymnalapp.com/privacy');
  };
  
  const handleTermsOfService = () => {
    Linking.openURL('https://hymnalapp.com/terms');
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const getStoragePercentage = () => {
    return Math.min(100, Math.round((storageUsage.used / storageUsage.total) * 100));
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        {/* Account Section */}
        {isAuthenticated ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.accountInfo}>
              <View style={styles.accountAvatar}>
                <Text style={styles.avatarText}>{user?.name.charAt(0) || 'U'}</Text>
              </View>
              
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{user?.name}</Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            {biometricAvailable && (
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Ionicons name="finger-print" size={22} color="#2563eb" style={styles.settingIcon} />
                  <Text style={styles.settingLabel}>Biometric Login</Text>
                </View>
                
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={biometricEnabled ? '#2563eb' : '#f3f4f6'}
                />
              </View>
            )}
            
            <TouchableOpacity style={[styles.settingButton, styles.logoutButton]} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.authPrompt}>
              <Text style={styles.authPromptText}>
                Sign in to sync your favorites and settings across devices.
              </Text>
              
              <TouchableOpacity style={styles.authButton}>
                <Text style={styles.authButtonText}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.authSecondaryButton}>
                <Text style={styles.authSecondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <Text style={styles.settingGroupLabel}>Theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity 
              style={[styles.themeOption, theme === 'light' && styles.themeOptionSelected]}
              onPress={() => handleThemeChange('light')}
            >
              <View style={styles.themePreview}>
                <View style={styles.themePreviewLight} />
              </View>
              <Text style={styles.themeOptionText}>Light</Text>
              {theme === 'light' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" style={styles.themeSelectedIcon} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.themeOption, theme === 'dark' && styles.themeOptionSelected]}
              onPress={() => handleThemeChange('dark')}
            >
              <View style={styles.themePreview}>
                <View style={styles.themePreviewDark} />
              </View>
              <Text style={styles.themeOptionText}>Dark</Text>
              {theme === 'dark' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" style={styles.themeSelectedIcon} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.themeOption, theme === 'system' && styles.themeOptionSelected]}
              onPress={() => handleThemeChange('system')}
            >
              <View style={styles.themePreview}>
                <View style={styles.themePreviewSystem}>
                  <View style={styles.themePreviewSystemLight} />
                  <View style={styles.themePreviewSystemDark} />
                </View>
              </View>
              <Text style={styles.themeOptionText}>System</Text>
              {theme === 'system' && (
                <Ionicons name="checkmark-circle" size={20} color="#2563eb" style={styles.themeSelectedIcon} />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.settingGroupLabel}>Font Size</Text>
          <View style={styles.fontSizeContainer}>
            <TouchableOpacity 
              style={styles.fontSizeButton}
              onPress={() => handleFontSizeChange(Math.max(12, fontSize - 2))}
            >
              <Ionicons name="remove" size={20} color="#4b5563" />
            </TouchableOpacity>
            
            <View style={styles.fontSizePreview}>
              <Text style={[styles.fontSizePreviewText, { fontSize }]}>Aa</Text>
              <Text style={styles.fontSizeValue}>{fontSize}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.fontSizeButton}
              onPress={() => handleFontSizeChange(Math.min(24, fontSize + 2))}
            >
              <Ionicons name="add" size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Downloads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          
          <View style={styles.storageContainer}>
            <View style={styles.storageInfo}>
              <Text style={styles.storageTitle}>Storage Usage</Text>
              <Text style={styles.storageText}>
                {formatBytes(storageUsage.used)} of {formatBytes(storageUsage.total)} used
              </Text>
            </View>
            
            <View style={styles.storageBarContainer}>
              <View style={[styles.storageBar, { width: `${getStoragePercentage()}%` }]} />
            </View>
            
            <Text style={styles.songCountText}>
              {storageUsage.songCount} {storageUsage.songCount === 1 ? 'song' : 'songs'} downloaded
            </Text>
            
            {storageUsage.songCount > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearDownloads}>
                <Text style={styles.clearButtonText}>Clear All Downloads</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="wifi" size={22} color="#2563eb" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Auto-download on Wi-Fi</Text>
            </View>
            
            <Switch
              value={autoDownloadOnWifi}
              onValueChange={(value) => handleDownloadSettingChange('autoDownloadOnWifi', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={autoDownloadOnWifi ? '#2563eb' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="musical-notes" size={22} color="#2563eb" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Download audio by default</Text>
            </View>
            
            <Switch
              value={downloadAudio}
              onValueChange={(value) => handleDownloadSettingChange('downloadAudio', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={downloadAudio ? '#2563eb' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="document-text" size={22} color="#2563eb" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Download notation by default</Text>
            </View>
            
            <Switch
              value={downloadNotation}
              onValueChange={(value) => handleDownloadSettingChange('downloadNotation', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={downloadNotation ? '#2563eb' : '#f3f4f6'}
            />
          </View>
        </View>
        
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications" size={22} color="#2563eb" style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Download notifications</Text>
            </View>
            
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => handleDownloadSettingChange('notifications', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={notificationsEnabled ? '#2563eb' : '#f3f4f6'}
            />
          </View>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutContainer}>
            <Text style={styles.appName}>Hymnal App</Text>
            <Text style={styles.appVersion}>
              Version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
            </Text>
          </View>
          
          <TouchableOpacity style={styles.settingButton} onPress={handleContactSupport}>
            <Text style={styles.settingButtonText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton} onPress={handlePrivacyPolicy}>
            <Text style={styles.settingButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton} onPress={handleTermsOfService}>
            <Text style={styles.settingButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  accountDetails: {
    marginLeft: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  accountEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ef4444',
  },
  authPrompt: {
    padding: 16,
    alignItems: 'center',
  },
  authPromptText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  authButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  authSecondaryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  authSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  settingGroupLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  themeOptionSelected: {
    backgroundColor: '#f3f4f6',
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 8,
  },
  themePreviewLight: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  themePreviewDark: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  themePreviewSystem: {
    flex: 1,
    flexDirection: 'row',
  },
  themePreviewSystemLight: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  themePreviewSystemDark: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  themeOptionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  themeSelectedIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fontSizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizePreview: {
    alignItems: 'center',
  },
  fontSizePreviewText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  fontSizeValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  storageContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  storageText: {
    fontSize: 14,
    color: '#6b7280',
  },
  storageBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  songCountText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default SettingsScreen;