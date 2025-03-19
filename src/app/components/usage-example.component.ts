import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UserActivityVisibilityDirective } from '../directives/user-activity-visibility.directive';
import { UserActivityState } from '../states/user-activity.state';

@Component({
  selector: 'whytv-usage-example',
  standalone: true,
  imports: [CommonModule, UserActivityVisibilityDirective],
  template: `
    <div class="p-4">
      <!-- Example 1: Using the directive -->
      <div
        whytvActivityVisibility
        class="p-4 mb-4 bg-purple-800 rounded-lg">
        This element will fade out after 3 seconds of inactivity
      </div>

      <!-- Example 2: Using the directive with inverted behavior -->
      <div
        whytvActivityVisibility
        [invertBehavior]="true"
        class="p-4 mb-4 bg-pink-700 rounded-lg">
        This element will appear after 3 seconds of inactivity
      </div>

      <!-- Example 3: Using the state directly in the template -->
      <div class="p-4 bg-blue-800 rounded-lg"
        [class.opacity-100]="userActivityState.isActive()"
        [class.opacity-0]="!userActivityState.isActive()"
        style="transition: opacity 0.3s ease-in-out">
        User is currently {{ userActivityState.isActive() ? 'active' : 'inactive' }}
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsageExampleComponent {
  readonly userActivityState = inject(UserActivityState);
}
