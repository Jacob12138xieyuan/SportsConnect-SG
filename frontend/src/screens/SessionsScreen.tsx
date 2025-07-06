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

type SessionsScreenNavigationProp = StackNavigationProp<SessionStackParamList, 'SessionList'>;

export default function SessionsScreen() {
  const navigation = useNavigation<SessionsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>('All');

  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefreshing,
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
    const matchesSkill = selectedSkillLevel === 'All' || session.skillLevel === selectedSkillLevel;
    
    return matchesSearch && matchesSport && matchesSkill;
  });

  // Get unique sports for filter
  const sports = ['All', ...Array.from(new Set(sessions.map(s => s.sport)))];
  const skillLevels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

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

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    // Calculate dynamic player count (participants + host if countHostIn)
    const participantCount = item.participants ? item.participants.length : 0;
    const hostCount = item.countHostIn ? 1 : 0;
    const totalCurrentPlayers = participantCount + hostCount;
    const spotsLeft = item.maxPlayers - totalCurrentPlayers;
    const isFull = totalCurrentPlayers >= item.maxPlayers;
    const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item._id })}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionSport}>{item.sport}</Text>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(item.skillLevel) }]}>
            <Text style={styles.skillBadgeText}>{item.skillLevel}</Text>
          </View>
        </View>

        <Text style={styles.sessionVenue}>{item.venue}</Text>
        <Text style={styles.sessionHost}>Hosted by {item.hostName}</Text>

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
              color={isFull ? "#ef4444" : isAlmostFull ? "#f59e0b" : "#10b981"}
            />
            <Text style={[
              styles.detailText,
              { color: isFull ? "#ef4444" : isAlmostFull ? "#f59e0b" : "#374151" }
            ]}>
              {totalCurrentPlayers}/{item.maxPlayers} players
            </Text>
            {!isFull && (
              <Text style={styles.spotsLeftText}>
                • {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
              </Text>
            )}
          </View>
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.feeContainer}>
            <Text style={styles.sessionFee}>
              {item.fee > 0 ? `S$${item.fee}` : 'Free'}
            </Text>
          </View>
          <View style={[
            styles.availabilityBadge,
            isFull ? styles.fullBadge : isAlmostFull ? styles.almostFullBadge : styles.availableBadge
          ]}>
            <Text style={[
              styles.availabilityText,
              isFull ? styles.fullText : isAlmostFull ? styles.almostFullText : styles.availableText
            ]}>
              {isFull ? 'Full' : isAlmostFull ? 'Almost Full' : 'Available'}
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
              onPress={() => setSelectedSport(item)}
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

      {/* Sessions List */}
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item._id}
        renderItem={renderSessionItem}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
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
});
