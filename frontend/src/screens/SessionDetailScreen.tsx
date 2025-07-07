import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SessionStackParamList } from '../types';
import { sessionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getSkillLevelColor } from '../constants/skillLevels';

type SessionDetailRouteProp = RouteProp<SessionStackParamList, 'SessionDetail'>;
type SessionDetailNavigationProp = StackNavigationProp<SessionStackParamList, 'SessionDetail'>;

export default function SessionDetailScreen() {
  const route = useRoute<SessionDetailRouteProp>();
  const navigation = useNavigation<SessionDetailNavigationProp>();
  const { sessionId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for confirmation modals
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['userSessionData', user?.id] });
    },
    onError: (error: any) => {
      console.error('Failed to join session:', error.response?.data?.error || error.message);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => sessionsAPI.leaveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['userSessionData', user?.id] });
    },
    onError: (error: any) => {
      console.error('Failed to leave session:', error.response?.data?.error || error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => sessionsAPI.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['userSessionData', user?.id] });
      // Navigate back to previous screen after successful cancellation
      navigation.goBack();
    },
    onError: (error: any) => {
      console.error('Failed to cancel session:', error.response?.data?.error || error.message);
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



  // Helper function to check if session is expired
  const isSessionExpired = (): boolean => {
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

  const isExpired = isSessionExpired();

  // Check if user is a participant (handle both populated User objects and string IDs)
  const isUserParticipant = session.participants?.some(participant => {
    if (!participant || !user?.id) return false;
    if (typeof participant === 'string') {
      return participant === user.id;
    }
    return participant._id === user.id || participant.id === user.id;
  }) || false;

  // Check if user is the host (handle both populated User object and string ID)
  const isUserHost = (() => {
    if (!session.hostId || !user?.id) return false;
    if (typeof session.hostId === 'string') {
      return session.hostId === user.id;
    }
    return session.hostId._id === user.id || session.hostId.id === user.id;
  })();

  // Calculate current players dynamically (participants + host if countHostIn)
  const currentPlayers = session.participants?.length || 0;
  const isFull = currentPlayers >= session.maxPlayers;
  const canJoin = !isUserParticipant && !isUserHost && !isFull && !isExpired;
  const canLeave = isUserParticipant && !isUserHost && !isExpired;





  const handleJoin = () => {
    setShowJoinConfirmation(true);
  };

  const confirmJoin = () => {
    setShowJoinConfirmation(false);
    joinMutation.mutate();
  };

  const cancelJoin = () => {
    setShowJoinConfirmation(false);
  };

  const handleLeave = () => {
    setShowLeaveConfirmation(true);
  };

  const confirmLeave = () => {
    setShowLeaveConfirmation(false);
    leaveMutation.mutate();
  };

  const cancelLeave = () => {
    setShowLeaveConfirmation(false);
  };

  const handleCancel = () => {
    setShowCancelConfirmation(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirmation(false);
    cancelMutation.mutate();
  };

  const cancelCancelSession = () => {
    setShowCancelConfirmation(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sport}>{session.sport}</Text>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(session.skillLevelStart, session.sport) }]}>
            <Text style={styles.skillBadgeText}>{session.skillLevelStart} - {session.skillLevelEnd}</Text>
          </View>
        </View>
        
        <Text style={styles.venue}>
          {session.venue}
          {session.courtNumber && ` • Court ${session.courtNumber}`}
        </Text>
        <Text style={styles.host}>Hosted by {typeof session.hostId === 'object' ? session.hostId.name : session.hostName}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={24} color="#2563eb" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            {/* Handle both new and legacy date formats */}
            {session.startDate ? (
              <>
                <Text style={styles.detailValue}>
                  {formatDate(session.startDate)} {session.endDate !== session.startDate ? `- ${formatDate(session.endDate)}` : ''}
                </Text>
                <Text style={styles.detailValue}>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.detailValue}>
                  {formatDate(session.date!)}
                </Text>
                <Text style={styles.detailValue}>
                  {formatTime(session.time!)}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="location-on" size={24} color="#2563eb" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Venue</Text>
            <Text style={styles.detailValue}>
              {session.venue}
              {session.courtNumber && ` • Court ${session.courtNumber}`}
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

      {/* Participants List */}
      {session.participants && session.participants.length > 0 && (
        <View style={styles.participantsContainer}>
          <View style={styles.participantsHeader}>
            <Text style={styles.participantsTitle}>
              Participants ({currentPlayers}/{session.maxPlayers})
            </Text>
            {!isExpired && (
              <View style={styles.participantsSummary}>
                <Icon name="group" size={16} color="#6b7280" />
                <Text style={styles.participantsSummaryText}>
                  {session.maxPlayers - currentPlayers} spots left
                </Text>
              </View>
            )}
          </View>
          {session.participants.map((participant, index) => {
            if (!participant) return null;

            const participantName = typeof participant === 'string'
              ? 'Unknown User'
              : participant.name || 'Unknown User';

            const participantId = typeof participant === 'string'
              ? participant
              : participant._id || participant.id;

            const hostId = typeof session.hostId === 'string'
              ? session.hostId
              : session.hostId?._id || session.hostId?.id;

            const isHost = hostId === participantId;

            return (
              <View key={index} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <View style={styles.participantAvatar}>
                    {typeof participant !== 'string' && participant.avatar ? (
                      <Image
                        source={{ uri: participant.avatar }}
                        style={styles.avatarImage}
                        onError={() => {
                          // Fallback to default avatar on error
                        }}
                      />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Icon name="person" size={16} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.participantDetails}>
                    <Text style={styles.participantName}>{participantName}</Text>
                    {typeof participant !== 'string' && participant.email && (
                      <Text style={styles.participantEmail}>{participant.email}</Text>
                    )}
                  </View>
                  {isHost && (
                    <View style={styles.hostTag}>
                      <Text style={styles.hostTagText}>Host</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }).filter(Boolean)}
        </View>
      )}

      {/* Empty participants state */}
      {(!session.participants || session.participants.length === 0) && (
        <View style={styles.participantsContainer}>
          <View style={styles.participantsHeader}>
            <Text style={styles.participantsTitle}>
              Participants ({currentPlayers}/{session.maxPlayers})
            </Text>
            {!isExpired && (
              <View style={styles.participantsSummary}>
                <Icon name="group" size={16} color="#6b7280" />
                <Text style={styles.participantsSummaryText}>
                  {session.maxPlayers - currentPlayers} spots available
                </Text>
              </View>
            )}
          </View>
          <View style={styles.emptyParticipants}>
            <Icon name="group-add" size={48} color="#d1d5db" />
            <Text style={styles.emptyParticipantsText}>No participants yet</Text>
            <Text style={styles.emptyParticipantsSubtext}>
              Be the first to join this session!
            </Text>
          </View>
        </View>
      )}

      {!isExpired && (
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
      )}

      <View style={styles.actionContainer}>
        {isUserHost && (
          <>
            <View style={styles.hostBadge}>
              <Icon name="star" size={20} color="#f59e0b" />
              <Text style={styles.hostBadgeText}>You are hosting this session</Text>
            </View>
            {!isExpired && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Session'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isExpired && (
          <View style={styles.expiredBadge}>
            <Icon name="schedule" size={20} color="#6b7280" />
            <Text style={styles.expiredBadgeText}>This session has expired and is no longer available for joining</Text>
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

        {isUserParticipant && !isUserHost && (
          <View style={styles.participantBadge}>
            <Icon name="check-circle" size={20} color="#10b981" />
            <Text style={styles.participantBadgeText}>You have joined this session</Text>
          </View>
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

      </View>

      {/* Join Confirmation Modal */}
      <Modal
        visible={showJoinConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelJoin}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Join Session</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to join this {session.sport} session for S${session.fee}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelJoin}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmJoin}>
                <Text style={styles.modalConfirmText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leave Confirmation Modal */}
      <Modal
        visible={showLeaveConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLeave}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Leave Session</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to leave this session?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelLeave}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLeaveButton} onPress={confirmLeave}>
                <Text style={styles.modalLeaveText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Session Confirmation Modal */}
      <Modal
        visible={showCancelConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelCancelSession}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Session</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this session? This action cannot be undone and all participants will be notified.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelCancelSession}>
                <Text style={styles.modalCancelText}>Keep Session</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLeaveButton} onPress={confirmCancel}>
                <Text style={styles.modalLeaveText}>Cancel Session</Text>
              </TouchableOpacity>
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

  participantsList: {
    flexDirection: 'row',
  },

  participantAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  noParticipantsText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  participantsContainer: {
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
  participantsHeader: {
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  participantsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsSummaryText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  participantItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  participantEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  hostTag: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  emptyParticipants: {
    alignItems: 'center',
    padding: 32,
  },
  emptyParticipantsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyParticipantsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalLeaveButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalLeaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Expired session styles
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  expiredBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
});
