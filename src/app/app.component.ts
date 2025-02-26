import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ChannelPickerComponent } from './components/channel-picker/channel-picker.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { YoutubePlayerComponent } from './components/youtube-player/youtube-player.component';
import { Channel, mockChannels } from './shared/types/video.types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    VideoPlayerComponent,
    ChannelPickerComponent,
    ToastModule,
    YoutubePlayerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class AppComponent {
  constructor(private messageService: MessageService) {}

  // Signals for state management
  currentChannel = signal<Channel>(mockChannels[0]);
  currentVideoIndex = signal<number>(0);
  isPlaying = signal<boolean>(false);

  // Touch handling for swipe gestures
  touchStart = signal<{ x: number; y: number } | null>(null);
  touchEnd = signal<{ x: number; y: number } | null>(null);

  @HostListener('touchstart', ['$event'])
  handleTouchStart(e: TouchEvent): void {
    this.touchStart.set({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }

  @HostListener('touchmove', ['$event'])
  handleTouchMove(e: TouchEvent): void {
    this.touchEnd.set({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }

  @HostListener('touchend')
  handleTouchEnd(): void {
    const start = this.touchStart();
    const end = this.touchEnd();

    if (!start || !end) return;

    const verticalDistance = start.y - end.y;
    const horizontalDistance = start.x - end.x;

    // Determine if the swipe is primarily horizontal or vertical
    const isHorizontalSwipe = Math.abs(horizontalDistance) > Math.abs(verticalDistance);

    if (isHorizontalSwipe) {
      // Horizontal swipe for channel switching
      const isSwipeLeft = horizontalDistance > 50;
      const isSwipeRight = horizontalDistance < -50;

      const currentChannelIndex = mockChannels.findIndex(c => c.id === this.currentChannel().id);

      if (isSwipeLeft && currentChannelIndex < mockChannels.length - 1) {
        this.handleChannelSelect(mockChannels[currentChannelIndex + 1]);
      }

      if (isSwipeRight && currentChannelIndex > 0) {
        this.handleChannelSelect(mockChannels[currentChannelIndex - 1]);
      }
    } else {
      // Vertical swipe for video navigation within channel
      const isSwipeUp = verticalDistance > 50;
      const isSwipeDown = verticalDistance < -50;

      if (isSwipeUp && this.currentVideoIndex() < this.currentChannel().videos.length - 1) {
        this.currentVideoIndex.update(prev => prev + 1);
      }

      if (isSwipeDown && this.currentVideoIndex() > 0) {
        this.currentVideoIndex.update(prev => prev - 1);
      }
    }

    this.touchStart.set(null);
    this.touchEnd.set(null);
  }

  handleChannelSelect(channel: Channel): void {
    this.currentChannel.set(channel);
    this.currentVideoIndex.set(0);
  }

  togglePlayPause(): void {
    this.isPlaying.update(value => !value);
  }

  handleVideoEnded(): void {
    // Auto-advance to the next video
    const nextIndex = (this.currentVideoIndex() + 1) % this.currentChannel().videos.length;
    this.currentVideoIndex.set(nextIndex);
  }

  handleVideoError(error: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Video Error',
      detail: error,
      life: 5000
    });
  }

  protected readonly mockChannels = mockChannels;
}
