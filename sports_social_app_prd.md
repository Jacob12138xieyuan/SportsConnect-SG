# SportConnect SG - Product Requirements Document

## Executive Summary

SportConnect SG is a mobile-first social platform designed to connect sports enthusiasts across Singapore. The app enables users to organize, discover, and join sports sessions while building a community of active individuals. Starting with badminton as the primary sport, the platform will expand to include other popular sports in Singapore.

## Product Vision

To become Singapore's premier sports social network, making it effortless for people to find playing partners, discover new venues, and stay active together.

## Target Audience

### Primary Users
- **Sports Enthusiasts (Ages 18-45)**: Regular players looking for partners and new venues
- **Casual Players**: People wanting to get back into sports or try new activities
- **Expats & Newcomers**: Individuals seeking social connections through sports

### Secondary Users
- **Venue Owners**: Sports facilities wanting to promote their courts/facilities
- **Sports Communities**: Existing clubs and groups wanting to expand their reach

## Detailed Feature Documentation

### 1. Authentication & Onboarding
#### Login/Register Screen ✅ IMPLEMENTED
- **Email/Password Authentication**: Secure user registration and login
- **Form Validation**: Real-time validation with error messages
- **Password Security**: Minimum requirements and secure storage
- **Account Creation**: Streamlined registration process
- **Error Handling**: Clear feedback for authentication failures
- **Auto-login**: Remember user sessions for seamless experience

### 2. Home Screen ✅ IMPLEMENTED
#### Session Discovery Dashboard
- **Welcome Message**: Personalized greeting with user's name
- **Quick Stats**: Display user's upcoming sessions count
- **Recent Sessions Feed**: Shows latest 5 sessions with:
  - Session sport and venue information
  - Date/time with smart formatting (Today, Tomorrow, specific dates)
  - Skill level badges with sport-specific colors
  - Participant count and availability status
  - Host information
- **Navigation**: Quick access to create new session
- **Real-time Updates**: Automatic refresh of session data
- **Loading States**: Smooth loading indicators for better UX

### 3. Sessions Screen ✅ IMPLEMENTED
#### Comprehensive Session Management
- **Session List View**: Complete list of all available sessions
- **Smart Filtering System**:
  - **Sport Filter**: Shows all available sports with session counts
  - **Skill Level Filter**: Dynamically shows sport-specific skill levels only after sport selection
  - **Cascading Filters**: Skill level options change based on selected sport
  - **Filter Reset**: Automatic skill level reset when sport changes
- **Advanced Search**: Text-based search across session details
- **Session Status Indicators**:
  - **"Available"** (Green): Sessions with open spots
  - **"Joined"** (Blue): Sessions user has already joined
  - **"Almost Full"** (Yellow): Sessions with ≤2 spots remaining
  - **"Full"** (Red): Sessions at maximum capacity
  - **"Expired"** (Gray): Past sessions no longer joinable
- **Smart Session Matching**:
  - Range-aware filtering (e.g., "Mid Beginner" shows "Low Beginner - High Beginner" sessions)
  - Sport-specific skill level understanding
- **Session Cards Display**:
  - Sport name and venue
  - Date/time with intelligent formatting
  - Skill level range with color-coded badges
  - Participant count and spots available
  - Session fee information
  - Host details
- **Pull-to-Refresh**: Manual refresh capability
- **Navigation**: Tap to view session details

### 4. Create Session Screen ✅ IMPLEMENTED
#### Comprehensive Session Creation
- **Sport Selection**:
  - Dropdown with 12+ supported sports
  - Sport-specific configurations (court-based vs open venues)
- **Venue Management**:
  - Searchable venue dropdown with 200+ Singapore venues
  - Custom venue input option (30 character limit)
  - Court number specification for applicable sports
- **Date & Time Selection**:
  - Dual date pickers (start and end dates)
  - Time pickers with validation
  - Support for both manual input and picker selection
- **Skill Level Range System**:
  - **Sport-Specific Levels**: Each sport has tailored skill level names
  - **Dual Dropdown Interface**: Separate "From" and "To" level selection
  - **Smart Auto-completion**: End level auto-fills to match start level
  - **Range Flexibility**: Users can create ranges (e.g., "Beginner - Intermediate")
  - **Rich Level Descriptions**: Each level includes helpful descriptions
  - **Color-Coded Levels**: Visual progression from beginner (green) to expert (purple)
- **Player Management**:
  - Maximum players setting with validation
  - Host inclusion toggle with smart participant counting
- **Session Fee**: Optional fee setting with S$ currency
- **Additional Details**:
  - Optional notes field for extra information
  - Form validation with real-time error clearing
- **Submission Process**:
  - Comprehensive validation before submission
  - Loading states during creation
  - Automatic navigation to session detail after creation

### 5. Session Detail Screen ✅ IMPLEMENTED
#### Rich Session Information Display
- **Header Section**:
  - Sport name and skill level range badge
  - Venue name with court number (if applicable)
  - Session date and time with smart formatting
- **Detailed Information**:
  - Venue details with location information
  - Session fee display
  - Additional notes (if provided)
  - Host information
- **Participant Management**:
  - Complete participant list with names
  - Real-time participant count
  - Spots available calculation
  - Visual participant indicators
- **Session Status**:
  - Dynamic status badges based on availability
  - Expiration detection and handling
- **User Actions**:
  - **Join Session**: For eligible users
  - **Leave Session**: For current participants
  - **Cancel Session**: For session hosts
  - **Host Badge**: Special indicator for session creators
  - **Participant Badge**: Confirmation for joined users
- **Smart Action Logic**:
  - Context-aware button display
  - Prevents invalid actions (e.g., joining full sessions)
  - Handles expired sessions appropriately

### 6. Sport-Specific Skill Level System ✅ IMPLEMENTED
#### Comprehensive Skill Level Framework
- **12 Sports Supported**: Badminton, Tennis, Basketball, Table Tennis, Squash, Volleyball, Football, Swimming, Running, Cycling, Gym/Fitness
- **Sport-Specific Terminology**:
  - **Badminton**: Low Beginner → Mid Beginner → High Beginner → Low Intermediate → Advanced → Expert
  - **Tennis**: Beginner → Intermediate → Advanced → Tournament → Professional
  - **Basketball**: Casual → Recreational → Intermediate → Competitive → Elite
  - **And 9 more sports** with tailored level names
- **Color-Coded Progression**:
  - **Green**: Beginner/Casual levels
  - **Blue**: Recreational/Intermediate levels
  - **Orange**: Intermediate/Advanced levels
  - **Red**: Advanced/Competitive levels
  - **Purple**: Expert/Elite/Professional levels
- **Smart Range Matching**: Users see sessions where their skill level fits within the range
- **Rich Descriptions**: Each level includes helpful descriptions for self-assessment

### 7. Session Management Features ✅ IMPLEMENTED
#### Host Capabilities
- **Session Creation**: Full-featured session creation with all details
- **Participant Management**: View and manage participant lists
- **Session Cancellation**: Ability to cancel hosted sessions
- **Host Identification**: Clear visual indicators for session hosts

#### Participant Features
- **Session Discovery**: Browse and filter available sessions
- **Join/Leave Functionality**: Simple session participation management
- **Status Tracking**: Clear indication of participation status
- **Session History**: View past and upcoming sessions

### 8. Data Management ✅ IMPLEMENTED
#### Robust Backend Integration
- **Real-time Data**: Live session updates and participant changes
- **Data Persistence**: Reliable storage of sessions and user data
- **Error Handling**: Graceful handling of network and data errors
- **Loading States**: Smooth user experience during data operations

### 9. User Interface & Experience ✅ IMPLEMENTED
#### Modern Mobile Design
- **Responsive Layout**: Optimized for mobile devices
- **Intuitive Navigation**: Clear tab-based navigation system
- **Visual Feedback**: Loading indicators, success/error messages
- **Accessibility**: Proper contrast ratios and readable fonts
- **Consistent Styling**: Unified design language across all screens

## Pending Features (To Be Implemented)

### 10. Live Messages/Chat System 🚧 PENDING
#### Personal Messaging
- **Direct Messages**: One-on-one chat between users
- **Session-Related Chat**: Communication between hosts and participants
- **Real-time Messaging**: Instant message delivery and notifications
- **Message Features**:
  - Text messages with emoji support
  - Image sharing capabilities
  - Message status indicators (sent, delivered, read)
  - Typing indicators
  - Message history and search
- **Chat List**: Overview of all active conversations
- **Notification System**: Push notifications for new messages
- **User Safety**: Report and block functionality

#### Group Messaging
- **Session Group Chats**: Automatic group creation for each session
- **Custom Groups**: User-created groups for regular playing partners
- **Group Management**: Admin controls, member management
- **Group Features**:
  - Group announcements
  - File and photo sharing
  - Group polls for scheduling
  - Member roles and permissions

### 11. User Profile Screen 🚧 PENDING
#### Profile Management
- **Personal Information**:
  - Profile photo upload and management
  - Basic details (name, age, location)
  - Contact information and preferences
  - Bio and introduction section
- **Sports Profile**:
  - Sports preferences and interests
  - Skill level declarations for each sport
  - Playing history and statistics
  - Favorite venues and regular playing times
  - Achievement badges and milestones
- **Social Profile**:
  - Ratings and reviews from other users
  - Playing history and session completion rate
  - Reliability score and user reputation
  - Social connections and followers

#### Profile Settings
- **Privacy Controls**:
  - Profile visibility settings
  - Contact information sharing preferences
  - Session history visibility
- **Notification Preferences**:
  - Push notification settings
  - Email notification preferences
  - SMS notification options
- **Account Management**:
  - Password change functionality
  - Account deactivation options
  - Data export and deletion requests

### 12. Digital Wallet & Payment System 🚧 PENDING
#### Wallet Management
- **Wallet Dashboard**:
  - Current balance display
  - Recent transaction history
  - Spending analytics and insights
- **Top-up Options**:
  - PayNow integration
  - Credit card payments
  - Bank transfer options
  - Minimum and maximum top-up limits
- **Payment Features**:
  - Automatic session fee deduction
  - Payment confirmation and receipts
  - Refund processing for cancelled sessions
  - Split payment options for group sessions

#### Transaction Management
- **Payment History**: Detailed transaction logs
- **Spending Analytics**: Monthly/yearly spending reports
- **Budget Tools**: Set spending limits and alerts
- **Security Features**: PIN/biometric authentication for payments

### 13. Enhanced Social Features 🚧 PENDING
#### Social Networking
- **User Following**: Follow other players and see their activities
- **Activity Feed**: Timeline of friends' sessions and activities
- **User Discovery**: Find players with similar interests and skill levels
- **Social Recommendations**: Suggested players and sessions based on activity

#### Community Features
- **User Groups**: Create and join interest-based groups
- **Regular Playing Groups**: Recurring session groups with consistent members
- **Group Scheduling**: Coordinate regular sessions within groups
- **Group Challenges**: Friendly competitions between groups

### 14. Advanced Session Features 🚧 PENDING
#### Enhanced Session Management
- **Recurring Sessions**: Set up weekly/monthly recurring sessions
- **Waitlist Management**: Queue system for full sessions
- **Session Templates**: Save and reuse common session configurations
- **Bulk Session Creation**: Create multiple sessions at once

#### Session Communication
- **Session Updates**: Broadcast updates to all participants
- **Attendance Tracking**: Check-in system for session attendance
- **Session Photos**: Share photos from completed sessions
- **Post-Session Reviews**: Rate and review sessions and participants

### 15. Venue & Location Features 🚧 PENDING
#### Enhanced Venue System
- **Venue Reviews**: User-generated reviews and ratings for venues
- **Venue Photos**: User-uploaded photos of venues and facilities
- **Venue Amenities**: Detailed information about facilities and services
- **Real-time Availability**: Integration with venue booking systems (where possible)

#### Map Integration
- **Interactive Map**: Visual session discovery on Singapore map
- **Location-based Search**: Find sessions near current location
- **Directions Integration**: Navigate to venues using preferred map app
- **Public Transport Info**: MRT/bus information for venue access

## Current Implementation Status

### ✅ Fully Implemented Features
1. **Authentication System**: Complete login/register functionality
2. **Home Dashboard**: Personalized session feed and quick stats
3. **Session Discovery**: Advanced filtering and search capabilities
4. **Session Creation**: Comprehensive session creation with sport-specific features
5. **Session Management**: Join/leave/cancel functionality
6. **Skill Level System**: Sport-specific skill levels with range matching
7. **User Interface**: Modern, responsive mobile design
8. **Data Management**: Robust backend integration with real-time updates

### 🚧 Partially Implemented Features
1. **User Profiles**: Basic user data exists but no dedicated profile screen
2. **Venue System**: Venue selection available but no detailed venue information
3. **Notification System**: Basic session updates but no push notifications

### ❌ Not Yet Implemented Features
1. **Live Messaging/Chat System**: Complete messaging functionality
2. **Profile Management Screen**: User profile viewing and editing
3. **Digital Wallet**: Payment system and wallet management
4. **Social Features**: Following, activity feeds, user groups
5. **Advanced Session Features**: Recurring sessions, waitlists, templates
6. **Map Integration**: Interactive maps and location-based features
7. **Venue Discovery**: Detailed venue information and reviews
8. **Push Notifications**: Real-time notifications for app events

## Technical Architecture

### Current Technology Stack ✅ IMPLEMENTED
- **Frontend**: React Native with Expo
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **State Management**: React Query for data fetching
- **Navigation**: React Navigation
- **UI Components**: Custom components with consistent styling

### Pending Integrations 🚧 PENDING
- **Real-time Communication**: Socket.io for live messaging
- **Push Notifications**: Expo Notifications
- **Payment Processing**: PayNow, Stripe integration
- **Map Services**: Google Maps API
- **File Storage**: AWS S3 or similar for image uploads
- **Location Services**: GPS and location-based features

## Technical Requirements

### Platform
- Native iOS and Android mobile apps
- Responsive web interface (future phase)

### Core Technologies
- Real-time messaging and notifications
- GPS and mapping integration (Google Maps)
- Payment processing (PayNow, credit cards)
- Photo/video sharing capabilities
- Push notification system

### Integration Requirements
- Singapore mapping and location services
- Local payment systems (PayNow, NETS)
- Social media platforms (optional login)
- Weather API for outdoor sports
- Public transport information (LTA DataMall)

## User Experience Flow

### New User Onboarding
1. Download app and create account
2. Complete profile setup (interests, skill level, location)
3. Set up digital wallet (optional)
4. Browse tutorial highlighting key features
5. Encouraged to join first session or create one

### Creating a Session
1. Select sport type and basic details
2. Choose venue from map or search
3. Set date, time, and participant requirements
4. Add description and additional details
5. Publish session

### Joining a Session
1. Browse sessions in unified home feed
2. Apply filters (sport, date, location, skill level)
3. View session details and venue information
4. Check host profile and reviews
5. Join session and chat directly with organizer
6. Receive session reminders and updates

### Using Chat System
1. Access personal chats with session organizers
2. Join or create user groups for regular play
3. Receive notifications for new messages
4. Share photos and coordinate meet-ups

## Business Model

### Revenue Streams
1. **Freemium Model**: Basic features free, premium features for power users
2. **Transaction Fees**: Small percentage on paid sessions
3. **Venue Partnerships**: Commission from venue bookings
4. **Premium Subscriptions**: Advanced features, priority support, ad-free experience
5. **Corporate Partnerships**: Team building packages for companies

### Monetization Strategy
- Launch with free model to build user base
- Introduce premium features after reaching critical mass
- Partner with venues for mutual promotion
- Develop corporate and event management services

## Feature Implementation Summary

| Feature Category | Status | Completion | Key Components |
|------------------|--------|------------|----------------|
| **Authentication** | ✅ Complete | 100% | Login, Register, Session Management |
| **Session Discovery** | ✅ Complete | 100% | Home Feed, Advanced Filtering, Search |
| **Session Creation** | ✅ Complete | 100% | Multi-sport, Skill Levels, Venue Selection |
| **Session Management** | ✅ Complete | 100% | Join/Leave, Host Controls, Status Tracking |
| **Skill Level System** | ✅ Complete | 100% | 12 Sports, Range Matching, Color Coding |
| **User Interface** | ✅ Complete | 95% | Mobile Design, Navigation, Responsive Layout |
| **Data Management** | ✅ Complete | 90% | Real-time Updates, Error Handling |
| **Live Messaging** | 🚧 Pending | 0% | Personal Chat, Group Chat, Notifications |
| **User Profiles** | 🚧 Pending | 20% | Profile Screen, Settings, Social Features |
| **Payment System** | ❌ Not Started | 0% | Digital Wallet, PayNow, Fee Management |
| **Social Features** | ❌ Not Started | 0% | Following, Activity Feed, User Groups |
| **Map Integration** | ❌ Not Started | 0% | Interactive Maps, Location Services |
| **Push Notifications** | ❌ Not Started | 0% | Real-time Alerts, Message Notifications |

## Current Success Metrics

### Implemented Features Performance
- **Session Creation**: Fully functional with comprehensive validation
- **Session Discovery**: Advanced filtering with sport-specific skill levels
- **User Experience**: Smooth navigation and responsive design
- **Data Reliability**: Real-time updates with error handling
- **Multi-sport Support**: 12 sports with tailored skill level systems

### Target Metrics for Next Phase
- **User Engagement**: Implement messaging to increase daily active users
- **Session Participation**: Add social features to boost session join rates
- **User Retention**: Profile management and social connections
- **Platform Growth**: Payment system to enable paid sessions
- **Community Building**: Group features and user following system

## Updated Development Roadmap

### Phase 1 (MVP) ✅ COMPLETED
- ✅ Basic session creation and joining functionality
- ✅ User authentication and basic profiles
- ✅ Multi-sport support (12+ sports implemented)
- ✅ Advanced filtering and search capabilities
- ✅ Sport-specific skill level system
- ✅ Mobile app (React Native/Expo)
- ✅ Comprehensive session management
- ✅ Real-time data updates

### Phase 2 (Current Focus) 🚧 IN PROGRESS
**Priority 1 - Core User Experience**
- 🚧 Live messaging and chat system
- 🚧 User profile management screen
- 🚧 Push notification system
- 🚧 Enhanced session features (recurring sessions, waitlists)

**Priority 2 - Social Features**
- ❌ User following and activity feeds
- ❌ User groups and community features
- ❌ Session photo sharing
- ❌ Enhanced social interactions

### Phase 3 (Next Quarter) 📋 PLANNED
**Priority 1 - Payment & Commerce**
- ❌ Digital wallet implementation
- ❌ PayNow and payment gateway integration
- ❌ Session fee management
- ❌ Refund and payment dispute handling

**Priority 2 - Location & Discovery**
- ❌ Interactive map integration
- ❌ Location-based session discovery
- ❌ Venue information and reviews
- ❌ Directions and transport integration

### Phase 4 (Future) 📋 PLANNED
**Advanced Features**
- ❌ AI-powered session recommendations
- ❌ Advanced analytics and insights
- ❌ Venue partnership program
- ❌ Corporate team building features
- ❌ Web platform launch

**Business Development**
- ❌ Premium subscription model
- ❌ Revenue optimization
- ❌ Partnership integrations
- ❌ Market expansion planning

## Risk Considerations

### Technical Risks
- Scalability challenges with real-time features
- Map and location accuracy in Singapore
- Payment processing compliance
- Data privacy and security

### Business Risks
- Competition from established platforms
- Venue partnership acquisition
- User acquisition costs
- Seasonal sports participation fluctuations

### Mitigation Strategies
- Phased rollout to test scalability
- Strong partnerships with local venues
- Focus on community building over pure growth
- Diversified sports portfolio to balance seasonality

## Conclusion

SportConnect SG has the potential to become Singapore's leading sports social platform by focusing on user experience, community building, and local market needs. The phased approach allows for iterative development based on user feedback while building a sustainable business model.

The success of this platform depends on creating a trusted, safe, and engaging environment where sports enthusiasts can easily connect and play together, ultimately contributing to a more active and connected Singapore.