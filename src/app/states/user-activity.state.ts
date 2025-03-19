import { Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';

interface UserActivityStateModel {
  isActive: boolean;
  lastActivityTime: number;
}

const initialState: UserActivityStateModel = {
  isActive: true,
  lastActivityTime: Date.now()
};

@Injectable({
  providedIn: 'root'
})
export class UserActivityState {
  // Create the state store with initial values
  private state = signalState<UserActivityStateModel>(initialState);

  // Expose readonly signals for components to consume
  readonly isActive = this.state.isActive;
  readonly lastActivityTime = this.state.lastActivityTime;

  // Method to update user activity status
  setActive(isActive: boolean): void {
    console.log('Setting active state:', isActive); // Debug log
    patchState(this.state, {
      isActive,
      lastActivityTime: isActive ? Date.now() : this.state.lastActivityTime()
    });
    console.log('State after update:', this.state()); // Debug log
  }

  // Method to update last activity time
  updateLastActivityTime(): void {
    console.log('Updating last activity time'); // Debug log
    patchState(this.state, {
      isActive: true,
      lastActivityTime: Date.now()
    });
    console.log('State after update:', this.state()); // Debug log
  }
}
