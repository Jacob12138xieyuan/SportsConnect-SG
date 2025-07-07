import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { sessionsAPI } from '../services/api';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch user's session data and statistics in one optimized call
  const { data: userSessionData = { hostedSessions: [], joinedSessions: [], stats: { hosted: 0, joined: 0, total: 0 } } } = useQuery({
    queryKey: ['userSessionData', user?.id],
    queryFn: sessionsAPI.getUserSessionData,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    enabled: !!user?.id, // Only run query when user is available
  });

  const { stats: userStats } = userSessionData;

  // Prefetch data when component mounts to ensure it's available for navigation
  useEffect(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: ['userSessionData', user.id],
        queryFn: sessionsAPI.getUserSessionData,
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await import('expo-secure-store').then(store => store.getItemAsync('token'))}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update user context with new profile picture URL
      if (updateUser) {
        updateUser({ ...user, profilePicture: data.profilePictureUrl });
      }
      Alert.alert('Success', 'Profile picture updated successfully!');
    },
    onError: (error) => {
      console.error('Profile picture upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    },
    onSettled: () => {
      setIsUploadingImage(false);
    },
  });



  const handleLogout = async () => {
    await logout(); // This clears user/token and triggers navigation to login via root navigator
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      const { status } = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', `Please grant ${source} permission to update your profile picture.`);
        return;
      }

      setIsUploadingImage(true);

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        uploadProfilePictureMutation.mutate(result.assets[0].uri);
      } else {
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setIsUploadingImage(false);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const StatCard = ({ icon, title, value, color = '#2563eb', onPress }: {
    icon: string;
    title: string;
    value: string | number;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.clickableStatCard]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {onPress && (
        <Icon name="chevron-right" size={16} color="#9ca3af" style={styles.statCardArrow} />
      )}
    </TouchableOpacity>
  );

  const MenuButton = ({ icon, title, onPress, color = '#374151' }: {
    icon: string;
    title: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuButtonLeft}>
        <Icon name={icon} size={24} color={color} />
        <Text style={[styles.menuButtonText, { color }]}>{title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleProfilePicturePress}
          disabled={isUploadingImage}
        >
          {isUploadingImage ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
          ) : (
            <Icon name="person" size={48} color="#ffffff" />
          )}
          <View style={styles.cameraIconContainer}>
            <Icon name="camera-alt" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
        >
          <Icon name="edit" size={16} color="#ffffff" />
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="sports-tennis"
            title="Total Sessions"
            value={userStats.total}
            color="#2563eb"
          />
          <StatCard
            icon="star"
            title="Hosted"
            value={userStats.hosted}
            color="#f59e0b"
            onPress={() => navigation.navigate('HostedSessions')}
          />
          <StatCard
            icon="group"
            title="Joined"
            value={userStats.joined}
            color="#10b981"
            onPress={() => navigation.navigate('JoinedSessions')}
          />
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <MenuButton
          icon="edit"
          title="Edit Profile"
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
        />
        
        <MenuButton
          icon="notifications"
          title="Notifications"
          onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon!')}
        />
        
        <MenuButton
          icon="payment"
          title="Payment Methods"
          onPress={() => Alert.alert('Coming Soon', 'Payment management will be available soon!')}
        />
        
        <MenuButton
          icon="help"
          title="Help & Support"
          onPress={() => Alert.alert('Help', 'For support, please contact us at support@sportconnect.sg')}
        />
        
        <MenuButton
          icon="info"
          title="About"
          onPress={() => Alert.alert('SportConnect SG', 'Version 1.0.0\n\nConnect. Play. Enjoy.')}
        />
        
        <MenuButton
          icon="logout"
          title="Logout"
          onPress={handleLogout}
          color="#ef4444"
        />
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SportConnect SG v1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ in Singapore</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  editProfileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  clickableStatCard: {
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  statCardArrow: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  menuContainer: {
    padding: 20,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
});
