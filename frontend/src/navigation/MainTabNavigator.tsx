import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainTabParamList, SessionStackParamList } from '../types';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SessionsScreen from '../screens/SessionsScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const SessionStack = createStackNavigator<SessionStackParamList>();

function SessionStackNavigator() {
  return (
    <SessionStack.Navigator>
      <SessionStack.Screen 
        name="SessionList" 
        component={SessionsScreen}
        options={{ title: 'Sessions' }}
      />
      <SessionStack.Screen 
        name="SessionDetail" 
        component={SessionDetailScreen}
        options={{ title: 'Session Details' }}
      />
    </SessionStack.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          let iconSize = size;
          let iconColor = color;
          let style = {};

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Sessions':
              iconName = 'sports-tennis';
              break;
            case 'CreateSession':
              iconName = 'add-circle';
              iconSize = 40;
              iconColor = '#2563eb';
              style = { marginBottom: 8 };
              break;
            case 'Messages':
              iconName = 'chat';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={iconSize} color={iconColor} style={style} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
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
      />
      <Tab.Screen 
        name="CreateSession" 
        component={CreateSessionScreen}
        options={{ title: 'Create Session' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
