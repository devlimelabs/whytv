import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { patchState } from '@ngrx/signals';
import { ToastModule } from 'primeng/toast';
import { CarouselModule } from 'primeng/carousel';

// Channel Picker removed in favor of side-actions button
import { GoogleYoutubePlayerComponent } from './components/google-youtube-player/google-youtube-player.component';
import { ChannelCarouselComponent } from './components/channel-carousel/channel-carousel.component';
import { ChannelRailComponent } from './components/channel-rail/channel-rail.component';
import { VideoCarouselComponent } from './components/video-carousel/video-carousel.component';
import { channelsStore } from './states/channels.state';
import { activeChannelStore } from './states/active-channel.state';
import { Channel, videoPlayerState } from './states/video-player.state';
import { ChannelService } from './services/channel/channel.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    CarouselModule,
    ToastModule,
    GoogleYoutubePlayerComponent,
    ChannelCarouselComponent,
    ChannelRailComponent,
    VideoCarouselComponent,
    DialogModule,
    ButtonModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  constructor(
    private messageService: MessageService,
    private channelService: ChannelService
  ) {
    // Update Video Player State when active video changes
    effect(() => {
      const activeVideo = this.activeChannelState.activeVideo();
      if (activeVideo) {
        patchState(this.playerState, { 
          video: activeVideo,
          progress: 0
        });
      }
    });
    
    // Update Video Player State when active channel changes
    effect(() => {
      const activeChannel = this.channelsState.currentChannel();
      if (activeChannel) {
        patchState(this.playerState, { 
          currentChannel: activeChannel
        });
      }
    });
  }

  // State stores
  readonly channelsState = inject(channelsStore);
  readonly activeChannelState = inject(activeChannelStore);
  readonly playerState = inject(videoPlayerState);

  // Local UI signals
  isPlaying = signal<boolean>(true);
  showControls = signal<boolean>(true);
  useNewPlayer = signal<boolean>(false);
  channelRailVisible = signal<boolean>(false); // New signal for channel rail visibility

  // Touch handling for swipe gestures
  touchStart = signal<{ x: number; y: number } | null>(null);
  touchEnd = signal<{ x: number; y: number } | null>(null);
  
  // Channel creation dialog
  createChannelVisible = signal(false);
  channelDescription = signal('');

  // Mock channels definition - used for fallback
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

  async ngOnInit(): Promise<void> {
    // Load channels from store, which will fetch from Firestore
    try {
      await this.channelsState.loadChannels();
      
      // If there are no channels, use mock data as fallback
      if (this.channelsState.channelCount() === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'No Channels',
          detail: 'No live channels found, using mock data',
          life: 3000
        });
        this.channelsState.setMockChannels(this.mockChannels);
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Channels Loaded',
          detail: `${this.channelsState.channelCount()} channels loaded`,
          life: 3000
        });
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
      this.channelsState.setMockChannels(this.mockChannels);
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

    const horizontalDistance = start.x - end.x;

    const channels = this.channelsState.channels();
    const currentChannel = this.channelsState.currentChannel();
    
    if (!currentChannel || channels.length === 0) return;

    // Horizontal swipe for channel switching only
    const isSwipeLeft = horizontalDistance > 50;
    const isSwipeRight = horizontalDistance < -50;

    const currentChannelIndex = channels.findIndex(c => c.id === currentChannel.id);

    if (isSwipeLeft && currentChannelIndex < channels.length - 1) {
      this.handleChannelSelect(channels[currentChannelIndex + 1]);
    }

    if (isSwipeRight && currentChannelIndex > 0) {
      this.handleChannelSelect(channels[currentChannelIndex - 1]);
    }

    this.touchStart.set(null);
    this.touchEnd.set(null);
  }

  handleChannelSelect(channel: Channel): void {
    this.channelsState.setCurrentChannel(channel);
    this.activeChannelState.resetForNewChannel();

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
    // Auto-advance to the next video using the store
    this.activeChannelState.nextVideo();
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
    this.activeChannelState.nextVideo();
    
    const currentVideo = this.activeChannelState.activeVideo();
    if (currentVideo) {
      this.messageService.add({
        severity: 'info',
        summary: 'Next Video',
        detail: `Now playing: ${currentVideo.title}`,
        life: 2000
      });
    }
  }

  handlePreviousVideo(): void {
    this.activeChannelState.previousVideo();
    
    const currentVideo = this.activeChannelState.activeVideo();
    if (currentVideo) {
      this.messageService.add({
        severity: 'info',
        summary: 'Previous Video',
        detail: `Now playing: ${currentVideo.title}`,
        life: 2000
      });
    }
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
  
  // Handle create channel button click from side-actions
  handleCreateChannel(): void {
    this.createChannelVisible.set(true);
  }
  
  // Create a new channel
  async createChannel(): Promise<void> {
    if (!this.channelDescription() || this.channelDescription().trim().length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a channel description',
        life: 3000
      });
      return;
    }
    
    await this.channelService.createChannel(this.channelDescription());
    this.createChannelVisible.set(false);
    this.channelDescription.set('');
  }
  
  // Cancel channel creation
  cancelCreateChannel(): void {
    this.createChannelVisible.set(false);
    this.channelDescription.set('');
  }
  
  // Select a channel from the channel rail
  selectChannel(channel: Channel): void {
    this.handleChannelSelect(channel);
  }
  
  // Toggle the channel rail visibility
  toggleChannelRail(): void {
    this.channelRailVisible.update(visible => !visible);
    
    // Notify user when channel rail is toggled
    this.messageService.add({
      severity: 'info',
      summary: this.channelRailVisible() ? 'Channels Shown' : 'Channels Hidden',
      detail: this.channelRailVisible() ? 'Channel rail is now visible' : 'Channel rail is now hidden',
      life: 1500
    });
  }
}
