# WhyTV State Architecture

## Overview

WhyTV transforms how users discover and engage with YouTube content through AI-powered channel curation and a TV-like viewing experience. Our state management architecture leverages Angular signals and @ngrx/signals to create a reactive, performant foundation.

The architecture uses three distinct state stores, each serving a specific purpose while maintaining clean separation of concerns.

## Current Architecture (3 Stores)

### ChannelsState (Store & Service)

**Store Responsibilities:**
- Channel catalog management (all channels with 'live' status)
- Current channel selection tracking
- Video collections for each channel
- Current video index tracking within active channel
- Channel metadata (name, number, description, AI model settings)

**Service Responsibilities (ChannelService):**
- Channel data fetching from Firestore
- Channel creation and management
- Current channel selection
- Video navigation within channels

**Key Design Decision:** Videos are embedded within channels rather than having their own store, simplifying the data model since videos always belong to a channel in our TV-like experience.

### videoPlayerState (Store & Service)

**Store Responsibilities:**
- Playback state (playing/paused/buffering/ended)
- Player settings (volume, muted state, playback speed)
- Current video metadata (title, duration, current time)
- UI visibility states (controls visibility, user activity)
- Liked status for current video

**Service Responsibilities (VideoPlayerService):**
- Player control event streams (play$, pause$, seek$, volume$, etc.)
- YouTube API interaction abstraction
- Player state synchronization
- Coordinating between components and player instance

**Special Pattern:** Uses RxJS Subjects as an event bus for player controls, allowing components to emit commands that the player component subscribes to.

### UserActivityState (Class-based State)

**State Responsibilities:**
- User activity tracking (active/inactive)
- Last activity timestamp
- Inactivity timeout management

**Service Responsibilities (UserActivityService):**
- Activity detection and timeout logic
- Emitting activity state changes
- Managing the 3-second inactivity timer

**Key Pattern:** Uses signalState with patchState for updates, exposes readonly signals for consumption.

## Data Flow Patterns

### One-Way Data Flow (Critical)
```
User Action → Component → Service → Store → Component (via signals)
```

**Important:** This one-way flow prevents circular updates that were causing issues in earlier implementations.

### Current Implementation Details

1. **State Protection:** Currently using `protectedState: false` to allow direct updates (to be fixed in Phase 2)
2. **Component Access:** Components inject both services and stores directly
3. **Event Coordination:** VideoPlayerService acts as event coordinator between components

## Missing from Original Vision

The original 4-domain architecture included a dedicated User Store for:
- Authentication state
- User preferences
- Watch history
- Favorites

These features are not yet implemented but may be added in future phases.

## Best Practices

1. **Read from Stores:** Components should read state via store signals
2. **Update via Services:** State changes should go through service methods
3. **Avoid Direct Updates:** Don't use patchState directly in components (once protection is enabled)
4. **Single Source of Truth:** Each piece of state should have one authoritative store

## Future Considerations

1. **Route-based State:** Plan to integrate channel/video selection with routing for shareable URLs
2. **User Preferences:** May add a full UserStore when authentication is implemented
3. **Performance:** Consider splitting video data into separate store if channel lists grow large

This architecture provides a solid foundation while remaining pragmatic about current needs versus future scalability.