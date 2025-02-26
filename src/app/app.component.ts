import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit, effect, inject, signal } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ChannelPickerComponent } from './components/channel-picker/channel-picker.component';
import { YoutubePlayerComponent } from './components/youtube-player/youtube-player.component';
import { Channel, mockChannels } from './shared/types/video.types';
import { FirestoreService } from './services/firestore.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ChannelPickerComponent,
    ToastModule,
    YoutubePlayerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  constructor(
    private messageService: MessageService
  ) {
    // Debug effect to log isLoading changes
    effect(() => {
      console.log('isLoading changed:', this.isLoading());
    });
  }

  // Inject the FirestoreService
  private firestoreService = inject(FirestoreService);

  // Signals for state management
  channels = signal<Channel[]>([]);
  currentChannel = signal<Channel>(mockChannels[0]); // Default to first mock channel until data loads
  currentVideoIndex = signal<number>(0);
  isPlaying = signal<boolean>(true);
  isLoading = signal<boolean>(true);
  showControls = signal<boolean>(true);

  // Touch handling for swipe gestures
  touchStart = signal<{ x: number; y: number } | null>(null);
  touchEnd = signal<{ x: number; y: number } | null>(null);

  async ngOnInit(): Promise<void> {
    // Load channels from Firestore
    try {
      const channels = await this.firestoreService.getChannels();

      if (channels.length > 0) {
        this.channels.set(channels);
        this.currentChannel.set(channels[0]);
        this.isLoading.set(false);

        this.messageService.add({
          severity: 'success',
          summary: 'Channels Loaded',
          detail: `${channels.length} channels loaded`,
          life: 3000
        });
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'No Channels',
          detail: 'No live channels found',
          life: 3000
        });
        // Keep using mock data if no channels found
        this.channels.set(mockChannels);
        this.isLoading.set(false);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load channels. Using mock data instead.',
        life: 5000
      });
      // Use mock data on error
      this.channels.set(mockChannels);
      this.isLoading.set(false);
    }
  }

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

      const currentChannelIndex = this.channels().findIndex(c => c.id === this.currentChannel().id);

      if (isSwipeLeft && currentChannelIndex < this.channels().length - 1) {
        this.handleChannelSelect(this.channels()[currentChannelIndex + 1]);
      }

      if (isSwipeRight && currentChannelIndex > 0) {
        this.handleChannelSelect(this.channels()[currentChannelIndex - 1]);
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

    // Show toast when channel changes
    this.messageService.add({
      severity: 'success',
      summary: 'Channel Changed',
      detail: `Now watching: ${channel.name}`,
      life: 3000
    });
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
      life: 5000,
      styleClass: 'error-toast z-[9999]'
    });
  }

  handleNextVideo(): void {
    const nextIndex = (this.currentVideoIndex() + 1) % this.currentChannel().videos.length;
    this.currentVideoIndex.set(nextIndex);

    this.messageService.add({
      severity: 'info',
      summary: 'Next Video',
      detail: `Now playing: ${this.currentChannel().videos[nextIndex].title}`,
      life: 2000
    });
  }

  handlePreviousVideo(): void {
    const prevIndex = this.currentVideoIndex() === 0
      ? this.currentChannel().videos.length - 1
      : this.currentVideoIndex() - 1;
    this.currentVideoIndex.set(prevIndex);

    this.messageService.add({
      severity: 'info',
      summary: 'Previous Video',
      detail: `Now playing: ${this.currentChannel().videos[prevIndex].title}`,
      life: 2000
    });
  }

  // Handle controls visibility change from the YouTube player
  handleControlsVisibilityChange(isVisible: boolean): void {
    this.showControls.set(isVisible);
  }
}
