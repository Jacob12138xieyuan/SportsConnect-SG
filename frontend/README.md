# SportConnect SG - Frontend

A React Native mobile app for Singapore's premier sports social network, built with Expo.

## Features

- **User Authentication**: Login/Register with JWT token management
- **Session Management**: Create, browse, join, and leave sports sessions
- **Real-time Updates**: Live session data with React Query
- **User Profiles**: Personal statistics and profile management
- **Venue Management**: Browse and add sports venues
- **Mobile-First Design**: Optimized for iOS and Android

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Query** for data fetching and caching
- **Axios** for API communication
- **Expo Secure Store** for secure token storage
- **React Native Vector Icons** for UI icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your device

### Backend Configuration

Make sure the backend server is running on `http://localhost:4000`. Update the API base URL in `src/services/api.ts` if needed.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── navigation/         # Navigation configuration
├── screens/           # Screen components
├── services/          # API services
└── types/             # TypeScript type definitions
```

## Key Screens

- **Login/Register**: User authentication
- **Home**: Dashboard with upcoming sessions and quick actions
- **Sessions**: Browse and filter available sessions
- **Session Detail**: View session details and join/leave
- **Create Session**: Create new sports sessions
- **Profile**: User profile and statistics

## API Integration

The app integrates with the backend API for:
- User authentication (`/auth`)
- Session management (`/sessions`)
- Venue management (`/venues`)

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Expo Build

For production builds:

```bash
# iOS
expo build:ios

# Android
expo build:android
```

## Environment Variables

Create a `.env` file in the frontend directory:

```
API_BASE_URL=http://localhost:4000
```

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new components
3. Add proper error handling and loading states
4. Test on both iOS and Android platforms

## License

This project is part of SportConnect SG.
