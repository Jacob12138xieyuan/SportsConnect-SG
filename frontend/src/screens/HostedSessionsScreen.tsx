import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Session } from '../types';
import { getSkillLevelColor } from '../constants/skillLevels';
import { useAuth } from '../contexts/AuthContext';

interface HostedSessionsScreenProps {
  navigation: any;
}

export default function HostedSessionsScreen({ navigation }: HostedSessionsScreenProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get hosted sessions from cached user session data (already fetched in ProfileScreen)
  const userSessionData = queryClient.getQueryData(['userSessionData', user?.id]) as {
    hostedSessions: Session[];
    joinedSessions: Session[];
    stats: { hosted: number; joined: number; total: number };
  } | undefined;

  const hostedSessions = userSessionData?.hostedSessions || [];
  const isLoading = !userSessionData;
  const error = null;

  // Filter hosted sessions based on search query
  const filteredSessions = hostedSessions.filter(session => {
    if (!searchQuery) return true;

    // Apply search filter
    const matchesSearch = session.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Helper function to check if session is expired
  const isSessionExpired = (session: Session): boolean => {
    const now = new Date();
    const sessionStartDate = session.startDate || session.date;
    const sessionStartTime = session.startTime || session.time;

    if (!sessionStartDate || !sessionStartTime) {
      return false;
    }

    try {
      const sessionDateTime = new Date(`${sessionStartDate}T${sessionStartTime}`);

      // Session is expired if it has already started
      return sessionDateTime <= now;
    } catch (error) {
      return false;
    }
  };



  const formatDateTime = (date: string, time: string): string => {
    try {
      const sessionDate = new Date(`${date}T${time}`);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = sessionDate.toDateString() === today.toDateString();
      const isTomorrow = sessionDate.toDateString() === tomorrow.toDateString();

      let dateStr = '';
      if (isToday) {
        dateStr = 'Today';
      } else if (isTomorrow) {
        dateStr = 'Tomorrow';
      } else {
        dateStr = sessionDate.toLocaleDateString('en-SG', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      }

      const timeStr = sessionDate.toLocaleTimeString('en-SG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return `${dateStr} • ${timeStr}`;
    } catch (error) {
      return `${date} • ${time}`;
    }
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    const participantCount = item.participants ? item.participants.length : 0;
    const spotsLeft = item.maxPlayers - participantCount;
    const isFull = participantCount >= item.maxPlayers;
    const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
    const isExpired = isSessionExpired(item);

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isExpired && styles.expiredSessionCard]}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item._id })}
      >
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionSport, isExpired && styles.expiredText]}>{item.sport}</Text>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(item.skillLevelStart, item.sport) }]}>
            <Text style={styles.skillBadgeText}>{item.skillLevelStart} - {item.skillLevelEnd}</Text>
          </View>
        </View>

        <Text style={[styles.sessionVenue, isExpired && styles.expiredText]}>
          {item.venue}
          {item.courtNumber && ` • Court ${item.courtNumber}`}
        </Text>

        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {formatDateTime(item.startDate || item.date || '', item.startTime || item.time || '')}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Icon
              name="group"
              size={16}
              color={isExpired ? "#9ca3af" : isFull ? "#ef4444" : isAlmostFull ? "#f59e0b" : "#10b981"}
            />
            <Text style={[
              styles.detailText,
              isExpired ? styles.expiredText : { color: isFull ? "#ef4444" : isAlmostFull ? "#f59e0b" : "#374151" }
            ]}>
              {participantCount}/{item.maxPlayers} players
            </Text>
            {!isExpired && !isFull && (
              <Text style={styles.spotsLeftText}>
                • {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
              </Text>
            )}
          </View>
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.feeContainer}>
            <Text style={[styles.sessionFee, isExpired && styles.expiredText]}>
              {item.fee > 0 ? `S$${item.fee}` : 'Free'}
            </Text>
          </View>
          
          <View style={[
            styles.hostBadge,
            isExpired ? styles.expiredAvailabilityBadge : styles.hostBadgeActive
          ]}>
            <Text style={[
              styles.hostBadgeText,
              isExpired ? styles.expiredAvailabilityText : styles.hostBadgeActiveText
            ]}>
              {isExpired ? 'Expired' : 'Upcoming'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load sessions</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Hosted Sessions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by sport or venue..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sessions List */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['userSessionData', user?.id] })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="event" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No sessions found' : 'No hosted sessions yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first session to get started!'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center title
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expiredSessionCard: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSport: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  sessionVenue: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  sessionDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  spotsLeftText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeContainer: {
    flex: 1,
  },
  sessionFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  hostBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hostBadgeActive: {
    backgroundColor: '#2563eb',
  },
  hostBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hostBadgeActiveText: {
    color: '#ffffff',
  },
  expiredText: {
    color: '#9ca3af',
  },
  expiredAvailabilityBadge: {
    backgroundColor: '#6b7280',
  },
  expiredAvailabilityText: {
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
