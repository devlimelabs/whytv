import { NgModule } from '@angular/core';

import { UserActivityVisibilityDirective } from './directives/user-activity-visibility.directive';
import { UserActivityService } from './services/user-activity.service';
import { UserActivityState } from './states/user-activity.state';

@NgModule({
  imports: [
    UserActivityVisibilityDirective
  ],
  exports: [
    UserActivityVisibilityDirective
  ],
  providers: [
    UserActivityService,
    UserActivityState
  ]
})
export class UserActivityModule {
  // This constructor ensures the UserActivityService is instantiated
  // when the module is loaded, which starts the activity tracking
  constructor(private userActivityService: UserActivityService) {}
}
