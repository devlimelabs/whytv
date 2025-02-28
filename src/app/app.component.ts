import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { ChannelPickerComponent } from './components/channel-picker/channel-picker.component';
import { GoogleYoutubePlayerComponent } from './components/google-youtube-player/google-youtube-player.component';
import { FirestoreService } from './services/firestore.service';
import { Channel, videoPlayerState } from './states/video-player.state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ChannelPickerComponent,
    ToastModule,
    GoogleYoutubePlayerComponent
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
  private state = inject(videoPlayerState);

  // Mock channels for fallback
  private mockChannels: Channel[] = [
    {
      id: 'channel1',
      name: 'Music Videos',
      description: 'Popular music videos',
      videos: [
        {
          title: 'Rick Astley - Never Gonna Give You Up',
          description: 'Official music video for Rick Astley - Never Gonna Give You Up',
          channelTitle: 'Rick Astley',
          publishedAt: '2009-10-25T06:57:33Z',
          youtubeId: 'dQw4w9WgXcQ',
          deleted: false,
          order: 1,
          thumbnails: {
            default: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', width: 120, height: 90 },
            medium: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', width: 320, height: 180 },
            high: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', width: 480, height: 360 }
          },
          lastUpdated: { "__time__": new Date().toISOString() }
        },
        {
          title: 'a-ha - Take On Me (Official Video)',
          description: 'Official music video for a-ha - Take On Me',
          channelTitle: 'a-ha',
          publishedAt: '2010-02-17T08:32:51Z',
          youtubeId: 'djV11Xbc914',
          deleted: false,
          order: 2,
          thumbnails: {
            default: { url: 'https://img.youtube.com/vi/djV11Xbc914/default.jpg', width: 120, height: 90 },
            medium: { url: 'https://img.youtube.com/vi/djV11Xbc914/mqdefault.jpg', width: 320, height: 180 },
            high: { url: 'https://img.youtube.com/vi/djV11Xbc914/hqdefault.jpg', width: 480, height: 360 }
          },
          lastUpdated: { "__time__": new Date().toISOString() }
        }
      ]
    }
  ];

  // Signals for state management
  channels = signal<Channel[]>([]);
  currentChannel = signal<Channel>(this.mockChannels[0]); // Default to first mock channel until data loads
  currentVideoIndex = signal<number>(0);
  isPlaying = signal<boolean>(true);
  isLoading = signal<boolean>(true);
  showControls = signal<boolean>(true);

  // Toggle for new player
  useNewPlayer = signal<boolean>(false);

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
        this.channels.set(this.mockChannels);
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
      this.channels.set(this.mockChannels);
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

  /**
   * Toggle between old and new player implementations
   */
  togglePlayerImplementation(): void {
    this.useNewPlayer.set(!this.useNewPlayer());
    this.messageService.add({
      severity: 'info',
      summary: 'Player Switched',
      detail: `Now using ${this.useNewPlayer() ? 'new Google' : 'custom'} YouTube player`,
      life: 3000
    });
  }
}
