import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SessionStackParamList } from '../types';
import { sessionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type SessionDetailRouteProp = RouteProp<SessionStackParamList, 'SessionDetail'>;

export default function SessionDetailScreen() {
  const route = useRoute<SessionDetailRouteProp>();
  const { sessionId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsAPI.getSession(sessionId),
  });

  const joinMutation = useMutation({
    mutationFn: () => sessionsAPI.joinSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert('Success', 'You have joined the session!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to join session');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => sessionsAPI.leaveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert('Success', 'You have left the session');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to leave session');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading session details...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load session details</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-SG', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
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

  const isUserParticipant = session.participants?.includes(user?.id || '');
  const isUserHost = session.hostId === user?.id;
  const isFull = session.currentPlayers >= session.maxPlayers;
  const canJoin = !isUserParticipant && !isUserHost && !isFull;
  const canLeave = isUserParticipant && !isUserHost;

  const handleJoin = () => {
    Alert.alert(
      'Join Session',
      `Are you sure you want to join this ${session.sport} session for S$${session.fee}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => joinMutation.mutate() },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Session',
      'Are you sure you want to leave this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sport}>{session.sport}</Text>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(session.skillLevel) }]}>
            <Text style={styles.skillBadgeText}>{session.skillLevel}</Text>
          </View>
        </View>
        
        <Text style={styles.venue}>{session.venue}</Text>
        <Text style={styles.host}>Hosted by {session.hostName}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={24} color="#2563eb" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDate(session.date)}
            </Text>
            <Text style={styles.detailValue}>
              {formatTime(session.time)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="location-on" size={24} color="#2563eb" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Venue</Text>
            <Text style={styles.detailValue}>{session.venue}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="group" size={24} color="#2563eb" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Players</Text>
            <Text style={styles.detailValue}>
              {session.currentPlayers} of {session.maxPlayers} joined
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="attach-money" size={24} color="#2563eb" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValue}>S${session.fee}</Text>
          </View>
        </View>

        {session.notes && (
          <View style={styles.detailRow}>
            <Icon name="notes" size={24} color="#2563eb" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{session.notes}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          isFull ? styles.fullBadge : styles.availableBadge
        ]}>
          <Text style={[
            styles.statusText,
            isFull ? styles.fullText : styles.availableText
          ]}>
            {isFull ? 'Session Full' : 'Spots Available'}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {isUserHost && (
          <View style={styles.hostBadge}>
            <Icon name="star" size={20} color="#f59e0b" />
            <Text style={styles.hostBadgeText}>You are hosting this session</Text>
          </View>
        )}

        {canJoin && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoin}
            disabled={joinMutation.isPending}
          >
            <Text style={styles.joinButtonText}>
              {joinMutation.isPending ? 'Joining...' : 'Join Session'}
            </Text>
          </TouchableOpacity>
        )}

        {canLeave && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeave}
            disabled={leaveMutation.isPending}
          >
            <Text style={styles.leaveButtonText}>
              {leaveMutation.isPending ? 'Leaving...' : 'Leave Session'}
            </Text>
          </TouchableOpacity>
        )}

        {isUserParticipant && !isUserHost && (
          <View style={styles.participantBadge}>
            <Icon name="check-circle" size={20} color="#10b981" />
            <Text style={styles.participantBadgeText}>You have joined this session</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sport: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  skillBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  venue: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 8,
  },
  host: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailContent: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
  },
  fullBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  availableText: {
    color: '#166534',
  },
  fullText: {
    color: '#dc2626',
  },
  actionContainer: {
    padding: 20,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hostBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 16,
  },
  participantBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
