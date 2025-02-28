import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { patchState } from '@ngrx/signals';
import { LucideAngularModule, Pause, Play, Volume2, VolumeX } from 'lucide-angular';

import { Video, videoPlayerState } from '../../states/video-player.state';
import { SideActionsComponent } from '../side-actions/side-actions.component';

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
    LucideAngularModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleYoutubePlayerComponent implements AfterViewInit {

  readonly state = inject(videoPlayerState);

  // Reference to the YouTube Player component
  @ViewChild('youtubePlayer') youtubePlayer!: YouTubePlayer;

  // Inputs
  videoId = input.required<string>();
  height = input<number>(360);
  width = input<number>(640);
  video = input.required<Video>();
  isPlaying = input<boolean>(false);

  // Outputs
  playPause = output<void>();
  videoEnded = output<void>();
  videoError = output<string>();
  nextVideo = output<void>();
  previousVideo = output<void>();
  controlsVisibilityChange = output<boolean>();

  // Signals
  showControls = signal(true);
  showPlayPauseButton = signal(true);
  progress = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);
  playerReady = signal(false);
  isMuted = signal(false);
  liked = signal(false);

  // Player internal state
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
  private isUserInteracting = false;

  // Icons
  protected readonly Play = Play;
  protected readonly Pause = Pause;
  protected readonly VolumeX = VolumeX;
  protected readonly Volume2 = Volume2;

  constructor() {
    // Watch for changes to videoId
    effect(() => {
      const id = this.videoId();
      if (id && this.playerReady() && this.youtubePlayer) {
        // The YouTube Player component handles videoId changes automatically
        // We just need to update our internal state
        this.progress.set(0);

        // Reset mute state when changing videos
        if (this.isMuted()) {
          this.youtubePlayer.mute();
        } else {
          this.youtubePlayer.unMute();
        }

        // Force play the video to ensure autoplay works when video changes
        setTimeout(() => {
          this.playVideo();
        }, 0);
      }
    });
  }

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

  ngAfterViewInit(): void {
    // Player is initialized in the view
    console.log('Google YouTube Player initialized');

    // The YouTube Player component handles API loading automatically

    // If player is already ready but not playing, force play
    if (this.playerReady() && !this.state.playing()) {
      setTimeout(() => {
        this.playVideo();
      }, 0);
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

    // Ensure video is muted to comply with autoplay policies
    this.muteVideo();

    // Force play the video to ensure autoplay works
    setTimeout(() => {
      this.playVideo();
      // Start tracking progress after playback begins
      this.startProgressTracking();
    }, 0);
  }

  /**
   * Handle player state changes
   * @param event The YouTube player state change event
   */
  onStateChange(event: YT.OnStateChangeEvent): void {
    console.log('Player state changed', event.data);

    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.videoPlaying();
        break;

      case YT.PlayerState.PAUSED:
        this.videoPaused();
        break;

      case YT.PlayerState.ENDED:
        this.videoEnded.emit();
        this.stopProgressTracking();
        break;

      case YT.PlayerState.BUFFERING:
        this.isLoading.set(true);
        break;

      case YT.PlayerState.CUED:
        this.isLoading.set(false);
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
    this.videoError.emit(errorMessage);
  }

  /**
   * Play the video - direct player action
   */
  playVideo(): void {
    this.youtubePlayer.playVideo();
    // State is updated via onStateChange event
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

    if (this.isMuted()) {
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
    const newLikedState = !this.liked();
    this.liked.set(newLikedState);

    // Update global state if needed
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
          this.progress.set(progressPercent);

          // Update global state with progress only
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
   * Show video controls
   */
  showVideoControls(): void {
    this.isUserInteracting = true;
    this.showControls.set(true);
    this.controlsVisibilityChange.emit(true);

    // Reset the hide controls timer
    this.resetHideControlsTimer();
  }

  /**
   * Hide video controls after a delay if not interacting
   */
  resetHideControlsTimer(): void {
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }

    this.hideControlsTimer = setTimeout(() => {
      if (!this.isUserInteracting && this.isPlaying()) {
        this.showControls.set(false);
        this.controlsVisibilityChange.emit(false);
      }
    }, 3000);
  }

  /**
   * Set user interaction state when mouse enters the component
   */
  onMouseEnter(): void {
    this.isUserInteracting = true;
    this.showVideoControls();
  }

  /**
   * Set user interaction state when mouse leaves the component
   */
  onMouseLeave(): void {
    this.isUserInteracting = false;
    if (this.isPlaying()) {
      this.resetHideControlsTimer();
    }
  }

  /**
   * Handle tap/click on the player area
   * @param event The mouse event
   */
  handleTap(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('button')) {
      // If the video is muted and playing, unmute it on tap
      if (this.isMuted() && this.isPlaying() && this.playerReady()) {
        this.toggleMute();
        return;
      }

      // Handle controls visibility when tapping the player area
      if (this.isPlaying()) {
        // If playing, toggle play/pause button visibility only
        this.showPlayPauseButton.update(value => !value);
      } else {
        // If paused, always show play button
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
      // We just need to update our internal state
      this.progress.set(0);

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
    this.isMuted.set(true);
    patchState(this.state, {
      muted: true,
    });
  }

  /**
   * Handle video unmuted event
   */
  videoUnmuted(): void {
    this.isMuted.set(false);
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
    this.playPause.emit();
  }

  /**
   * Handle video playing event
   */
  private videoPlaying(): void {
    patchState(this.state, {
      playing: true,
      paused: false,
    });
    this.startProgressTracking();
    this.playPause.emit();
  }
}


