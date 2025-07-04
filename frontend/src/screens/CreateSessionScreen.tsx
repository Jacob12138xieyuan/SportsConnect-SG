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
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  // Initialize with current date/time
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedTime, setSelectedTime] = useState(now);

  const [formData, setFormData] = useState({
    sport: 'Badminton',
    venue: '',
    skillLevel: 'Mid Beginner', // Default to a valid skill level for Badminton
    maxPlayers: '4',
    fee: '',
    notes: '',
  });

  const [newVenueName, setNewVenueName] = useState('');
  const [showNewVenueInput, setShowNewVenueInput] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Search states
  const [sportSearchQuery, setSportSearchQuery] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [customVenueInput, setCustomVenueInput] = useState('');

  const sports = ['Badminton', 'Tennis', 'Basketball', 'Football', 'Table Tennis', 'Squash', 'Volleyball', 'Swimming', 'Running', 'Cycling', 'Gym/Fitness'];

  // Sport-specific skill levels
  const sportSkillLevels: { [key: string]: string[] } = {
    'Badminton': [
      'Low Beginner', 'Mid Beginner', 'High Beginner',
      'Low Intermediate', 'Mid Intermediate', 'High Intermediate',
      'Low Advanced', 'Mid Advanced', 'High Advanced', 'Expert'
    ],
    'Tennis': [
      'Beginner (0-2.5)', 'Intermediate (3.0-3.5)', 'Advanced (4.0-4.5)',
      'Expert (5.0+)', 'Tournament Level'
    ],
    'Basketball': [
      'Recreational', 'Casual Player', 'Regular Player',
      'Competitive', 'Semi-Pro', 'Professional Level'
    ],
    'Football': [
      'Casual Kickabout', 'Recreational', 'Club Level',
      'Competitive', 'Semi-Pro', 'Professional'
    ],
    'Table Tennis': [
      'Beginner', 'Recreational', 'Club Player',
      'Tournament Player', 'Advanced', 'Expert'
    ],
    'Squash': [
      'Beginner', 'Recreational', 'Club Standard',
      'County Level', 'Regional', 'National Level'
    ],
    'Volleyball': [
      'Beginner', 'Recreational', 'Intermediate',
      'Competitive', 'Advanced', 'Elite'
    ],
    'Swimming': [
      'Beginner', 'Recreational Swimmer', 'Fitness Swimmer',
      'Competitive', 'Advanced', 'Elite/Masters'
    ],
    'Running': [
      'Beginner (0-5km)', 'Recreational (5-10km)', 'Regular Runner (10-21km)',
      'Serious Runner (21km+)', 'Competitive', 'Elite'
    ],
    'Cycling': [
      'Casual Rider', 'Recreational', 'Regular Cyclist',
      'Enthusiast', 'Competitive', 'Racing Level'
    ],
    'Gym/Fitness': [
      'Beginner', 'Regular Gym Goer', 'Intermediate',
      'Advanced', 'Fitness Enthusiast', 'Athlete Level'
    ]
  };

  // Get skill levels for current sport
  const currentSkillLevels = sportSkillLevels[formData.sport] || ['Beginner', 'Intermediate', 'Advanced'];

  // Helper functions for date/time formatting
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-SG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTimeForAPI = (time: Date) => {
    return time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  };

  // Date/Time change handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  // Handle custom venue selection
  const handleCustomVenueSelect = () => {
    if (customVenueInput.trim()) {
      setFormData(prev => ({ ...prev, venue: customVenueInput.trim() }));
      setShowVenuePicker(false);
      setCustomVenueInput('');
      setVenueSearchQuery('');
    }
  };

  // Handle sport selection with skill level reset
  const handleSportSelection = (sport: string) => {
    const newSkillLevels = sportSkillLevels[sport] || ['Beginner', 'Intermediate', 'Advanced'];
    setFormData(prev => ({
      ...prev,
      sport: sport,
      venue: '',
      skillLevel: newSkillLevels[0] // Reset to first skill level of new sport
    }));
    closeSportPicker();
  };

  // Reset search when modals close
  const closeSportPicker = () => {
    setShowSportPicker(false);
    setSportSearchQuery('');
  };

  const closeVenuePicker = () => {
    setShowVenuePicker(false);
    setVenueSearchQuery('');
    setCustomVenueInput('');
  };

  // Fetch venues for the selected sport
  const { data: venues = [] } = useQuery({
    queryKey: ['venues', formData.sport],
    queryFn: () => venuesAPI.getVenues(formData.sport),
    enabled: !!formData.sport,
  });

  // Filter functions for search (after venues is declared)
  const filteredSports = sports.filter(sport =>
    sport.toLowerCase().includes(sportSearchQuery.toLowerCase())
  );

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(venueSearchQuery.toLowerCase())
  );

  const createSessionMutation = useMutation({
    mutationFn: (sessionData: CreateSessionData) => {
      console.log('Creating session with data:', sessionData);
      return sessionsAPI.createSession(sessionData);
    },
    onSuccess: (newSession) => {
      console.log('Session created successfully:', newSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Alert.alert('Success', 'Session created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Sessions') }
      ]);
    },
    onError: (error: any) => {
      console.error('Create session error:', error);
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
    console.log('Submit button pressed');
    console.log('Form data:', formData);
    console.log('User:', user);

    // Validation
    if (!formData.venue || !formData.fee) {
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
      date: formatDateForAPI(selectedDate),
      time: formatTimeForAPI(selectedTime),
      venue: formData.venue,
      skillLevel: formData.skillLevel,
      hostName: user?.name || '',
      maxPlayers: Number(formData.maxPlayers),
      fee: Number(formData.fee),
      notes: formData.notes || undefined,
    };

    console.log('Submitting session data:', sessionData);
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
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSportPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{formData.sport}</Text>
              <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {formatDate(selectedDate)}
              </Text>
              <Icon name="calendar-today" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {formatTime(selectedTime)}
              </Text>
              <Icon name="access-time" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Venue */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowVenuePicker(true)}
            >
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
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSkillPicker(true)}
            >
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

      {/* Sport Picker Modal */}
      <Modal
        visible={showSportPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSportPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sport</Text>
              <TouchableOpacity onPress={closeSportPicker}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search sports..."
                value={sportSearchQuery}
                onChangeText={setSportSearchQuery}
                autoFocus={true}
              />
              {sportSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSportSearchQuery('')}>
                  <Icon name="clear" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredSports}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.sport === item && styles.modalItemSelected
                  ]}
                  onPress={() => handleSportSelection(item)}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.sport === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.sport === item && (
                    <Icon name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Icon name="search-off" size={48} color="#d1d5db" />
                  <Text style={styles.emptySearchText}>No sports found</Text>
                  <Text style={styles.emptySearchSubtext}>Try a different search term</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Skill Level Picker Modal */}
      <Modal
        visible={showSkillPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSkillPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Skill Level</Text>
                <Text style={styles.modalSubtitle}>for {formData.sport}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSkillPicker(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={currentSkillLevels}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.skillLevel === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, skillLevel: item }));
                    setShowSkillPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.skillLevel === item && styles.modalItemTextSelected
                  ]}>
                    {item}
                  </Text>
                  {formData.skillLevel === item && (
                    <Icon name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Venue Picker Modal */}
      <Modal
        visible={showVenuePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVenuePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select or Enter Venue</Text>
              <TouchableOpacity onPress={closeVenuePicker}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Search/Custom Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search venues or type custom venue..."
                value={venueSearchQuery || customVenueInput}
                onChangeText={(text) => {
                  setVenueSearchQuery(text);
                  setCustomVenueInput(text);
                }}
                autoFocus={true}
              />
              {(venueSearchQuery.length > 0 || customVenueInput.length > 0) && (
                <TouchableOpacity onPress={() => {
                  setVenueSearchQuery('');
                  setCustomVenueInput('');
                }}>
                  <Icon name="clear" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Custom Venue Option */}
            {customVenueInput.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.modalItem, styles.customVenueItem]}
                onPress={handleCustomVenueSelect}
              >
                <View style={styles.customVenueContent}>
                  <Icon name="add-location" size={20} color="#2563eb" />
                  <Text style={styles.customVenueText}>
                    Use "{customVenueInput.trim()}" as venue
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color="#2563eb" />
              </TouchableOpacity>
            )}

            <FlatList
              data={filteredVenues}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.venue === item.name && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, venue: item.name }));
                    closeVenuePicker();
                  }}
                >
                  <View style={styles.venueItemContent}>
                    <Icon name="location-on" size={20} color="#6b7280" />
                    <Text style={[
                      styles.modalItemText,
                      formData.venue === item.name && styles.modalItemTextSelected
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {formData.venue === item.name && (
                    <Icon name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !customVenueInput.trim() ? (
                  <View style={styles.emptyVenues}>
                    <Icon name="location-off" size={48} color="#d1d5db" />
                    <Text style={styles.emptyVenuesText}>
                      {venueSearchQuery ? 'No venues found' : `No venues found for ${formData.sport}`}
                    </Text>
                    <Text style={styles.emptyVenuesSubtext}>
                      {venueSearchQuery ? 'Try a different search term or type a custom venue name' : 'Type a venue name above to add a custom venue'}
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  addNewText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyVenues: {
    padding: 40,
    alignItems: 'center',
  },
  emptyVenuesText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  addFirstVenueButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addFirstVenueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 8,
    marginRight: 8,
  },
  emptySearch: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  customVenueItem: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  customVenueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customVenueText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 8,
  },
  venueItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyVenuesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});
