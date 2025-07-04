import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { sessionsAPI } from '../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsAPI.getAllSessions,
  });

  // Calculate user statistics
  const hostedSessions = sessions.filter(session => {
    if (!session.hostId || !user?.id) return false;
    if (typeof session.hostId === 'string') {
      return session.hostId === user.id;
    }
    return session.hostId._id === user.id || session.hostId.id === user.id;
  });

  const joinedSessions = sessions.filter(session => {
    if (!user?.id) return false;
    return session.participants?.some(participant => {
      if (!participant) return false;
      if (typeof participant === 'string') {
        return participant === user.id;
      }
      return participant._id === user.id || participant.id === user.id;
    });
  });

  const totalSessions = hostedSessions.length + joinedSessions.length;

  const handleLogout = async () => {
    await logout(); // This clears user/token and triggers navigation to login via root navigator
  };

  const StatCard = ({ icon, title, value, color = '#2563eb' }: {
    icon: string;
    title: string;
    value: string | number;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <Icon name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
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
        <View style={styles.avatarContainer}>
          <Icon name="person" size={48} color="#ffffff" />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="sports-tennis"
            title="Total Sessions"
            value={totalSessions}
            color="#2563eb"
          />
          <StatCard
            icon="star"
            title="Hosted"
            value={hostedSessions.length}
            color="#f59e0b"
          />
          <StatCard
            icon="group"
            title="Joined"
            value={joinedSessions.length}
            color="#10b981"
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
