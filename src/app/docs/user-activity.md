# User Activity System

The User Activity system provides a way to track user interaction with the application and automatically show/hide UI elements based on user activity. This is particularly useful for creating a clean viewing experience where UI controls fade away when not in use.

## Architecture

The system follows the state architecture pattern used throughout the application:

1. **UserActivityState**: Maintains the current activity state
2. **UserActivityService**: Handles user interaction events and updates the state
3. **UserActivityVisibilityDirective**: Directive for easily applying visibility based on activity

## How It Works

- The system tracks user activity through mouse movements, clicks, key presses, and touch events
- After 3 seconds of inactivity, the user is considered inactive
- Components can react to this state change either through the directive or by directly accessing the state

## Usage

### 1. Using the Directive

The simplest way to use the system is with the `whytvActivityVisibility` directive:

```html
<!-- Show when active, hide when inactive (default behavior) -->
<div whytvActivityVisibility>
  This will fade out after 3 seconds of inactivity
</div>

<!-- Hide when active, show when inactive -->
<div whytvActivityVisibility [invertBehavior]="true">
  This will appear after 3 seconds of inactivity
</div>

<!-- Customize transition duration -->
<div whytvActivityVisibility [transitionDuration]="'0.8s'">
  This will fade with a longer transition
</div>
```

### 2. Using the State Directly

For more complex scenarios, you can inject and use the state directly:

```typescript
import { Component, inject } from '@angular/core';
import { UserActivityState } from '../states/user-activity.state';

@Component({
  selector: 'my-component',
  template: `
    <div [class.visible]="userActivityState.isActive()">
      Only visible when user is active
    </div>
  `
})
export class MyComponent {
  readonly userActivityState = inject(UserActivityState);
}
```

### 3. Manually Triggering Activity

In some cases, you might want to manually trigger activity:

```typescript
import { Component, inject } from '@angular/core';
import { UserActivityService } from '../services/user-activity.service';

@Component({
  selector: 'my-component',
  template: `
    <button (click)="triggerActivity()">Keep UI Visible</button>
  `
})
export class MyComponent {
  private userActivityService = inject(UserActivityService);
  
  triggerActivity(): void {
    this.userActivityService.triggerActivity();
  }
}
```

## Integration with Other Components

The User Activity system is designed to work seamlessly with other components in the application. Common use cases include:

- Hiding navigation controls during video playback
- Showing additional information when the user is actively engaging
- Creating a cleaner viewing experience by removing distractions

## Customization

The system provides several customization options:

- **Inactivity Timeout**: Currently set to 3 seconds, can be modified in the UserActivityService
- **Transition Duration**: Can be customized per element using the directive
- **CSS Classes**: The directive applies 'activity-visible' and 'activity-hidden' classes that can be styled 
