import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Mock data for chats
const mockDirectChats = [
  {
    id: '1',
    name: 'Alice Tan',
    avatar: '',
    lastMessage: 'See you at the court!',
    timestamp: '09:15',
    unread: 2,
  },
  {
    id: '2',
    name: 'Ben Lim',
    avatar: '',
    lastMessage: 'Let\'s confirm the time.',
    timestamp: 'Yesterday',
    unread: 0,
  },
];

const mockGroupChats = [
  {
    id: 'g1',
    name: 'Sunday Badminton',
    avatar: '',
    lastMessage: 'Game on this week?',
    timestamp: '08:02',
    unread: 1,
  },
  {
    id: 'g2',
    name: 'Tennis Buddies',
    avatar: '',
    lastMessage: 'Court booked for Sat!',
    timestamp: 'Mon',
    unread: 0,
  },
];

const TABS = ['Direct', 'Group'];

const MessagesScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'Direct' | 'Group'>('Direct');

  const chats = selectedTab === 'Direct' ? mockDirectChats : mockGroupChats;

  const renderChatItem = ({ item }: { item: typeof mockDirectChats[0] }) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.avatar}>
        <Icon name={selectedTab === 'Direct' ? 'person' : 'group'} size={28} color="#2563eb" />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      {/* Segmented control */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab as 'Direct' | 'Group')}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Chat list */}
      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="chat-bubble-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No {selectedTab.toLowerCase()} chats yet</Text>
          <Text style={styles.emptyStateSubtext}>Start a new conversation!</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Icon name="add-comment" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
    marginLeft: 24,
    marginTop: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  chatMeta: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default MessagesScreen; 