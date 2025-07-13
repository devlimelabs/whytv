import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { UserActivityState } from '../states/user-activity.state';

/**
 * Initialization function for the UserActivityService
 * This is used as an app initializer to ensure the service is created
 * and starts tracking user activity as soon as the app starts
 */
export function initUserActivity(): Promise<boolean> {
  // Inject and initialize the service
  const service = inject(UserActivityService);

  // Return a resolved promise to indicate successful initialization
  return Promise.resolve(true);
}

@Injectable({
  providedIn: 'root'
})
export class UserActivityService {
  private readonly userActivityState = inject(UserActivityState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly resetSubject = new Subject<void>();

  // BehaviorSubject to emit activity state changes
  private readonly activitySubject = new BehaviorSubject<boolean>(true);

  // Public observable for components to subscribe to
  readonly activity$: Observable<boolean> = this.activitySubject.asObservable();

  // Inactivity timeout in milliseconds (3 seconds)
  private readonly INACTIVITY_TIMEOUT = 3000;

  constructor() {
    this.initInactivityTimer();
  }

  /**
   * Initialize the inactivity timer
   */
  private initInactivityTimer(): void {
    // Set up the inactivity timer
    this.resetSubject.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(() => timer(this.INACTIVITY_TIMEOUT).pipe(
        takeUntil(this.resetSubject)
      ))
    ).subscribe(() => {
      // When the timer completes without being reset, mark user as inactive
      this.setInactive();
    });
  }

  /**
   * Manually trigger user activity (called from app component on user interaction)
   */
  triggerActivity(): void {
    this.setActive();
    this.resetSubject.next();
  }

  /**
   * Set user as active
   */
  private setActive(): void {
    // Update the state
    this.userActivityState.updateLastActivityTime();

    // Emit the activity event
    this.activitySubject.next(true);
  }

  /**
   * Set user as inactive
   */
  private setInactive(): void {
    // Update the state
    this.userActivityState.setActive(false);

    // Emit the activity event
    this.activitySubject.next(false);
  }
}
