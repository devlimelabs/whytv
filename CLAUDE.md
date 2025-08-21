You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

# WhyTV Development Guide

## Project Overview

WhyTV is a web application that provides a TV-like experience for watching YouTube videos. Users create custom "channels" based on descriptions of their interests, and the system uses AI to automatically curate endless video playlists from YouTube.

## Commands
- **Dev Server**: `ng serve` or `npm start` - Start local development
- **Build**: `ng build` or `npm run build` - Build for production
- **Test**: `ng test` - Run unit tests with Karma
- **Generate**: `ng generate component component-name` - Create component
- **Functions**:
  - `cd functions && npm run build` - Build Firebase functions
  - `cd functions && npm run serve` - Start Firebase emulators
  - `cd functions && npm run lint` - Lint Firebase functions

## Documentation Guide

- **Coding Standards**: See [CODING_STANDARDS](./CODING_STANDARDS/) directory for universal Angular/TypeScript standards
- **Quick Reference**: [Angular Cheat Sheet](./CODING_STANDARDS/angular-cheat-sheet.md) with law codes
- **Navigation Guide**: [Documentation Map](./CODING_STANDARDS/documentation-map.md) for finding information
- **Library References**: See [docs directory](./docs/) for external library documentation
- **Project Overrides**: [Project-specific deviations](./CODING_STANDARDS/project-overrides.md) from standards

## CSS Architecture Guidelines

- **View Encapsulation**: Always use `ViewEncapsulation.None` to avoid ng-deep anti-pattern
- **Component Styles**: Wrap all styles in component's selector (e.g., `app-my-component { }`)
- **PrimeNG Overrides**: Use nested selectors within component wrapper
- **Never Use**: Avoid `:host` and `::ng-deep` selectors

## Current State & Known Issues

### Missing/Incomplete Features
1. **Video Controls**: No custom controls UI (progress bar, volume slider, playback speed)
2. **Channel Rail**: Referenced but component doesn't exist
3. **Comments**: Button exists but no implementation
4. **Share**: Button exists but no implementation
5. **SpeedDial Menu**: Implemented but commented out in template

### Architectural Issues
1. **State Fragmentation**: Three different stores (channels, videoPlayer, userActivity) with overlapping concerns
2. **Inconsistent Data Flow**: Some components update state directly, others use services
3. **Duplicate Code**: HomePage has duplicate handlers that exist in SideActionsComponent
4. **Performance**: All channel videos loaded upfront, no lazy loading

### Clean-up Needed
1. Remove console.log statements throughout codebase
2. Remove duplicate event handlers in HomePage
3. Consolidate channel creation to use only CreateChannelDialogComponent
4. Fix unprotected state stores (currently using `protectedState: false`)

## State Management Patterns (CRITICAL)

### The One-Way Data Flow Rule [CS-S01]
**ALWAYS follow this pattern to prevent circular updates:**
```
User Action → Component → Service Method → Store Update → Component (via signals)
```

### ✅ CORRECT Patterns

#### Reading State in Components [CS-S02]
```typescript
// GOOD: Read from store signals
export class MyComponent {
  private channelsState = inject(ChannelsState);
  
  // Use signals directly in template
  currentChannel = this.channelsState.currentChannel;
  
  // Or create computed signals
  hasVideos = computed(() => 
    this.channelsState.currentChannel()?.videos?.length > 0
  );
}
```

#### Updating State via Services [CS-S03]
```typescript
// GOOD: Update through service methods
export class MyComponent {
  private channelService = inject(ChannelService);
  
  selectChannel(channelId: string) {
    // Service handles the state update
    this.channelService.setCurrentChannel(channelId);
  }
}
```

#### Service Implementation Pattern
```typescript
// GOOD: Service updates store
export class ChannelService {
  private channelsState = inject(ChannelsState);
  
  setCurrentChannel(channelId: string) {
    const channel = this.channelsState.channels()
      .find(c => c.id === channelId);
    
    if (channel) {
      patchState(this.channelsState, {
        currentChannel: channel,
        currentVideoIndex: 0
      });
    }
  }
}
```

### ❌ INCORRECT Patterns (AVOID THESE)

#### Direct State Updates in Components
```typescript
// BAD: Component directly updates store
export class MyComponent {
  private channelsState = inject(ChannelsState);
  
  selectChannel(channel: Channel) {
    // NEVER do this in components!
    patchState(this.channelsState, {
      currentChannel: channel
    });
  }
}
```

#### Multiple State Updates in Different Places
```typescript
// BAD: State for same feature managed in multiple places
// This caused the circular update issues mentioned by the user
export class ComponentA {
  showControls = signal(false); // Local state
}

export class ComponentB {
  playerState = inject(videoPlayerState);
  // Different component managing same concept
  updateControls() {
    patchState(this.playerState, { showControls: true });
  }
}
```

### Store-Specific Patterns

#### ChannelsState Pattern
- **Read**: Use signals for current channel, videos, etc.
- **Update**: Only through ChannelService methods
- **Never**: Update channel/video selection directly in components

#### videoPlayerState Pattern
- **Read**: Use signals for playback state, volume, etc.
- **Update**: Through VideoPlayerService methods or RxJS subjects
- **Special**: Player component can update time/duration directly for performance

#### UserActivityState Pattern
- **Read**: Use isActive signal and activity$ observable
- **Update**: Only through UserActivityService.markActive()
- **Never**: Manage activity state locally in components

### Event Handling Best Practices

```typescript
// GOOD: Centralized event handling
export class SideActionsComponent {
  private videoPlayerService = inject(VideoPlayerService);
  
  handleMuteToggle() {
    // Service handles state update
    this.videoPlayerService.toggleMute();
  }
}
```

### Common Pitfalls to Avoid

1. **Don't create local state** for anything shared between components
2. **Don't subscribe to subjects** in multiple places to update the same state
3. **Don't use both signals and RxJS** for the same state concept
4. **Don't update state in effects** or computed signals
5. **Don't forget to clean up** subscriptions (use takeUntilDestroyed)

## Data Flow Patterns

### Channel Loading
Firebase → FirestoreService → ChannelService → ChannelsState → Components

### Video Playback
User Action (outside of player component) → VideoPlayerService (RxJS subjects) → WhytvPlayerComponent → videoPlayerState

### User Activity
User Interaction → UserActivityService → userActivity$ observable → UI visibility

## Firebase Functions Flow
Channel creation follows this status progression:
`new` → `processing queries` → `queries ready` → `select_videos` → `videos_selected` → `created`

Each function updates the status to trigger the next function in the chain.

## WhyTV State Architecture

### Overview [CS-S04]
WhyTV uses three distinct state stores with Angular signals and @ngrx/signals, each serving a specific purpose while maintaining clean separation of concerns.

### Current Architecture (3 Stores)

#### ChannelsState (Store & Service)
**Store Responsibilities:**
- Channel catalog management (all channels with 'live' status)
- Current channel selection tracking
- Video collections for each channel
- Current video index tracking within active channel
- Channel metadata (name, number, description, AI model settings)

**Service (ChannelService):** [CS-S05]
- Channel data fetching from Firestore
- Channel creation and management
- Current channel selection
- Video navigation within channels

**Key Design:** Videos are embedded within channels rather than having their own store, simplifying the data model since videos always belong to a channel.

#### videoPlayerState (Store & Service)
**Store Responsibilities:**
- Playback state (playing/paused/buffering/ended)
- Player settings (volume, muted state, playback speed)
- Current video metadata (title, duration, current time)
- UI visibility states (controls visibility, user activity)
- Liked status for current video

**Service (VideoPlayerService):**
- Player control event streams (play$, pause$, seek$, volume$, etc.)
- YouTube API interaction abstraction
- Player state synchronization
- Coordinating between components and player instance

**Special Pattern:** Uses RxJS Subjects as an event bus for player controls, allowing components to emit commands that the player component subscribes to.

#### UserActivityState (Signal-based State)
**State Responsibilities:**
- User activity tracking (active/inactive)
- Last activity timestamp
- Inactivity timeout management

**Service (UserActivityService):**
- Activity detection and timeout logic
- Emitting activity state changes
- Managing the 3-second inactivity timer

### Implementation Notes
- Currently using `protectedState: false` to allow direct updates (temporary)
- Components inject both services and stores directly
- VideoPlayerService acts as event coordinator between components
