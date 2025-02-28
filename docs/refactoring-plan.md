# WhyTV Refactoring Plan

This document outlines the plan for refactoring the WhyTV application to improve organization, maintainability, and implement best practices.

## Primary Goals

- [ ] Replace the custom YouTube player with the official Google Angular YouTube Player component
- [ ] Implement signal states for reactive state management
- [ ] Improve code organization and maintainability

## 1. YouTube Player Replacement Strategy

The current implementation uses a custom YouTube player that interacts with the YouTube IFrame API. We'll replace it with the official `@angular/youtube-player` component provided by Google, which offers comprehensive API support and performance optimizations.

### Implementation Steps

- [x] **Create a New YouTube Player Component**
  - [x] Create a new component called `google-youtube-player` with separate `.ts`, `.html`, and `.css` files
  - [x] Import and use the `YouTubePlayer` component from `@angular/youtube-player`
  - [x] Implement basic functionality: video loading and playback
  - [x] Set up ViewChild reference to access the YouTube Player instance methods

- [x] **Implement Feature Parity**
  - [x] Add play/pause functionality using the player's built-in methods
  - [x] Add video progress tracking with appropriate event handling
  - [x] Implement custom controls using the component's API methods
  - [x] Add support for next/previous video
  - [x] Implement error handling with the error event
  - [] Implement volume and playback rate controls

- [ ] **Optimize Player Performance**
  - [ ] Configure the player to use placeholders for better initial load performance
  - [ ] Set appropriate player configuration via PlayerVars
  - [ ] Implement OnPush change detection to reduce rendering cycles
  - [ ] Take advantage of zoneless Angular for efficient rendering

- [ ] **Integrate with Application**
  - [ ] Update the app component to conditionally use the new player
  - [ ] Add a toggle to switch between old and new player during testing
  - [ ] Ensure all events from the old player are supported in the new player
  - [ ] Handle missing APIs (if any) through custom implementations

- [ ] **Full Replacement**
  - [ ] Once feature parity is achieved, remove the old player component
  - [ ] Update all references to use the new player component

## 2. Signal State Implementation

We'll implement signal states using the `@ngrx/signals` library to manage state reactively. The empty state files in the `states` directory will be populated with appropriate state definitions.

### State Implementation Plan

- [ ] **Video Player State**
  - [ ] Create state for player status (playing, paused, loading, buffering, ended, unstarted, cued)
  - [ ] Add video information state (current video, duration, progress)
  - [ ] Implement player control state (volume, playback rate, muted status)
  - [ ] Add user interaction state (likes, comments)
  - [ ] Implement error state for player errors
  - [ ] Add quality levels state (available and current quality)

- [ ] **Channels State**
  - [ ] Create state for available channels
  - [ ] Add loading and error states
  - [ ] Implement selection functionality
  - [ ] Add pagination state if needed

- [ ] **Active Channel State**
  - [ ] Create state for currently selected channel
  - [ ] Add channel details (name, videos, subscribers)
  - [ ] Implement active video tracking within channel
  - [ ] Add playlist state for channel videos

### State Integration Steps

- [ ] **Connect YouTube Service to States**
  - [ ] Update service to update states instead of direct component interaction
  - [ ] Implement state-based data retrieval
  - [ ] Add computed state properties for derived data
  - [ ] Create proper action methods that update state (e.g., setVolume, playVideo)

- [ ] **Refactor Components to Use States**
  - [ ] Update YouTube player component to use video-player state
  - [ ] Modify channel components to use channels and active-channel states
  - [ ] Ensure proper state update patterns are followed
  - [ ] Implement proper rxjs interop with signals using rxMethod when needed

## 3. Component Refactoring

Beyond the YouTube player and state implementation, we'll refactor other components to follow best practices.

- [ ] **Implement OnPush Change Detection**
  - [ ] Ensure all components use OnPush change detection strategy
  - [ ] Review and optimize detection trigger patterns
  - [ ] Use signals for reactive state that triggers view updates

- [ ] **Standardize Component Structure**
  - [ ] Separate component code into appropriate files (ts, html, css)
  - [ ] Ensure consistent naming conventions
  - [ ] Add proper documentation and comments
  - [ ] Use signals-based input() and output() functions

- [ ] **Optimize Component Composition**
  - [ ] Review component responsibilities and split if needed
  - [ ] Identify shared functionality for extraction to services
  - [ ] Implement proper component interaction patterns
  - [ ] Leverage signal-based computed values for derived state

## 4. Testing Strategy

To ensure our refactoring doesn't break existing functionality, we'll implement a comprehensive testing strategy.

- [ ] **Create Unit Tests**
  - [ ] Add tests for the new YouTube player component
  - [ ] Test signal state implementation
  - [ ] Verify service functionality
  - [ ] Mock YouTube Player API for isolated component testing

- [ ] **Add Integration Tests**
  - [ ] Test component interaction
  - [ ] Verify state updates across the application
  - [ ] Test user flows and scenarios
  - [ ] Verify YouTube player event handling

## 5. Phase Implementation

The refactoring will be implemented in phases to minimize disruption and allow for proper testing.

### Phase 1: Signal State Implementation
- [ ] Implement base signal states
- [ ] Connect existing components to states
- [ ] Test and verify state functionality

### Phase 2: YouTube Player Replacement
- [ ] Create new player component with YouTube Player API integration
- [ ] Implement placeholder optimization strategy for better performance
- [ ] Set up proper event handling and state integration
- [ ] Implement side-by-side testing
- [ ] Gradually migrate functionality

### Phase 3: Component Refactoring
- [ ] Update remaining components to use best practices
- [ ] Optimize performance and user experience
- [ ] Finalize documentation

## Progress Tracking

Use this section to track overall progress on the refactoring effort.

- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] All tests passing
- [ ] Documentation updated 
