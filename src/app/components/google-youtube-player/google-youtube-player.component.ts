import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
  input,
  NgZone,
  output,
  signal,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { patchState } from '@ngrx/signals';
import { LucideAngularModule, Pause, Play, Volume2, VolumeX } from 'lucide-angular';

import { videoPlayerState } from '../../states/video-player.state';
import { SideActionsComponent } from '../side-actions/side-actions.component';
import { VideoCarouselComponent } from '../video-carousel/video-carousel.component';

/**
 * Google YouTube Player component that uses the official Angular YouTube Player
 * This implementation provides feature parity with our custom player while leveraging
 * the official component's features and optimizations
 */
@Component({
  selector: 'app-google-youtube-player',
  templateUrl: './google-youtube-player.component.html',
  styleUrls: ['./google-youtube-player.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    YouTubePlayer,
    SideActionsComponent,
    VideoCarouselComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Add encapsulation: ViewEncapsulation.None to allow styles to affect iframe
  encapsulation: ViewEncapsulation.None,
  // Add styles directly to ensure YouTube iframe is visible
  styles: [`
    youtube-player {
      display: block !important;
      position: absolute !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 10 !important;
    }

    youtube-player iframe {
      display: block !important;
      position: absolute !important;
      width: 100% !important;
      height: 100% !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 10 !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* Hide YouTube related videos suggestions at all costs */
    .ytp-pause-overlay,
    .ytp-related-videos-card,
    .ytp-endscreen-content {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `]
})
export class GoogleYoutubePlayerComponent implements AfterViewInit {
onApiChange($event: YT.PlayerEvent) {
throw new Error('Method not implemented.');
}

  readonly state = inject(videoPlayerState);

  // Reference to the YouTube Player component
  @ViewChild('youtubePlayer') youtubePlayer!: YouTubePlayer;

  // Inputs
  videoId = input.required<string>();
  height = input<number>(window.innerHeight);
  width = input<number>(window.innerWidth);

  // Window dimensions as signals for internal use
  protected windowHeight = signal<number>(window.innerHeight);
  protected windowWidth = signal<number>(window.innerWidth);

  // Listen for window resize to adjust player dimensions
  @HostListener('window:resize')
  onResize() {
    this.windowHeight.set(window.innerHeight);
    this.windowWidth.set(window.innerWidth);
  }

  /**
   * Show play/pause button when needed on mouse move or touch
   * Note: Overall UI visibility is now handled by videoPlayerState
   */
  @HostListener('window:mousemove')
  @HostListener('window:touchstart')
  onUserInteraction() {
    if (this.playerReady() && !this.state.playing()) {
      this.showPlayPauseButton.set(true);
    }
  }

  // Outputs
  videoEnded = output<void>();
  videoError = output<string>();
  nextVideo = output<void>();
  previousVideo = output<void>();
  controlsVisibilityChange = output<boolean>();
  handleCreateChannel = output<MouseEvent>();
  toggleChannelRail = output<void>();

  // Signals
  showControls = signal(true);
  showPlayPauseButton = signal(true);
  isLoading = signal(true);
  error = signal<string | null>(null);
  playerReady = signal(false);
  progress = signal(0);
  // Default carousel to hidden and animate it in from the edge
  carouselVisible = signal(false);

  // Player internal state
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
  private isUserInteracting = false;
  private mouseMovementTimer: ReturnType<typeof setTimeout> | null = null;
  private isMouseMoving = false;

  // Icons
  protected readonly Play = Play;
  protected readonly Pause = Pause;
  protected readonly VolumeX = VolumeX;
  protected readonly Volume2 = Volume2;

  // Browser window reference for responsive sizing
  protected readonly window = window;

  // Timer to detect mouse stop
  private mouseStopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private ngZone: NgZone) {
    // Watch for changes to videoId
    effect(() => {
      const id = this.videoId();
      if (id && this.playerReady() && this.youtubePlayer) {
        // The YouTube Player component handles videoId changes automatically
        // We just need to update our internal state
        patchState(this.state, {
          progress: 0,
          loading: true
        });

        // Show loading indicator when changing videos
        this.isLoading.set(true);

        // Reset mute state when changing videos
        if (this.state.muted()) {
          this.youtubePlayer.mute();
        } else {
          this.youtubePlayer.unMute();
        }

        // Force play the video to ensure autoplay works when video changes
        setTimeout(() => {
          try {
            console.log('Effect: attempting to play video with ID:', id);
            this.youtubePlayer.playVideo();
          } catch (error) {
            console.error('Error in videoId effect when playing video:', error);
          }
        }, 500);
      }
    });

    // Watch for UI visibility changes from videoPlayerState
    effect(() => {
      // When UI elements should be hidden
      if (this.state.hideUIOverlays()) {
        // Hide carousel and play button
        this.carouselVisible.set(false);
        this.showPlayPauseButton.set(false);
      }

      // Mirror the showControls state
      this.showControls.set(this.state.showControls());
    });
  }

  // This method is no longer needed as the inactivity service handles mouse detection

  handleComment(): void {

  }

  handleShare(): void {

  }

  handleNextVideo(): void {
    this.nextVideo.emit();
  }

  handlePreviousVideo(): void {
    this.previousVideo.emit();
  }

  toggleVideoCarousel(): void {
    // Toggle the carousel visibility
    this.carouselVisible.update(value => !value);

    // Reset the hide controls timer when carousel is toggled
    if (this.carouselVisible()) {
      this.resetHideControlsTimer();
    }
  }

  handleToggleChannelRail(): void {
    this.toggleChannelRail.emit();
  }

  ngAfterViewInit(): void {
    // Player is initialized in the view
    console.log('Google YouTube Player initialized');
    console.log('Current videoId:', this.videoId());

    // Set a timeout to clear loading state if it hasn't been cleared already
    // This is a safety mechanism in case other events don't fire properly
    setTimeout(() => {
      if (this.isLoading()) {
        console.log('Force clearing loading state after timeout');
        this.isLoading.set(false);
        patchState(this.state, {
          loading: false
        });
      }
    }, 5000);

    // Debug: Check if the iframe exists in the DOM
    setTimeout(() => {
      const iframe = document.querySelector('youtube-player iframe');
      console.log('YouTube iframe found in DOM:', !!iframe);
      if (iframe) {
        console.log('iframe dimensions:', {
          width: iframe.clientWidth,
          height: iframe.clientHeight,
          style: iframe.getAttribute('style')
        });

        // Force iframe to be visible if it exists
        const iframeElement = iframe as HTMLElement;
        iframeElement.style.display = 'block';
        iframeElement.style.visibility = 'visible';
        iframeElement.style.opacity = '1';
        iframeElement.style.zIndex = '10';
        iframeElement.style.position = 'absolute';
        iframeElement.style.top = '0';
        iframeElement.style.left = '0';
        iframeElement.style.width = '100%';
        iframeElement.style.height = '100%';
      }
    }, 2000);

    // The YouTube Player component handles API loading automatically

    // Attempt to force play even if not ready yet - belt and suspenders approach
    setTimeout(() => {
      if (this.youtubePlayer) {
        try {
          console.log('ngAfterViewInit: Attempting to play video');
          this.youtubePlayer.playVideo();
          if (this.state.muted()) {
            this.youtubePlayer.mute();
          }
        } catch (error) {
          console.error('Error in ngAfterViewInit when playing video:', error);
        }
      }
    }, 1000);

    // If player is already ready but not playing, force play
    if (this.playerReady() && !this.state.playing()) {
      setTimeout(() => {
        try {
          console.log('Player ready but not playing: force play');
          this.youtubePlayer.playVideo();
        } catch (error) {
          console.error('Error when forcing play on ready player:', error);
        }
      }, 500);
    }
  }

  /**
   * Handle player ready event
   * @param event The YouTube player event
   */
  onPlayerReady(event: YT.PlayerEvent): void {
    console.log('Player ready', event);
    this.playerReady.set(true);
    this.isLoading.set(false);

    patchState(this.state, {
      loading: false
    });

    // Hide play button initially since we're autoplaying
    this.showPlayPauseButton.set(false);

    // Ensure video is muted to comply with autoplay policies
    this.muteVideo();

    // Force play the video to ensure autoplay works
    setTimeout(() => {
      try {
        this.youtubePlayer.playVideo();
        console.log('Attempting to play video');
        // Start tracking progress after playback begins
        this.startProgressTracking();
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }, 500);
  }

  /**
   * Handle player state changes
   * @param event The YouTube player state change event
   */
  onStateChange(event: YT.OnStateChangeEvent): void {
    const stateNames = {
      '-1': 'UNSTARTED',
      '0': 'ENDED',
      '1': 'PLAYING',
      '2': 'PAUSED',
      '3': 'BUFFERING',
      '5': 'CUED'
    };
    console.log(`Player state changed to ${stateNames[event.data] || event.data}`);

    switch (event.data) {
      case YT.PlayerState.PLAYING:
        console.log('Video is now playing');
        this.videoPlaying();
        // Immediately hide the play/pause button with fade out animation
        this.showPlayPauseButton.set(false);
        // Make sure loading spinner is hidden when playing starts
        this.isLoading.set(false);
        patchState(this.state, {
          loading: false
        });
        break;

      case YT.PlayerState.PAUSED:
        console.log('Video is now paused');
        this.videoPaused();
        break;

      case YT.PlayerState.ENDED:
        console.log('Video has ended');
        this.videoEnded.emit();
        this.stopProgressTracking();
        break;

      case YT.PlayerState.BUFFERING:
        console.log('Video is buffering');
        this.isLoading.set(true);
        patchState(this.state, {
          loading: true
        });
        break;

      case YT.PlayerState.CUED:
        console.log('Video is cued and ready to play');
        this.isLoading.set(false);
        patchState(this.state, {
          loading: false
        });
        // Try to play when video is cued
        setTimeout(() => {
          try {
            console.log('Attempting to play after cued state');
            this.youtubePlayer.playVideo();
          } catch (error) {
            console.error('Error playing after cued state:', error);
          }
        }, 300);
        break;

      case YT.PlayerState.UNSTARTED:
        console.log('Video is unstarted - attempting to play');
        setTimeout(() => {
          try {
            this.youtubePlayer.playVideo();
          } catch (error) {
            console.error('Error playing from unstarted state:', error);
          }
        }, 300);
        break;
    }
  }

  /**
   * Handle player errors
   * @param event The YouTube player error event
   */
  onError(event: YT.OnErrorEvent): void {
    console.error('Player error', event);
    let errorMessage = 'An error occurred with the YouTube player';

    // Use the correct PlayerError type from the official API
    switch (event.data) {
      case 2:
        errorMessage = 'Invalid video ID or parameter';
        break;
      case 5:
        errorMessage = 'HTML5 player error';
        break;
      case 100:
        errorMessage = 'Video not found (removed or private)';
        break;
      case 101:
      case 150:
        errorMessage = 'Video owner does not allow embedding';
        break;
    }

    this.error.set(errorMessage);
    patchState(this.state, {
      error: errorMessage
    });
    this.videoError.emit(errorMessage);
  }

  /**
   * Play the video - direct player action
   */
  playVideo(): void {
    try {
      console.log('Play video method called');
      this.youtubePlayer.playVideo();
      // State is updated via onStateChange event
    } catch (error) {
      console.error('Error in playVideo method:', error);
    }
  }

  /**
   * Pause the video - direct player action
   */
  pauseVideo(): void {
    this.youtubePlayer.pauseVideo();
    // State is updated via onStateChange event
  }

  /**
   * Toggle play/pause state - direct player action
   */
  togglePlayPause(): void {
    if (this.state.playing()) {
      this.pauseVideo();
    } else {
      this.playVideo();
    }
    // State is updated via onStateChange event
  }

  /**
   * Unmute the video - direct player action
   */
  unmuteVideo(): void {
    this.youtubePlayer.unMute();
    this.videoUnmuted();
  }

  /**
   * Mute the video - direct player action
   */
  muteVideo(): void {
    this.youtubePlayer.mute();
    this.videoMuted();
  }

  /**
   * Toggle mute state - direct player action
   */
  toggleMute(): void {
    if (!this.playerReady()) return;

    if (this.state.muted()) {
      this.unmuteVideo();
    } else {
      this.muteVideo();
    }
  }

  /**
   * Go to the next video - emits event for parent to handle
   */
  goToNextVideo(): void {
    this.nextVideo.emit();
  }

  /**
   * Go to the previous video - emits event for parent to handle
   */
  goToPreviousVideo(): void {
    this.previousVideo.emit();
  }

  /**
   * Toggle like status for the current video
   */
  toggleLike(): void {
    const newLikedState = !this.state.liked();

    // Update global state
    patchState(this.state, {
      liked: newLikedState
    });
  }

  /**
   * Start tracking video progress
   */
  private startProgressTracking(): void {
    this.stopProgressTracking();

    this.progressInterval = setInterval(() => {
      if (this.playerReady() && this.youtubePlayer) {
        const currentTime = this.youtubePlayer.getCurrentTime();
        const duration = this.youtubePlayer.getDuration();

        if (duration > 0) {
          const progressPercent = (currentTime / duration) * 100;

          // Update global state with progress
          patchState(this.state, {
            progress: progressPercent
          });
        }
      }
    }, 1000);
  }

  /**
   * Stop tracking video progress
   */
  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Seek to a specific position in the video - direct player action
   * @param event The click event on the progress bar
   */
  seekToPosition(event: MouseEvent): void {
    if (!this.playerReady()) return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;

    const seekTime = (percentage / 100) * this.youtubePlayer.getDuration();
    this.youtubePlayer.seekTo(seekTime, true);

    // Update progress immediately for better UX
    this.progress.set(percentage);

    // State will be further updated via progress tracking
  }

  /**
   * Show video controls and all UI overlays
   * User activity is now handled by videoPlayerState
   */
  showVideoControls(): void {
    this.isUserInteracting = true;
    this.showControls.set(true);

    // Only show play/pause button if video is paused
    // This prevents pause button from showing when video is playing
    if (!this.state.playing()) {
      this.showPlayPauseButton.set(true);
    }

    // Update the global state to show UI components
    patchState(this.state, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });

    // Notify parent component
    this.controlsVisibilityChange.emit(true);
  }

  /**
   * Make sure UI elements are visible
   * This is mainly for component-specific elements
   */
  resetHideControlsTimer(): void {
    // Show play button when needed
    if (!this.state.playing()) {
      this.showPlayPauseButton.set(true);
    }

    // Update the global state to show UI components
    patchState(this.state, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });

    // Notify parent about visibility change
    this.controlsVisibilityChange.emit(true);
  }

  /**
   * Set user interaction state when mouse enters the component
   */
  onMouseEnter(): void {
    this.isUserInteracting = true;

    // Update the global state to show UI components
    patchState(this.state, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });

    this.showVideoControls();
  }

  /**
   * Set user interaction state when mouse leaves the component
   */
  onMouseLeave(): void {
    this.isUserInteracting = false;
    if (this.state.playing()) {
      this.resetHideControlsTimer();
    }
  }

  /**
   * Handle tap/click on the player area
   * @param event The mouse event
   */
  handleTap(event: MouseEvent): void {
    // Only process if the tap/click is not on a button
    if (!(event.target as HTMLElement).closest('button')) {
      console.log('Tap detected on player area');

      // Top priority: Check if video is muted and playing - unmute it
      if (this.state.muted() && this.state.playing() && this.playerReady()) {
        console.log('Video is muted and playing - unmuting');
        this.toggleMute();

        // Update the global state to show UI components
        patchState(this.state, {
          userIsActive: true,
          showControls: true,
          hideUIOverlays: false
        });

        return;
      }

      // Update the global state to show UI components
      patchState(this.state, {
        userIsActive: true,
        showControls: true,
        hideUIOverlays: false
      });

      // Only show play/pause button if video is paused
      if (!this.state.playing()) {
        this.showPlayPauseButton.set(true);
      }

      // Toggle play/pause when tapping the video area
      if (this.playerReady()) {
        this.togglePlayPause();
      }
    }
  }

  /**
   * Update video when videoId changes
   * This is handled automatically by the component when the input changes
   */
  updateVideo(): void {
    if (this.playerReady()) {
      // The YouTube Player component handles videoId changes automatically
      // Update global state
      patchState(this.state, {
        progress: 0
      });

      // Ensure video is muted to comply with autoplay policies
      this.muteVideo();

      // Force play the video to ensure autoplay works
      setTimeout(() => {
        this.playVideo();
      }, 0);
    }
  }

  /**
   * Handle video muted event
   */
  videoMuted(): void {
    patchState(this.state, {
      muted: true,
    });
  }

  /**
   * Handle video unmuted event
   */
  videoUnmuted(): void {
    patchState(this.state, {
      muted: false,
    });
  }

  /**
   * Handle video paused event
   */
  private videoPaused(): void {
    patchState(this.state, {
      playing: false,
      paused: true,
    });
    this.stopProgressTracking();
  }

  /**
   * Handle video playing event
   */
  private videoPlaying(): void {
    patchState(this.state, {
      playing: true,
      paused: false,
      loading: false
    });
    // Make sure loading spinner is hidden
    this.isLoading.set(false);
    this.startProgressTracking();
  }
}


