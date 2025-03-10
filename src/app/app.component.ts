import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { AI_MODELS, AI_PROVIDERS } from './constants/provider-models.const';
import { ChannelService } from './services/channel/channel.service';
import { VideoPlayerService } from './services/video-player.service';
import { ChannelsState } from './states/channels.state';
import { Channel, videoPlayerState } from './states/video-player.state';

// Channel Picker removed in favor of side-actions button
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    CarouselModule,
    ToastModule,
    DialogModule,
    ButtonModule,
    FormsModule,
    SelectModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  private messageSvc = inject(MessageService);
  private channelSvc = inject(ChannelService);

  // State stores
  readonly channelsState = inject(ChannelsState);
  readonly playerState = inject(videoPlayerState);
  readonly videoPlayerSvc = inject(VideoPlayerService);
  constructor() {
   effect(() => {
      try {
        localStorage.setItem('whytv_provider', this.selectedProvider());
        localStorage.setItem('whytv_model', this.selectedModel());
      } catch (error) {
        console.error('Error saving model preferences to localStorage:', error);
      }
    });
  }

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
  channelDescription = model('');

  // AI Provider and Model settings
  providerOptions = AI_PROVIDERS;

  // Available models by provider
  modelOptions = AI_MODELS;

  selectedProvider = model('openai'); // Default provider
  selectedModel = model('gpt-4o'); // Default model
  currentModelOptions = computed(() =>
    this.modelOptions[this.selectedProvider() as keyof typeof this.modelOptions]);

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
      await this.channelSvc.loadChannels();

      // If there are no channels, use mock data as fallback
      if (this.channelsState.channelCount() === 0) {
        this.messageSvc.add({
          severity: 'warn',
          summary: 'No Channels',
          detail: 'No live channels found, using mock data',
          life: 3000
        });
        this.channelsState.setMockChannels(this.mockChannels);
      } else {
        this.messageSvc.add({
          severity: 'success',
          summary: 'Channels Loaded',
          detail: `${this.channelsState.channelCount()} channels loaded`,
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      this.messageSvc.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load channels. Using mock data instead.',
        life: 5000
      });

      // Use mock data on error
      this.channelsState.setMockChannels(this.mockChannels);
    }

    // Load saved provider and model preferences from localStorage
    this.loadSavedModelPreferences();
  }


  // Load saved model preferences from localStorage
  loadSavedModelPreferences(): void {
    try {
      const savedProvider = localStorage.getItem('whytv_provider');
      const savedModel = localStorage.getItem('whytv_model');

      if (savedProvider) {
        this.selectedProvider.set(savedProvider);
      }

      if (savedModel) {
        // Check if the saved model is valid for the current provider
        const modelExists = this.currentModelOptions().some(model => model.value === savedModel);
        if (modelExists) {
          this.selectedModel.set(savedModel);
        } else {
          // Reset to first model in the list if saved model is not valid
          this.selectedModel.set(this.currentModelOptions()[0].value);
        }
      }
    } catch (error) {
      console.error('Error loading model preferences from localStorage:', error);
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
    this.channelSvc.setCurrentChannel(channel);

    // Show toast when channel changes
    this.messageSvc.add({
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
    this.channelSvc.nextVideo();
  }

  handleVideoError(error: string): void {
    this.messageSvc.add({
      severity: 'error',
      summary: 'Video Error',
      detail: error,
      life: 5000,
      styleClass: 'error-toast z-[9999]'
    });
  }


  handlePreviousVideo(): void {
    this.channelSvc.previousVideo();

    const currentVideo = this.channelsState.currentChannel()?.videos[this.channelsState.currentVideoIndex()];
    if (currentVideo) {
      this.messageSvc.add({
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


  // Handle create channel button click from side-actions
  handleCreateChannel(): void {
    this.createChannelVisible.set(true);
  }

  // Create a new channel
  async createChannel(): Promise<void> {
    if (!this.channelDescription() || this.channelDescription().trim().length === 0) {
      this.messageSvc.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a channel description',
        life: 3000
      });
      return;
    }

    // Create channel with selected provider and model
    await this.channelSvc.createChannel(
      this.channelDescription(),
      this.selectedProvider(),
      this.selectedModel()
    );

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
  }
}
