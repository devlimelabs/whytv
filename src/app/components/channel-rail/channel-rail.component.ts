import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Tv } from 'lucide-angular';
import { fromEvent } from 'rxjs';

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
  activeChannel = input.required<Channel>();
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
  }

  ngOnInit(): void {
     // Watch the manuallyToggled input and update isVisible accordingly
     effect(() => {
       if (this.manuallyToggled()) {
         this.isVisible.set(true);
       } else {
         // Reset to mouse position based visibility
         const threshold = window.innerHeight - 150;
         this.isVisible.set(this.mousePosition().y > threshold);
       }
     });
     
     // Handle mouse movement
     fromEvent<MouseEvent>(window, 'mousemove')
     .pipe(takeUntilDestroyed(this.destroyRef))
     .subscribe((e) => {
       this.mousePosition.set({ x: e.clientX, y: e.clientY });
       
       // Only automatically show/hide if not manually toggled externally
       if (!this.manuallyToggled()) {
         // Show rail when mouse is near bottom of screen
         const threshold = window.innerHeight - 150;
         this.isVisible.set(e.clientY > threshold);
       }
     });

     // Handle touch events
     fromEvent(window, 'touchstart')
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe(() => {
         // Only automatically show if not manually toggled externally
         if (!this.manuallyToggled()) {
           this.isVisible.set(true);
         }
       });

     fromEvent(window, 'touchend')
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe(() => {
         // Only automatically hide if not manually toggled externally
         if (!this.manuallyToggled()) {
           // Add delay before hiding on touch to allow for interaction
           setTimeout(() => this.isVisible.set(false), 3000);
         }
       });
    }
}
