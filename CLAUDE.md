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

## Code related documentation can be found in the [docs directory](./docs/) 

## Code Style Guidelines
- **Component Structure**: Use standalone components with OnPush change detection
- **State Management**: Use Angular signals and [@ngrx/signalStore](./docs/ngrx-signal-store/index.md)
- **Async Code**: Prefer async/await over direct Observable usage
- **Utility Functions**: Use lodash over native array/object methods
- **Modules**: Never use Angular Modules, only standalone components
- **Routing**: Use static routes files, always lazy-load non-primary routes
- **Files**: Separate HTML, CSS, and TS into individual files
- **Reactivity**: Always use signals and signal-based functions (input(), output())
- **Imports**: Group imports logically (Angular core, libraries, project)
- **Error Handling**: Use try/catch with consistent error logging pattern

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

## Data Flow Patterns

### Channel Loading
Firebase → FirestoreService → ChannelService → ChannelsState → Components

### Video Playback
User Action → VideoPlayerService (RxJS subjects) → WhytvPlayerComponent → videoPlayerState

### User Activity
User Interaction → UserActivityService → userActivity$ observable → UI visibility

## Firebase Functions Flow
Channel creation follows this status progression:
`new` → `processing queries` → `queries ready` → `select_videos` → `videos_selected` → `created`

Each function updates the status to trigger the next function in the chain.
