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

type JoinedSessionsScreenProps = {
  navigation: any;
};

export default function JoinedSessionsScreen({ navigation }: JoinedSessionsScreenProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get joined sessions from cached user session data (already fetched in ProfileScreen)
  const userSessionData = queryClient.getQueryData(['userSessionData', user?.id]) as {
    hostedSessions: Session[];
    joinedSessions: Session[];
    stats: { hosted: number; joined: number; total: number };
  } | undefined;

  const joinedSessions = userSessionData?.joinedSessions || [];
  const isLoading = !userSessionData;
  const error = null;

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

  // Filter sessions based on search query
  const filteredSessions = joinedSessions.filter(session => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      session.sport?.toLowerCase().includes(query) ||
      session.venue?.toLowerCase().includes(query) ||
      session.skillLevelStart?.toLowerCase().includes(query) ||
      session.skillLevelEnd?.toLowerCase().includes(query)
    );
  });

  const renderSessionItem = ({ item }: { item: Session }) => {
    const participantCount = item.countHostIn 
      ? (item.participants?.length || 0) + 1 
      : (item.participants?.length || 0);
    
    const currentPlayers = Math.min(participantCount, item.maxPlayers);
    const spotsLeft = item.maxPlayers - participantCount;
    const isFull = participantCount >= item.maxPlayers;
    const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
    const isExpired = isSessionExpired(item);

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isExpired && styles.expiredSessionCard]}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.sportAndSkill}>
            <Text style={styles.sport}>{item.sport}</Text>
            <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(item.skillLevelStart, item.sport) }]}>
              <Text style={styles.skillBadgeText}>{item.skillLevelStart} - {item.skillLevelEnd}</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            isExpired ? styles.expiredBadge : (isFull ? styles.fullBadge : styles.availableBadge)
          ]}>
            <Text style={[
              styles.statusText,
              isExpired ? styles.expiredText : (isFull ? styles.fullText : styles.availableText)
            ]}>
              {isExpired ? 'Expired' : 'Joined'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Icon name="location-on" size={16} color="#6b7280" />
            <Text style={styles.venue}>{item.venue}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="schedule" size={16} color="#6b7280" />
            <Text style={styles.dateTime}>
              {item.startDate} at {item.startTime}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="person" size={16} color="#6b7280" />
            <Text style={styles.hostInfo}>
              Hosted by {typeof item.hostId === 'string' ? 'Host' : item.hostId?.name || 'Host'}
            </Text>
          </View>

          {!isExpired && (
            <View style={styles.infoRow}>
              <Icon name="group" size={16} color="#6b7280" />
              <Text style={[
                styles.spotsInfo,
                isFull ? styles.fullSpotsText : (isAlmostFull ? styles.almostFullSpotsText : styles.availableSpotsText)
              ]}>
                {currentPlayers}/{item.maxPlayers} players
                {!isFull && ` • ${spotsLeft} spots left`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Joined Sessions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Joined Sessions</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load joined sessions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Joined Sessions</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search joined sessions..."
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

      <FlatList
        data={filteredSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching sessions' : 'No joined sessions'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Join some sessions to see them here'
              }
            </Text>
          </View>
        }
        refreshing={false}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['userSessionData', user?.id] })}
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
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
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
    opacity: 0.7,
    backgroundColor: '#f9fafb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sportAndSkill: {
    flex: 1,
  },
  sport: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  skillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
  },
  fullBadge: {
    backgroundColor: '#fee2e2',
  },
  expiredBadge: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  availableText: {
    color: '#166534',
  },
  fullText: {
    color: '#dc2626',
  },
  expiredText: {
    color: '#6b7280',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  venue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  dateTime: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  hostInfo: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  spotsInfo: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  availableSpotsText: {
    color: '#059669',
  },
  almostFullSpotsText: {
    color: '#d97706',
  },
  fullSpotsText: {
    color: '#dc2626',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
