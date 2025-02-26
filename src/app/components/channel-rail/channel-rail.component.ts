import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Tv } from 'lucide-angular';
import { fromEvent } from 'rxjs';

import { Channel } from '../../shared/types/video.types';

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
  // Inputs
  channels = input.required<Channel[]>();
  activeChannel = input.required<Channel>();

  // Outputs
  channelSelect = output<Channel>();

  // Signals
  isVisible = signal(false);
  mousePosition = signal({ x: 0, y: 0 });

  // Icons
  protected readonly Tv = Tv;

  ngOnInit(): void {
     // Handle mouse movement
     fromEvent<MouseEvent>(window, 'mousemove')
     .pipe(takeUntilDestroyed(this.destroyRef))
     .subscribe((e) => {
       this.mousePosition.set({ x: e.clientX, y: e.clientY });
       // Show rail when mouse is near bottom of screen
       const threshold = window.innerHeight - 150;
       this.isVisible.set(e.clientY > threshold);
     });

   // Handle touch events
   fromEvent(window, 'touchstart')
     .pipe(takeUntilDestroyed(this.destroyRef))
     .subscribe(() => {
       this.isVisible.set(true);
     });

   fromEvent(window, 'touchend')
     .pipe(takeUntilDestroyed(this.destroyRef))
     .subscribe(() => {
       // Add delay before hiding on touch to allow for interaction
       setTimeout(() => this.isVisible.set(false), 3000);
     });
    }
}
