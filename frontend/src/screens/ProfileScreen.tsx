import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { sessionsAPI, usersAPI } from '../services/api';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Fetch user's session data and statistics in one optimized call
  const { data: userSessionData = { hostedSessions: [], joinedSessions: [], stats: { hosted: 0, joined: 0, total: 0 } }, isLoading: isLoadingSessionData, error: sessionDataError, isFetching } = useQuery({
    queryKey: ['userSessionData', user?.id],
    queryFn: () => {
      console.log('Executing getUserSessionData query for user:', user?.id);
      return sessionsAPI.getUserSessionData();
    },
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute for testing
    enabled: !!user?.id, // Only run query when user is available
    retry: 3,
    retryDelay: 1000,
  });

  // Debug logging
  useEffect(() => {
    console.log('ProfileScreen: User session data state:', {
      isLoading: isLoadingSessionData,
      isFetching,
      error: sessionDataError,
      dataLength: {
        hosted: userSessionData.hostedSessions.length,
        joined: userSessionData.joinedSessions.length
      },
      userId: user?.id,
      userObject: user,
      rawData: userSessionData
    });
  }, [isLoadingSessionData, isFetching, sessionDataError, userSessionData, user]);

  // Additional debug for profile updates
  useEffect(() => {
    console.log('ProfileScreen: User object changed:', {
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
  }, [user]);

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

  // Update edit form when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);



  // Edit profile mutation
  const editProfileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => usersAPI.updateProfile(data),
    onSuccess: async (updatedUser) => {
      try {
        console.log('Profile update success - Before user context update:', {
          oldUser: user,
          updatedUser,
          currentSessionData: userSessionData
        });

        // Normalize the user object to ensure it has the correct ID field
        const normalizedUser = {
          ...updatedUser,
          id: updatedUser.id || updatedUser._id || ''
        };

        // Update user context with new profile data
        if (updateUser) {
          updateUser(normalizedUser);
          console.log('User context updated with:', normalizedUser);
        }

        // Wait a moment for React to process the state update
        await new Promise(resolve => setTimeout(resolve, 50));

        console.log('About to invalidate queries for user:', normalizedUser.id);

        // Invalidate all user-related queries to ensure fresh data
        const invalidationResults = await Promise.allSettled([
          // Invalidate user session data for both old and new user ID (in case ID changed)
          queryClient.invalidateQueries({
            queryKey: ['userSessionData']
          }),
          // Invalidate general sessions query in case user name changed
          queryClient.invalidateQueries({
            queryKey: ['sessions']
          }),
          // Refetch user session data immediately
          queryClient.refetchQueries({
            queryKey: ['userSessionData', normalizedUser.id]
          })
        ]);

        console.log('Query invalidation results:', invalidationResults);
        console.log('Profile updated and queries refreshed for user:', normalizedUser.id);

        setShowEditModal(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error) {
        console.error('Error refreshing data after profile update:', error);
        setShowEditModal(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    },
  });



  const handleLogout = () => {
    logout(); // This clears user/token and triggers navigation to login via root navigator
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!editForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    editProfileMutation.mutate({
      name: editForm.name.trim(),
      email: editForm.email.trim(),
    });
  };

  const handleCancelEdit = () => {
    // Reset form to current user data
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
    setShowEditModal(false);
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Profile Picture',
      'Profile picture upload will be available in a future update!',
      [{ text: 'OK', style: 'default' }]
    );
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
        >
          {user?.profilePicture ? (
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
          onPress={handleEditProfile}
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
          onPress={handleEditProfile}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={editProfileMutation.isPending}
            >
              <Text style={[
                styles.modalSaveButton,
                editProfileMutation.isPending && styles.modalSaveButtonDisabled
              ]}>
                {editProfileMutation.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 60, // Account for status bar
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    color: '#9ca3af',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
});
