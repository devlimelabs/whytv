import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Tv } from 'lucide-angular';
import { fromEvent } from 'rxjs';
import { patchState } from '@ngrx/signals';

import { Channel, videoPlayerState } from '../../states/video-player.state';

@Component({
  selector: 'app-channel-rail',
  templateUrl: './channel-rail.component.html',
  styleUrls: ['./channel-rail.component.css'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelRailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  // State
  readonly playerState = inject(videoPlayerState);
  
  // Inputs
  channels = input.required<Channel[]>();
  activeChannel = input.required<Channel | null>();
  manuallyToggled = input<boolean>(false); // Input for external control

  // Outputs
  channelSelect = output<Channel>();

  // Signals
  isVisible = signal(false);
  mousePosition = signal({ x: 0, y: 0 });

  // Icons
  protected readonly Tv = Tv;
  
  // Method to toggle visibility of the rail
  toggleVisibility(): void {
    this.isVisible.update(visible => !visible);
    
    // Update user activity state
    patchState(this.playerState, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });
  }

  ngOnInit(): void {
     // Watch the manuallyToggled input and user activity state to coordinate visibility
     effect(() => {
       if (this.manuallyToggled()) {
         // Manual toggle takes precedence
         this.isVisible.set(true);
       } else if (this.playerState.hideUIOverlays()) {
         // Hide when UI overlays are hidden through inactivity
         this.isVisible.set(false);
       } else {
         // When active, check mouse position for channel rail display
         const threshold = window.innerHeight - 150;
         this.isVisible.set(this.mousePosition().y > threshold);
       }
     });
     
     // Track mouse position for channel rail hover detection
     fromEvent<MouseEvent>(window, 'mousemove')
     .pipe(takeUntilDestroyed(this.destroyRef))
     .subscribe((e) => {
       this.mousePosition.set({ x: e.clientX, y: e.clientY });
       
       // When user is active and rail isn't manually toggled
       if (!this.manuallyToggled() && this.playerState.userIsActive()) {
         // Show rail when mouse is near bottom of screen
         const threshold = window.innerHeight - 150;
         if (e.clientY > threshold) {
           this.isVisible.set(true);
           
           // Update user activity state
           patchState(this.playerState, {
             userIsActive: true,
             showControls: true,
             hideUIOverlays: false
           });
         } else {
           this.isVisible.set(false);
         }
       }
     });
    }
}
