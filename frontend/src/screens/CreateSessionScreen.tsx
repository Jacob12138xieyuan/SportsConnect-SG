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
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, CreateSessionData } from '../types';
import { sessionsAPI, venuesAPI } from '../services/api';
import { getSkillLevelsForSport, formatSkillLevelRange } from '../constants/skillLevels';
import { useAuth } from '../contexts/AuthContext';

type CreateSessionScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'CreateSession'>;

export default function CreateSessionScreen() {
  const navigation = useNavigation<CreateSessionScreenNavigationProp>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize with current date and future times
  const now = new Date();
  const defaultStartTime = new Date();
  defaultStartTime.setHours(defaultStartTime.getHours() + 2); // Set default start time to 2 hours from now
  defaultStartTime.setMinutes(0); // Round to the hour
  defaultStartTime.setSeconds(0);

  const defaultEndTime = new Date(defaultStartTime);
  defaultEndTime.setHours(defaultEndTime.getHours() + 2); // End time is 2 hours after start time

  const [selectedStartDate, setSelectedStartDate] = useState(now);
  const [selectedEndDate, setSelectedEndDate] = useState(now); // Default same as start date
  const [selectedStartTime, setSelectedStartTime] = useState(defaultStartTime);
  const [selectedEndTime, setSelectedEndTime] = useState(defaultEndTime);

  // Text input values for manual entry
  const [startDateText, setStartDateText] = useState(now.toLocaleDateString('en-CA'));
  const [endDateText, setEndDateText] = useState(now.toLocaleDateString('en-CA'));
  const [startTimeText, setStartTimeText] = useState(defaultStartTime.toTimeString().split(' ')[0].substring(0, 5));
  const [endTimeText, setEndTimeText] = useState(defaultEndTime.toTimeString().split(' ')[0].substring(0, 5));

  const [formData, setFormData] = useState({
    sport: 'Badminton',
    venue: '',
    courtNumber: '', // Optional court number for court-based sports
    skillLevelStart: '', // Starting skill level
    skillLevelEnd: '',   // Ending skill level
    maxPlayers: '4',
    fee: '',
    notes: '',
    countHostIn: true, // Default to true (host counts in player limit)
  });

  // Form validation errors
  const [errors, setErrors] = useState({
    venue: '',
    skillLevelStart: '',
    skillLevelEnd: '',
    maxPlayers: '',
    fee: '',
    startDate: '',
    endDate: '',
  });

  const [newVenueName, setNewVenueName] = useState('');
  const [showNewVenueInput, setShowNewVenueInput] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Search states
  const [sportSearchQuery, setSportSearchQuery] = useState('');
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [customVenueInput, setCustomVenueInput] = useState('');

  // Skill level picker states
  const [showSkillStartPicker, setShowSkillStartPicker] = useState(false);
  const [showSkillEndPicker, setShowSkillEndPicker] = useState(false);

  const sports = ['Badminton', 'Tennis', 'Basketball', 'Football', 'Table Tennis', 'Squash', 'Volleyball', 'Swimming', 'Running', 'Cycling', 'Gym/Fitness'];

  // Sports that require court numbers
  const courtBasedSports = ['Badminton', 'Tennis', 'Basketball', 'Table Tennis', 'Squash', 'Volleyball'];

  // Check if current sport requires court number
  const requiresCourtNumber = courtBasedSports.includes(formData.sport);

  // Get skill levels for current sport
  const availableSkillLevels = getSkillLevelsForSport(formData.sport);

  // Skill level suggestions for different sports (for placeholder/examples)
  const skillLevelSuggestions: { [key: string]: string } = {
    'Badminton': 'e.g., Mid Beginner, High Intermediate, Expert',
    'Tennis': 'e.g., 3.5 NTRP, Intermediate, Advanced',
    'Basketball': 'e.g., Recreational, Competitive, Semi-Pro',
    'Football': 'e.g., Casual, Club Level, Competitive',
    'Table Tennis': 'e.g., Club Player, Tournament Level',
    'Squash': 'e.g., Club Standard, County Level',
    'Volleyball': 'e.g., Recreational, Competitive',
    'Swimming': 'e.g., Fitness Swimmer, Competitive',
    'Running': 'e.g., 5-10km pace, Marathon runner',
    'Cycling': 'e.g., Recreational, Racing Level',
    'Gym/Fitness': 'e.g., Beginner, Advanced'
  };

  // Validation functions
  const validateForm = () => {
    const newErrors = {
      venue: '',
      skillLevelStart: '',
      skillLevelEnd: '',
      maxPlayers: '',
      fee: '',
      startDate: '',
      endDate: '',
    };

    // Venue validation
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    // Skill level validation
    if (!formData.skillLevelStart.trim()) {
      newErrors.skillLevelStart = 'Starting skill level is required';
    }
    if (!formData.skillLevelEnd.trim()) {
      newErrors.skillLevelEnd = 'Ending skill level is required';
    }

    // Max players validation
    const maxPlayers = Number(formData.maxPlayers);
    if (!formData.maxPlayers.trim()) {
      newErrors.maxPlayers = 'Maximum players is required';
    } else if (isNaN(maxPlayers) || maxPlayers < 2) {
      newErrors.maxPlayers = 'Minimum 2 players required';
    } else if (maxPlayers > 50) {
      newErrors.maxPlayers = 'Maximum 50 players allowed';
    }

    // Fee validation (optional field)
    if (formData.fee.trim()) {
      const fee = Number(formData.fee);
      if (isNaN(fee) || fee < 0) {
        newErrors.fee = 'Fee must be a valid number (0 or more)';
      } else if (fee > 1000) {
        newErrors.fee = 'Fee cannot exceed $1000';
      }
    }

    // Date validation - allow today and future dates
    const now = new Date();

    // Create proper start and end datetimes
    const startDateTime = new Date(selectedStartDate);
    startDateTime.setHours(selectedStartTime.getHours());
    startDateTime.setMinutes(selectedStartTime.getMinutes());
    startDateTime.setSeconds(0);
    startDateTime.setMilliseconds(0);

    const endDateTime = new Date(selectedEndDate);
    endDateTime.setHours(selectedEndTime.getHours());
    endDateTime.setMinutes(selectedEndTime.getMinutes());
    endDateTime.setSeconds(0);
    endDateTime.setMilliseconds(0);

    // Create date objects without time for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(selectedStartDate);
    startDate.setHours(0, 0, 0, 0);

    // Validate start date
    if (startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    } else if (startDate.getTime() === today.getTime() && startDateTime <= now) {
      newErrors.startDate = 'Start time must be in the future for today\'s date';
    }

    // Validate end date/time
    if (endDateTime <= startDateTime) {
      newErrors.endDate = 'End date/time must be after start date/time';
    }

    // Check if session is too far in the future (optional - 6 months limit)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (startDateTime > sixMonthsFromNow) {
      newErrors.startDate = 'Session cannot be scheduled more than 6 months in advance';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  // Clear specific field error when user starts typing
  const clearFieldError = (fieldName: keyof typeof errors) => {
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Helper functions for API formatting

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTimeForAPI = (time: Date) => {
    return time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  };

  // Formatting functions for text inputs
  const formatDateForInput = (date: Date) => {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const formatTimeForInput = (time: Date) => {
    return time.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  };

  // Parsing functions for text inputs
  const parseDateFromInput = (dateString: string): Date | null => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const parseTimeFromInput = (timeString: string, baseDate: Date = new Date()): Date | null => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      const date = new Date(baseDate);
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch {
      return null;
    }
  };

  // Date/Time change handlers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedStartDate(selectedDate);
      setStartDateText(formatDateForInput(selectedDate));
      // Auto-update end date to same as start date if end date is before start date
      if (selectedEndDate < selectedDate) {
        setSelectedEndDate(selectedDate);
        setEndDateText(formatDateForInput(selectedDate));
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedEndDate(selectedDate);
      setEndDateText(formatDateForInput(selectedDate));
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedStartTime(selectedTime);
      setStartTimeText(formatTimeForInput(selectedTime));
      // Auto-update end time to 2 hours after start time
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 2);
      setSelectedEndTime(newEndTime);
      setEndTimeText(formatTimeForInput(newEndTime));
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedEndTime(selectedTime);
      setEndTimeText(formatTimeForInput(selectedTime));
    }
  };

  // Text input change handlers
  const onStartDateTextChange = (text: string) => {
    setStartDateText(text);
    const parsedDate = parseDateFromInput(text);
    if (parsedDate) {
      setSelectedStartDate(parsedDate);
      // Auto-update end date if end date is before start date
      if (selectedEndDate < parsedDate) {
        setSelectedEndDate(parsedDate);
        setEndDateText(formatDateForInput(parsedDate));
      }
    }
  };

  const onEndDateTextChange = (text: string) => {
    setEndDateText(text);
    const parsedDate = parseDateFromInput(text);
    if (parsedDate) {
      setSelectedEndDate(parsedDate);
    }
  };

  const onStartTimeTextChange = (text: string) => {
    setStartTimeText(text);
    const parsedTime = parseTimeFromInput(text, selectedStartDate);
    if (parsedTime) {
      setSelectedStartTime(parsedTime);
      // Auto-update end time to 2 hours after start time if end time is before or same as start time
      if (selectedEndTime <= parsedTime) {
        const newEndTime = new Date(parsedTime);
        newEndTime.setHours(newEndTime.getHours() + 2);
        setSelectedEndTime(newEndTime);
        setEndTimeText(formatTimeForInput(newEndTime));
      }
    }
  };

  const onEndTimeTextChange = (text: string) => {
    setEndTimeText(text);
    const parsedTime = parseTimeFromInput(text, selectedEndDate);
    if (parsedTime) {
      setSelectedEndTime(parsedTime);
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

  // Handle sport selection
  const handleSportSelection = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sport: sport,
      venue: '' // Reset venue when sport changes
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
      queryClient.invalidateQueries({ queryKey: ['userSessionData', user?.id] });
      // Navigate directly to the session detail page
      navigation.navigate('Sessions', {
        screen: 'SessionDetail',
        params: { sessionId: newSession._id }
      });
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
    console.log('Form data:', formData);
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a session');
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fix the errors below and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    const sessionData: CreateSessionData = {
      sport: formData.sport,
      startDate: formatDateForAPI(selectedStartDate),
      endDate: formatDateForAPI(selectedEndDate),
      startTime: formatTimeForAPI(selectedStartTime),
      endTime: formatTimeForAPI(selectedEndTime),
      venue: formData.venue,
      courtNumber: formData.courtNumber || undefined, // Only include if provided
      skillLevelStart: formData.skillLevelStart,
      skillLevelEnd: formData.skillLevelEnd,
      hostName: user?.name || '',
      maxPlayers: Number(formData.maxPlayers),
      fee: Number(formData.fee) || 0, // Default to 0 if empty
      notes: formData.notes || undefined,
      countHostIn: formData.countHostIn,
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

          {/* Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date *</Text>
            <View style={styles.dateTimeInputContainer}>
              <TextInput
                style={[styles.dateTimeInput, errors.startDate ? styles.inputError : null]}
                placeholder="YYYY-MM-DD"
                value={startDateText}
                onChangeText={onStartDateTextChange}
                onFocus={() => clearFieldError('startDate')}
              />
              <TouchableOpacity
                style={styles.pickerIconButton}
                onPress={() => {
                  clearFieldError('startDate');
                  setShowStartDatePicker(true);
                }}
              >
                <Icon name="calendar-today" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {errors.startDate ? <Text style={styles.errorText}>{errors.startDate}</Text> : null}
          </View>

          {/* End Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date *</Text>
            <View style={styles.dateTimeInputContainer}>
              <TextInput
                style={[styles.dateTimeInput, errors.endDate ? styles.inputError : null]}
                placeholder="YYYY-MM-DD"
                value={endDateText}
                onChangeText={onEndDateTextChange}
                onFocus={() => clearFieldError('endDate')}
              />
              <TouchableOpacity
                style={styles.pickerIconButton}
                onPress={() => {
                  clearFieldError('endDate');
                  setShowEndDatePicker(true);
                }}
              >
                <Icon name="calendar-today" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {errors.endDate ? <Text style={styles.errorText}>{errors.endDate}</Text> : null}
          </View>

          {/* Start Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Time *</Text>
            <View style={styles.dateTimeInputContainer}>
              <TextInput
                style={styles.dateTimeInput}
                placeholder="HH:MM"
                value={startTimeText}
                onChangeText={onStartTimeTextChange}
              />
              <TouchableOpacity
                style={styles.pickerIconButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Icon name="access-time" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* End Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Time *</Text>
            <View style={styles.dateTimeInputContainer}>
              <TextInput
                style={styles.dateTimeInput}
                placeholder="HH:MM"
                value={endTimeText}
                onChangeText={onEndTimeTextChange}
              />
              <TouchableOpacity
                style={styles.pickerIconButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Icon name="access-time" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Venue */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.venue ? styles.inputError : null]}
              onPress={() => {
                clearFieldError('venue');
                setShowVenuePicker(true);
              }}
            >
              <Text style={styles.pickerButtonText}>
                {formData.venue || 'Select a venue...'}
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
            </TouchableOpacity>
            {errors.venue ? <Text style={styles.errorText}>{errors.venue}</Text> : null}

            {showNewVenueInput && (
              <View style={styles.newVenueContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter venue name"
                  value={newVenueName}
                  maxLength={30}
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

          {/* Court Number - Only for court-based sports */}
          {requiresCourtNumber && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Court Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1, 2, 3"
                value={formData.courtNumber}
                maxLength={10}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, courtNumber: text }));
                }}
              />
              <Text style={styles.helperText}>
                Optional - Specify which court you'll be playing on
              </Text>
            </View>
          )}

          {/* Skill Level Range */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skill Level Range *</Text>

            {/* Starting Skill Level */}
            <View style={styles.skillLevelRow}>
              <View style={styles.skillLevelItem}>
                <Text style={styles.skillLevelSubLabel}>From</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput, errors.skillLevelStart ? styles.inputError : null]}
                  onPress={() => setShowSkillStartPicker(true)}
                >
                  <Text style={[styles.inputText, !formData.skillLevelStart && styles.placeholderText]}>
                    {formData.skillLevelStart || 'Start level'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#6b7280" />
                </TouchableOpacity>
                {errors.skillLevelStart ? <Text style={styles.errorText}>{errors.skillLevelStart}</Text> : null}
              </View>

              {/* Ending Skill Level */}
              <View style={styles.skillLevelItem}>
                <Text style={styles.skillLevelSubLabel}>To</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput, errors.skillLevelEnd ? styles.inputError : null]}
                  onPress={() => setShowSkillEndPicker(true)}
                >
                  <Text style={[styles.inputText, !formData.skillLevelEnd && styles.placeholderText]}>
                    {formData.skillLevelEnd || 'End level'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#6b7280" />
                </TouchableOpacity>
                {errors.skillLevelEnd ? <Text style={styles.errorText}>{errors.skillLevelEnd}</Text> : null}
              </View>
            </View>

            <Text style={styles.helperText}>
              Select the same level for both if looking for specific skill level only
            </Text>
          </View>

          {/* Max Players */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Players *</Text>
            <TextInput
              style={[styles.input, errors.maxPlayers ? styles.inputError : null]}
              placeholder="4"
              value={formData.maxPlayers}
              onChangeText={(text) => {
                clearFieldError('maxPlayers');
                setFormData(prev => ({ ...prev, maxPlayers: text }));
              }}
              keyboardType="numeric"
            />
            {errors.maxPlayers ? <Text style={styles.errorText}>{errors.maxPlayers}</Text> : null}
          </View>

          {/* Fee */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fee (S$)</Text>
            <TextInput
              style={[styles.input, errors.fee ? styles.inputError : null]}
              placeholder="0.00"
              value={formData.fee}
              onChangeText={(text) => {
                clearFieldError('fee');
                setFormData(prev => ({ ...prev, fee: text }));
              }}
              keyboardType="decimal-pad"
            />
            {errors.fee ? <Text style={styles.errorText}>{errors.fee}</Text> : null}
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

          {/* Count Host In */}
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.label}>Count host in player limit</Text>
                <Text style={styles.switchDescription}>
                  When enabled, you (the host) count towards the maximum players.
                </Text>
              </View>
              <Switch
                value={formData.countHostIn}
                onValueChange={(value) => setFormData(prev => ({ ...prev, countHostIn: value }))}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={formData.countHostIn ? '#ffffff' : '#ffffff'}
              />
            </View>
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
                maxLength={30}
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

      {/* Start Date Picker */}
      {showStartDatePicker && (
        <DateTimePicker
          value={selectedStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* End Date Picker */}
      {showEndDatePicker && (
        <DateTimePicker
          value={selectedEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={selectedStartDate} // End date can't be before start date
        />
      )}

      {/* Start Time Picker */}
      {showStartTimePicker && (
        <DateTimePicker
          value={selectedStartTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
        />
      )}

      {/* End Time Picker */}
      {showEndTimePicker && (
        <DateTimePicker
          value={selectedEndTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
        />
      )}

      {/* Skill Level Start Picker Modal */}
      <Modal
        visible={showSkillStartPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSkillStartPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Starting Skill Level</Text>
              <TouchableOpacity onPress={() => setShowSkillStartPicker(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSkillLevels}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    clearFieldError('skillLevelStart');
                    clearFieldError('skillLevelEnd');
                    setFormData(prev => ({
                      ...prev,
                      skillLevelStart: item.name,
                      // Auto-set end level to same as start level if not set
                      skillLevelEnd: prev.skillLevelEnd || item.name
                    }));
                    setShowSkillStartPicker(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalItemDescription}>{item.description}</Text>
                    )}
                  </View>
                  {formData.skillLevelStart === item.name && (
                    <Icon name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Skill Level End Picker Modal */}
      <Modal
        visible={showSkillEndPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSkillEndPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ending Skill Level</Text>
              <TouchableOpacity onPress={() => setShowSkillEndPicker(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSkillLevels}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    clearFieldError('skillLevelEnd');
                    setFormData(prev => ({ ...prev, skillLevelEnd: item.name }));
                    setShowSkillEndPicker(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.modalItemDescription}>{item.description}</Text>
                    )}
                  </View>
                  {formData.skillLevelEnd === item.name && (
                    <Icon name="check" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 20,
  },
  dateTimeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dateTimeInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerIconButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Skill level range styles
  skillLevelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skillLevelItem: {
    flex: 1,
  },
  skillLevelSubLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#374151',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  // Modal item styles for skill level picker
  modalItemContent: {
    flex: 1,
  },
  modalItemDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
