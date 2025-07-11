import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, SessionStackParamList, ProfileStackParamList } from '../types';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SessionsScreen from '../screens/SessionsScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import MessagesScreen from '../screens/MessagesScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HostedSessionsScreen from '../screens/HostedSessionsScreen';
import JoinedSessionsScreen from '../screens/JoinedSessionsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const SessionStack = createStackNavigator<SessionStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function SessionStackNavigator() {
  return (
    <SessionStack.Navigator>
      <SessionStack.Screen
        name="SessionList"
        component={SessionsScreen}
        options={{
          title: 'Sessions',
          headerLeft: () => null, // Remove back arrow for root screen
        }}
      />
      <SessionStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          title: 'Session Details',
          // Back arrow will be shown automatically for nested screens
        }}
      />
    </SessionStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerLeft: () => null, // Remove back arrow for root screen
        }}
      />
      <ProfileStack.Screen
        name="HostedSessions"
        component={HostedSessionsScreen}
        options={{
          headerShown: false, // HostedSessionsScreen has its own header
        }}
      />
      <ProfileStack.Screen
        name="JoinedSessions"
        component={JoinedSessionsScreen}
        options={{
          headerShown: false, // JoinedSessionsScreen has its own header
        }}
      />
      <ProfileStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          title: 'Session Details',
          // Back arrow will be shown automatically for nested screens
        }}
      />
    </ProfileStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // CreateSession has custom icon, skip default handling
          if (route.name === 'CreateSession') {
            return null;
          }

          let iconName = 'help';
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Sessions':
              iconName = 'sports-tennis';
              break;
            case 'Messages':
              iconName = 'chat';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'SportConnect SG' }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionStackNavigator}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Reset the Sessions stack to SessionList when tab is pressed
            navigation.navigate('Sessions', { screen: 'SessionList' });
          },
        })}
      />
      <Tab.Screen
        name="CreateSession"
        component={CreateSessionScreen}
        options={{
          title: 'Create Session',
          tabBarIcon: ({ focused }) => {
            return (
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: focused ? '#1d4ed8' : '#2563eb',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
                shadowColor: '#2563eb',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}>
                <Icon name="add" size={28} color="#ffffff" />
              </View>
            );
          },
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
