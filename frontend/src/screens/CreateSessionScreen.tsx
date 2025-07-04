import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// Note: We'll use a simple picker implementation for now
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, CreateSessionData } from '../types';
import { sessionsAPI, venuesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type CreateSessionScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'CreateSession'>;

export default function CreateSessionScreen() {
  const navigation = useNavigation<CreateSessionScreenNavigationProp>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    sport: 'Badminton',
    date: '',
    time: '',
    venue: '',
    skillLevel: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced',
    maxPlayers: '4',
    fee: '',
    notes: '',
  });

  const [newVenueName, setNewVenueName] = useState('');
  const [showNewVenueInput, setShowNewVenueInput] = useState(false);

  // Fetch venues for the selected sport
  const { data: venues = [] } = useQuery({
    queryKey: ['venues', formData.sport],
    queryFn: () => venuesAPI.getVenues(formData.sport),
    enabled: !!formData.sport,
  });

  const createSessionMutation = useMutation({
    mutationFn: (sessionData: CreateSessionData) => sessionsAPI.createSession(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert('Success', 'Session created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Sessions') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create session');
    },
  });

  const createVenueMutation = useMutation({
    mutationFn: (data: { name: string; sport: string }) => 
      venuesAPI.createVenue(data.name, data.sport),
    onSuccess: (newVenue) => {
      queryClient.invalidateQueries({ queryKey: ['venues', formData.sport] });
      setFormData(prev => ({ ...prev, venue: newVenue.name }));
      setNewVenueName('');
      setShowNewVenueInput(false);
      Alert.alert('Success', 'Venue added successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add venue');
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!formData.date || !formData.time || !formData.venue || !formData.fee) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(Number(formData.fee)) || Number(formData.fee) < 0) {
      Alert.alert('Error', 'Please enter a valid fee amount');
      return;
    }

    if (isNaN(Number(formData.maxPlayers)) || Number(formData.maxPlayers) < 2) {
      Alert.alert('Error', 'Please enter a valid number of players (minimum 2)');
      return;
    }

    const sessionData: CreateSessionData = {
      sport: formData.sport,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      skillLevel: formData.skillLevel,
      hostName: user?.name || '',
      maxPlayers: Number(formData.maxPlayers),
      fee: Number(formData.fee),
      notes: formData.notes || undefined,
    };

    createSessionMutation.mutate(sessionData);
  };

  const handleAddVenue = () => {
    if (!newVenueName.trim()) {
      Alert.alert('Error', 'Please enter a venue name');
      return;
    }

    createVenueMutation.mutate({
      name: newVenueName.trim(),
      sport: formData.sport,
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Sport Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sport *</Text>
            <TouchableOpacity style={styles.pickerButton}>
              <Text style={styles.pickerButtonText}>{formData.sport}</Text>
              <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
            />
          </View>

          {/* Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM (e.g., 14:00)"
              value={formData.time}
              onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
            />
          </View>

          {/* Venue */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue *</Text>
            <TouchableOpacity style={styles.pickerButton}>
              <Text style={styles.pickerButtonText}>
                {formData.venue || 'Select a venue...'}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
            </TouchableOpacity>

            {showNewVenueInput && (
              <View style={styles.newVenueContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter venue name"
                  value={newVenueName}
                  onChangeText={setNewVenueName}
                />
                <View style={styles.newVenueButtons}>
                  <TouchableOpacity
                    style={styles.addVenueButton}
                    onPress={handleAddVenue}
                    disabled={createVenueMutation.isPending}
                  >
                    <Text style={styles.addVenueButtonText}>
                      {createVenueMutation.isPending ? 'Adding...' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelVenueButton}
                    onPress={() => {
                      setShowNewVenueInput(false);
                      setNewVenueName('');
                    }}
                  >
                    <Text style={styles.cancelVenueButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Skill Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skill Level *</Text>
            <TouchableOpacity style={styles.pickerButton}>
              <Text style={styles.pickerButtonText}>{formData.skillLevel}</Text>
              <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Max Players */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Players *</Text>
            <TextInput
              style={styles.input}
              placeholder="4"
              value={formData.maxPlayers}
              onChangeText={(text) => setFormData(prev => ({ ...prev, maxPlayers: text }))}
              keyboardType="numeric"
            />
          </View>

          {/* Fee */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fee (S$) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.fee}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fee: text }))}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional information about the session..."
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, createSessionMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createSessionMutation.isPending}
          >
            <Icon name="add-circle" size={24} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  newVenueContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  newVenueButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  addVenueButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addVenueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelVenueButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelVenueButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
