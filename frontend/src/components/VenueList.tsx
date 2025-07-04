import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Venue } from '../types';
import { venuesAPI } from '../services/api';

interface VenueListProps {
  sport: string;
  onVenueSelect?: (venue: Venue) => void;
}

export default function VenueList({ sport, onVenueSelect }: VenueListProps) {
  const {
    data: venues = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['venues', sport],
    queryFn: () => venuesAPI.getVenues(sport),
    enabled: !!sport,
  });

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => onVenueSelect?.(item)}
    >
      <View style={styles.venueHeader}>
        <Icon name="location-on" size={24} color="#2563eb" />
        <Text style={styles.venueName}>{item.name}</Text>
      </View>
      <Text style={styles.venueSport}>{item.sport}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading venues...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load venues</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Venues for {sport}</Text>
      <FlatList
        data={venues}
        keyExtractor={(item) => item._id}
        renderItem={renderVenueItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="location-off" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No venues found</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to add a venue for {sport}
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
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
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
  },
  venueCard: {
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
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  venueSport: {
    fontSize: 14,
    color: '#6b7280',
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
