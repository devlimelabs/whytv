# WhyTV Project Overrides

This document lists all intentional deviations from the standard Angular coding patterns defined in `angular-coding-standards.md`. Each override includes what rule is being broken, why it's necessary, and when it should be fixed.

## State Management Overrides

### 1. Unprotected State Stores
**Standard Violated**: CS-S03 (Update state via service methods only)
**Current Implementation**: 
```typescript
signalStore({
  protectedState: false, // Allows direct patchState calls
  providedIn: 'root'
})
```
**Why**: Rapid prototyping phase; easier to iterate on state structure
**When to Fix**: Before production release
**Fix Plan**: Set `protectedState: true` and ensure all state updates go through services

### 2. Direct Player State Updates
**Standard Violated**: CS-S01 (One-way data flow)
**Current Implementation**: WhytvPlayerComponent directly updates videoPlayerState for time/duration
**Why**: Performance - frequent updates (every ~250ms) would create overhead through service layer
**When to Fix**: This is an acceptable permanent override for performance-critical updates
**Mitigation**: Only time/duration updates are direct; all other updates follow standard pattern

### 3. Mixed RxJS/Signals Pattern
**Standard Violated**: CS-A01 (Use async/await for one-time operations)
**Current Implementation**: VideoPlayerService uses RxJS Subjects as event bus
```typescript
private playSubject = new Subject<void>();
play$ = this.playSubject.asObservable();
```
**Why**: YouTube Player API requires event-driven architecture; multiple components need to send commands
**When to Fix**: This is an acceptable pattern for this specific use case
**Mitigation**: Only used for player commands, not for data fetching

## Architectural Issues (To Be Fixed)

### 4. Duplicate Event Handlers
**Standard Violated**: Single Responsibility Principle
**Current Implementation**: HomePage has duplicate handlers that exist in SideActionsComponent
**Why**: Legacy code from iterative development
**When to Fix**: Next refactoring sprint
**Fix Plan**: Remove duplicates from HomePage, use only SideActionsComponent

### 5. Component State Management
**Standard Violated**: CS-S01 (One-way data flow)
**Current Implementation**: Some components update state directly instead of through services
**Why**: Inconsistent implementation during development
**When to Fix**: As encountered during feature work
**Fix Plan**: Refactor to use service methods for all state updates

### 6. Console.log Statements
**Standard Violated**: Production code quality
**Current Implementation**: console.log statements throughout codebase
**Why**: Development debugging
**When to Fix**: Before any release
**Fix Plan**: Remove all console.log statements or replace with proper logging service

## Performance Considerations

### 7. Eager Video Loading
**Standard Violated**: Lazy loading best practices
**Current Implementation**: All channel videos loaded upfront
**Why**: Simpler initial implementation
**When to Fix**: When channels have >50 videos
**Fix Plan**: Implement virtual scrolling and pagination

## Temporary Workarounds

### 8. Missing Features with UI Elements
**Current Implementation**: Buttons for Comments, Share, SpeedDial exist but have no implementation
**Why**: UI mockup implemented before features
**When to Fix**: As features are implemented
**Note**: This is tracked in CLAUDE.md under "Missing/Incomplete Features"

---

## Override Review Schedule

These overrides should be reviewed:
- **Weekly**: During team code review sessions
- **Before Release**: All non-performance overrides must be resolved
- **Quarterly**: Re-evaluate performance overrides for better solutions

## Adding New Overrides

When adding a new override:
1. Document the specific standard being violated (with code reference)
2. Explain why it's necessary (performance, external API, temporary, etc.)
3. Define when it should be fixed (specific condition or "permanent")
4. Include a fix plan or mitigation strategy
