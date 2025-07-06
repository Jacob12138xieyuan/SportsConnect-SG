import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, SessionStackParamList, Session } from '../types';
import { sessionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<SessionStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();

  const {
    data: sessions = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsAPI.getAllSessions,
  });

  // Get upcoming sessions that the user has joined (next 3)
  const upcomingSessions = sessions
    .filter(session => {
      // Get session date and time - handle both new and legacy formats
      let sessionDate: string;
      let sessionTime: string;

      if (session.startDate && session.startTime) {
        sessionDate = session.startDate;
        sessionTime = session.startTime;
      } else if (session.date && session.time) {
        sessionDate = session.date;
        sessionTime = session.time;
      } else {
        return false; // Skip sessions without valid date/time
      }

      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Session is upcoming if:
      // 1. Session date is after today, OR
      // 2. Session date is today AND session time is after current time
      const isUpcoming = sessionDate > currentDate ||
                        (sessionDate === currentDate && sessionTime > currentTime);



      // Check if user has joined this session (either as host or participant)
      const isUserHost = (() => {
        if (!session.hostId || !user?.id) return false;
        if (typeof session.hostId === 'string') {
          return session.hostId === user.id;
        }
        return session.hostId._id === user.id || session.hostId.id === user.id;
      })();

      const isUserParticipant = session.participants?.some(participant => {
        if (!participant || !user?.id) return false;
        if (typeof participant === 'string') {
          return participant === user.id;
        }
        return participant._id === user.id || participant.id === user.id;
      }) || false;

      const userInvolved = isUserHost || isUserParticipant;

      console.log('User involvement:', {
        sport: session.sport,
        isUserHost,
        isUserParticipant,
        userInvolved,
        finalResult: isUpcoming && userInvolved
      });

      return isUpcoming && userInvolved;
    })
    .sort((a, b) => {
      // Sort by date/time - handle both formats (earliest first)
      const getDateTime = (session: any) => {
        const sessionDate = session.startDate || session.date;
        const sessionTime = session.startTime || session.time;
        if (sessionDate && sessionTime) {
          return new Date(`${sessionDate}T${sessionTime}`).getTime();
        }
        return 0;
      };
      return getDateTime(a) - getDateTime(b);
    })
    .slice(0, 3);

  // Debug logging
  console.log('HomeScreen Debug:', {
    totalSessions: sessions?.length || 0,
    upcomingSessionsCount: upcomingSessions.length,
    upcomingSessions: upcomingSessions.map(s => ({
      sport: s.sport,
      startDate: s.startDate || s.date,
      startTime: s.startTime || s.time,
      id: s._id
    })),
    currentUser: user?.id
  });

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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        <Text style={styles.subtitle}>Ready to play some sports?</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateSession')}
        >
          <Icon name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Create Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Sessions')}
        >
          <Icon name="search" size={24} color="#2563eb" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Find Sessions
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Upcoming Sessions</Text>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Loading sessions...</Text>
        ) : upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => (
            <TouchableOpacity
              key={session._id}
              style={styles.sessionCard}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: session._id })}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionSport}>{session.sport}</Text>
                <Text style={styles.sessionDate}>
                  {/* Handle both new and legacy date formats */}
                  {session.startDate && session.startTime ?
                    `${formatDate(session.startDate)} • ${formatTime(session.startTime)}${session.endDate !== session.startDate ? ` - ${formatDate(session.endDate)}` : ''} • ${formatTime(session.endTime)}` :
                    `${formatDate(session.date!)} • ${formatTime(session.time!)}`
                  }
                </Text>
              </View>
              
              <Text style={styles.sessionVenue}>{session.venue}</Text>
              
              <View style={styles.sessionFooter}>
                <Text style={styles.sessionPlayers}>
                  {(session.participants?.length || 0) + (session.countHostIn ? 1 : 0)}/{session.maxPlayers} players
                </Text>
                <Text style={styles.sessionFee}>S${session.fee}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="sports-tennis" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No upcoming sessions</Text>
            <Text style={styles.emptyStateSubtext}>
              Join a session to see it here, or create your own
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {sessions.filter(s => {
                if (!s.hostId || !user?.id) return false;
                if (typeof s.hostId === 'string') {
                  return s.hostId === user.id;
                }
                return s.hostId._id === user.id || s.hostId.id === user.id;
              }).length}
            </Text>
            <Text style={styles.statLabel}>Hosted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {sessions.filter(s => {
                if (!user?.id) return false;
                return s.participants?.some(participant => {
                  if (!participant) return false;
                  if (typeof participant === 'string') {
                    return participant === user.id;
                  }
                  return participant._id === user.id || participant.id === user.id;
                });
              }).length}
            </Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>
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
    padding: 20,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
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
  sessionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionVenue: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionPlayers: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
