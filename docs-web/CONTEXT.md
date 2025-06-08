# 🚗 Car Enthusiast Social Platform

## Overview

A dedicated web platform for car enthusiasts that combines social networking with practical tools. Users can showcase their vehicles, track modifications, post updates, and discover local car events. The platform serves as a digital garage, build journal, and event locator — all in one place.

## Tech Stack

- Frontend: React with TypeScript
- Backend/Database: Supabase
- UI Framework: Material-UI (MUI)
- AI Processing: DeepSeek
- State Management: Redux Toolkit
- Routing: React Router

## 🔄 Platform Flow

### Authentication

- **Login/Registration**
  - Email/password or Google sign-in
  - New user profile setup
  - OAuth integration

### Main Navigation

- **Home Page (Feed)**
  - Default landing page after login
  - Posts from followed users and trending content
  - Interactive features: likes, comments, profile exploration
  - Infinite scroll implementation

### Navigation Menu

1. **Feed**: Community social posts
2. **Events**: Local car meets, shows, and track days
3. **Garage**: User's vehicle collection
4. **Profile**: Personal information and social stats

### Key Pages

- **Garage → Car Detail**

  - Full vehicle profile
  - Photos and build timeline
  - Detailed specifications
  - Responsive image gallery

- **Garage → Add/Edit Car**

  - Vehicle information input form
  - Drag-and-drop photo upload
  - Status tagging (project, daily, etc.)
  - Real-time validation

- **Post Creation**

  - Car selection dropdown
  - Media upload with preview
  - Rich text editor for captions
  - Public feed submission

- **Events Page**
  - Interactive map view
  - List/grid view toggle
  - Detailed event information
  - RSVP functionality
  - Calendar integration

## 🧩 Core Features

### 1. User Profiles & Garage

- **Profile Components**

  - Username and bio
  - Profile picture with cropping tool
  - Vehicle showcase grid
  - Post history with filtering

- **Garage Features**
  - Multiple vehicle support
  - Detailed specifications
  - Photo galleries with lightbox
  - Status tracking
  - Export functionality

### 2. Build Tracker

- Interactive timeline
- Update logging with photo uploads
- Chronological build history
- Modification documentation
- Cost tracking and analytics

### 3. Social Feed

- **Post Components**

  - Photo/video content with lazy loading
  - Rich text captions
  - Car associations
  - Engagement features
  - Share functionality

- **Navigation**
  - User profiles
  - Vehicle profiles
  - Interactive elements
  - Keyboard shortcuts

### 4. Event Finder

- **Discovery Features**
  - Location-based search with Google Maps
  - Advanced date filtering
  - Event categorization
  - Interactive map integration
  - Calendar export

## 🛠 Future Enhancements

- Modification/expense tracking with charts
- License plate recognition feature
- User-hosted events with ticketing
- Car club creation and management
- Marketplace integration
- Real-time messaging
- Browser notifications
- Milestone tracking with achievements

## 🎯 Target Audience

- Car enthusiasts
- College car clubs
- Track enthusiasts
- Show car owners
- Automotive communities
- Car dealerships
- Automotive journalists

## 💡 Monetization Strategy

- Premium user tier with advanced features
- Sponsored events and listings
- Local business promotion
- Marketplace transaction fees
- Featured listings
- Premium analytics

## 📱 Summary

This platform addresses a growing need in the automotive community by providing a purpose-built digital space that combines social interaction with practical tools. It supports both casual enthusiasts and dedicated gearheads through its hybrid model of social features and functional capabilities, optimized for web browsers.

## 📊 Database Schema

[Previous database schema remains unchanged]

## 📁 Folder Structure

```
car-enthusiast-web/
├── public/                 # Static files
│   ├── images/
│   ├── fonts/
│   └── icons/
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/       # Shared components
│   │   ├── feed/        # Feed-specific components
│   │   ├── garage/      # Garage-specific components
│   │   └── events/      # Event-specific components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and external services
│   │   ├── supabase/   # Supabase client and queries
│   │   └── ai/         # AI processing services
│   ├── store/          # Redux store
│   │   ├── slices/     # Redux slices
│   │   └── middleware/ # Redux middleware
│   ├── utils/          # Helper functions
│   ├── constants/      # App constants
│   ├── types/         # TypeScript type definitions
│   └── context/       # React Context providers
├── styles/            # Global styles
├── tests/            # Test files
├── .env.example      # Environment variables example
├── package.json      # Dependencies and scripts
├── tsconfig.json    # TypeScript config
└── README.md        # Project documentation
```

This structure follows React best practices, with a clear separation of concerns and modular organization. The src directory contains all the business logic and components, while the public directory holds static assets.
