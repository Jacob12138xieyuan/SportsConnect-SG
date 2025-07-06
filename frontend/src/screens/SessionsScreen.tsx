import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SessionStackParamList, Session } from '../types';
import { sessionsAPI } from '../services/api';
import { getSkillLevelColor, getSkillLevelsForSport, isSkillLevelInRange } from '../constants/skillLevels';
import { useAuth } from '../contexts/AuthContext';

type SessionsScreenNavigationProp = StackNavigationProp<SessionStackParamList, 'SessionList'>;

export default function SessionsScreen() {
  const navigation = useNavigation<SessionsScreenNavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>('All');

  // Reset skill level when sport changes
  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    setSelectedSkillLevel('All'); // Reset skill level when sport changes
  };

  const {
    data: sessions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsAPI.getAllSessions,
  });

  // Filter sessions based on search and filters
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.hostName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = selectedSport === 'All' || session.sport === selectedSport;
    const matchesSkill = selectedSkillLevel === 'All' ||
                        session.skillLevelStart === selectedSkillLevel ||
                        session.skillLevelEnd === selectedSkillLevel ||
                        isSkillLevelInRange(selectedSkillLevel, session.skillLevelStart, session.skillLevelEnd, session.sport);

    return matchesSearch && matchesSport && matchesSkill;
  }).sort((a, b) => {
    // Sort by proximity to current date/time (closest sessions first)
    const now = new Date();

    // Helper function to get session date/time as timestamp
    const getSessionTimestamp = (session: Session): number => {
      const sessionDate = session.startDate || session.date;
      const sessionTime = session.startTime || session.time;

      if (!sessionDate || !sessionTime) {
        return Infinity; // Put sessions without valid date/time at the end
      }

      return new Date(`${sessionDate}T${sessionTime}`).getTime();
    };

    const timestampA = getSessionTimestamp(a);
    const timestampB = getSessionTimestamp(b);
    const currentTimestamp = now.getTime();

    // Calculate absolute time difference from current time
    const diffA = Math.abs(timestampA - currentTimestamp);
    const diffB = Math.abs(timestampB - currentTimestamp);

    // Sort by smallest time difference (closest to current time)
    return diffA - diffB;
  });

  // Get unique sports for filter
  const sports = ['All', ...Array.from(new Set(sessions.map(s => s.sport)))];

  // Get skill levels for selected sport
  const getSkillLevelsForSelectedSport = () => {
    if (selectedSport === 'All') return [];
    const sportSkillLevels = getSkillLevelsForSport(selectedSport);
    return ['All', ...sportSkillLevels.map(level => level.name)];
  };

  const skillLevels = getSkillLevelsForSelectedSport();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-SG', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };



  // Helper function to check if session is expired
  const isSessionExpired = (session: Session): boolean => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Get session start date and time - handle both new and legacy formats
    const sessionStartDate = session.startDate || session.date;
    const sessionStartTime = session.startTime || session.time;

    if (!sessionStartDate || !sessionStartTime) {
      return false; // If no date/time info, assume not expired
    }

    // Session is expired if:
    // 1. Session start date is before today, OR
    // 2. Session start date is today AND session start time is before current time
    return sessionStartDate < currentDate ||
           (sessionStartDate === currentDate && sessionStartTime < currentTime);
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    // Calculate dynamic player count (participants + host if countHostIn)
    const participantCount = item.participants ? item.participants.length : 0;
    const totalCurrentPlayers = participantCount;
    const spotsLeft = item.maxPlayers - totalCurrentPlayers;
    const isFull = totalCurrentPlayers >= item.maxPlayers;
    const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
    const isExpired = isSessionExpired(item);

    // Check if current user has joined this session
    const hasUserJoined = user && item.participants &&
                         item.participants.some(participant => {
                           // Handle both string IDs and User objects
                           if (typeof participant === 'string') {
                             return participant === user._id;
                           } else {
                             return participant._id === user._id;
                           }
                         });

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isExpired && styles.expiredSessionCard]}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item._id })}
        // Remove disabled prop - allow viewing expired sessions
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
        <Text style={[styles.sessionHost, isExpired && styles.expiredText]}>Hosted by {item.hostName}</Text>

        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {/* Handle both new and legacy date formats */}
              {item.startDate ?
                `${formatDate(item.startDate)} • ${formatTime(item.startTime)}${item.endDate !== item.startDate ? ` - ${formatDate(item.endDate)}` : ''} • ${formatTime(item.endTime)}` :
                `${formatDate(item.date!)} • ${formatTime(item.time!)}`
              }
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
              {totalCurrentPlayers}/{item.maxPlayers} players
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
            styles.availabilityBadge,
            isExpired ? styles.expiredAvailabilityBadge :
            hasUserJoined ? styles.joinedBadge :
            isFull ? styles.fullBadge :
            isAlmostFull ? styles.almostFullBadge :
            styles.availableBadge
          ]}>
            <Text style={[
              styles.availabilityText,
              isExpired ? styles.expiredAvailabilityText :
              hasUserJoined ? styles.joinedText :
              isFull ? styles.fullText :
              isAlmostFull ? styles.almostFullText :
              styles.availableText
            ]}>
              {isExpired ? 'Expired' :
               hasUserJoined ? 'Joined' :
               isFull ? 'Full' :
               isAlmostFull ? 'Almost Full' :
               'Available'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sessions, venues, or hosts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={sports}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedSport === item && styles.filterChipActive
              ]}
              onPress={() => handleSportChange(item)}
            >
              <Text style={[
                styles.filterChipText,
                selectedSport === item && styles.filterChipTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Skill Level Filter - Only show when a sport is selected */}
      {selectedSport !== 'All' && skillLevels.length > 0 && (
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={skillLevels}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedSkillLevel === item && styles.filterChipActive
                ]}
                onPress={() => setSelectedSkillLevel(item)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedSkillLevel === item && styles.filterChipTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Sessions List */}
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item._id}
        renderItem={renderSessionItem}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="sports-tennis" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading sessions...' : 'No sessions found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {isLoading ? 'Please wait' : 'Try adjusting your search or filters'}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSport: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  skillBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  sessionVenue: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
  },
  sessionHost: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  sessionDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionFee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  availabilityBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
  },
  joinedBadge: {
    backgroundColor: '#dbeafe',
  },
  almostFullBadge: {
    backgroundColor: '#fef3c7',
  },
  fullBadge: {
    backgroundColor: '#fee2e2',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  spotsLeftText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableText: {
    color: '#166534',
  },
  joinedText: {
    color: '#1d4ed8',
  },
  almostFullText: {
    color: '#d97706',
  },
  fullText: {
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Expired session styles
  expiredSessionCard: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
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
});
