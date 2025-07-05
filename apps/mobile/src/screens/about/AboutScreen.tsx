import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen: React.FC = () => {
  const appVersion = '1.0.0'; // TODO: Get from app.json or package.json
  const buildNumber = '1'; // TODO: Get from app.json

  const handleEmailPress = async () => {
    const email = 'support@hymnapp.com'; // TODO: Replace with actual support email
    const subject = 'Hymn App Support';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email client');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client');
    }
  };

  const handleWebsitePress = async () => {
    const url = 'https://hymnapp.com'; // TODO: Replace with actual website
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open website');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open website');
    }
  };

  const handlePrivacyPress = async () => {
    const url = 'https://hymnapp.com/privacy'; // TODO: Replace with actual privacy policy URL
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open privacy policy');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open privacy policy');
    }
  };

  const handleTermsPress = async () => {
    const url = 'https://hymnapp.com/terms'; // TODO: Replace with actual terms URL
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open terms of service');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open terms of service');
    }
  };

  const renderInfoItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.infoItem, !onPress && styles.infoItemDisabled]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle}>{subtitle}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>About</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Ionicons name="musical-notes" size={48} color="#fff" />
            </View>
            <Text style={styles.appName}>Hymn App</Text>
            <Text style={styles.appDescription}>
              Your digital hymnal for worship and praise
            </Text>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.section}>
          {renderInfoItem(
            'information-circle-outline',
            'Version',
            `${appVersion} (${buildNumber})`
          )}
        </View>

        {/* Contact & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderInfoItem(
            'mail-outline',
            'Contact Support',
            'Get help with the app',
            handleEmailPress
          )}
          {renderInfoItem(
            'globe-outline',
            'Website',
            'Visit our website',
            handleWebsitePress
          )}
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          {renderInfoItem(
            'shield-checkmark-outline',
            'Privacy Policy',
            'How we protect your data',
            handlePrivacyPress
          )}
          {renderInfoItem(
            'document-text-outline',
            'Terms of Service',
            'Terms and conditions',
            handleTermsPress
          )}
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits</Text>
          <View style={styles.creditsContainer}>
            <Text style={styles.creditsText}>
              This app is made possible by the contributions of hymn writers, 
              composers, and the community of believers who have preserved 
              these sacred songs throughout history.
            </Text>
            <Text style={styles.creditsText}>
              Special thanks to all the contributors and supporters who made 
              this project possible.
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.footer}>
          <Text style={styles.copyrightText}>
            © 2024 Hymn App. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  appIconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoItemDisabled: {
    backgroundColor: '#FAFAFA',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  creditsContainer: {
    paddingHorizontal: 20,
  },
  creditsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default AboutScreen;