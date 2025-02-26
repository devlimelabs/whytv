import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef, effect, HostListener, inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Pause, Play } from 'lucide-angular';
import { filter, take } from 'rxjs';
import { fromEvent, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { YoutubeService } from '../../services/youtube.service';
import { SideActionsComponent } from '../side-actions/side-actions.component';
import { Video } from '../../shared/types/video.types';

@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.css'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SideActionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class YoutubePlayerComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private youtubeService = inject(YoutubeService);

  // Inputs
  videoId = input.required<string>();
  isPlaying = input.required<boolean>();
  height = input<number>(360);
  width = input<number>(640);
  video = input.required<Video>();

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

  // YouTube player instance
  private player: YT.Player | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
  private playbackStartTime = 0;

  // Icons
  protected readonly Play = Play;
  protected readonly Pause = Pause;

  constructor() {
    // Watch for changes to videoId and update the player
    effect(() => {
      const id = this.videoId();
      if (id && this.player && this.playerReady()) {
        this.updateVideo();
      }
    });

    // Watch for changes to isPlaying
    effect(() => {
      const playing = this.isPlaying();
      if (this.player && this.playerReady()) {
        if (playing) {
          this.player.playVideo();
        } else {
          this.player.pauseVideo();
        }
      }
    });

    // Debug effect to log isLoading changes
    effect(() => {
      console.log('YoutubePlayer isLoading changed:', this.isLoading());
    });
  }

  ngOnInit(): void {
    // Initialize the YouTube player when the API is ready
    this.youtubeService.apiReady()
      .pipe(
        filter(ready => ready),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.initializePlayer();
      });

    this.initializeControlsVisibility();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizePlayer();
  }

  private resizePlayer(): void {
    if (this.player && this.playerReady()) {
      const playerElement = document.getElementById('youtube-player');
      if (playerElement) {
        const containerWidth = playerElement.clientWidth;
        const containerHeight = playerElement.clientHeight;
        this.player.setSize(containerWidth, containerHeight);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }

    // Destroy the player if it exists
    if (this.player) {
      this.player.destroy();
    }
  }

  private initializePlayer(): void {
    // Create a div element for the player
    const playerElement = document.getElementById('youtube-player');

    if (!playerElement) {
      console.error('YouTube player element not found');
      return;
    }

    // Get the container dimensions
    const containerWidth = playerElement.clientWidth || this.width();
    const containerHeight = playerElement.clientHeight || this.height();

    // Create the player
    this.player = this.youtubeService.createPlayer('youtube-player', {
      height: containerHeight,
      width: containerWidth,
      videoId: this.videoId(),
      playerVars: {
        autoplay: this.isPlaying() ? 1 : 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3, // Hide video annotations
        modestbranding: 1,
        playsinline: 1,
        rel: 0, // Don't show related videos
        showinfo: 0
        // Not setting mute parameter to try playing with sound first
      },
      events: {
        onReady: this.onPlayerReady.bind(this),
        onStateChange: this.onPlayerStateChange.bind(this),
        onError: this.onPlayerError.bind(this)
      }
    });

    // Start tracking progress
    this.startProgressTracking();
  }

  private onPlayerReady(event: YT.PlayerEvent): void {
    this.isLoading.set(false);
    this.playerReady.set(true);

    if (this.isPlaying()) {
      // Try to play with sound first
      event.target.unMute();
      this.isMuted.set(false);

      const playPromise = event.target.playVideo();

      // If browser prevents autoplay with sound, fall back to muted autoplay
      setTimeout(() => {
        // Check if video is actually playing after a short delay
        if (this.player && this.player.getPlayerState() !== 1) { // 1 = playing
          this.player.mute();
          this.isMuted.set(true);
          this.player.playVideo();
        }
      }, 250);

      // Record when playback started
      this.playbackStartTime = Date.now();
      // Hide play button immediately when playing
      this.showPlayPauseButton.set(false);
    }
  }

  private onPlayerStateChange(event: YT.OnStateChangeEvent): void {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      this.videoEnded.emit();
    }
  }

  private onPlayerError(event: YT.OnErrorEvent): void {
    this.isLoading.set(false);
    let errorMessage = 'An error occurred with the YouTube player.';

    // Map YouTube error codes to user-friendly messages
    switch (event.data) {
      case 2:
        errorMessage = 'Invalid video ID.';
        break;
      case 5:
        errorMessage = 'The requested content cannot be played in an HTML5 player.';
        break;
      case 100:
        errorMessage = 'The video requested was not found.';
        break;
      case 101:
      case 150:
        errorMessage = 'The owner of the requested video does not allow it to be played in embedded players.';
        break;
    }

    this.error.set(errorMessage);
    this.videoError.emit(errorMessage);
  }

  private startProgressTracking(): void {
    // Update progress every 250ms
    this.progressInterval = setInterval(() => {
      if (this.player && this.playerReady()) {
        const currentTime = this.player.getCurrentTime() || 0;
        const duration = this.player.getDuration() || 0;

        if (duration > 0) {
          const progress = (currentTime / duration) * 100;
          this.progress.set(progress);
        }
      }
    }, 250);
  }

  handleTap(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('button')) {
      // If the video is muted and playing, unmute it on tap
      if (this.isMuted() && this.isPlaying() && this.playerReady()) {
        this.toggleMute(event);
        return;
      }

      // Handle controls visibility when tapping the player area
      if (this.isPlaying()) {
        // If playing, toggle play/pause button visibility only
        this.showPlayPauseButton.update(value => !value);
        // Don't toggle side controls visibility
      } else {
        // If paused, always show play button
        this.showPlayPauseButton.set(true);
        // Don't change side controls visibility
      }

      // Toggle play/pause when tapping the video area
      if (this.playerReady()) {
        this.handlePlayPause();
      }
    }
  }

  handlePlayPause(): void {
    if (!this.player || !this.playerReady()) return;

    if (this.isPlaying()) {
      this.player.pauseVideo();
      // Show play button when pausing
      this.showPlayPauseButton.set(true);
      // Don't change side controls visibility
    } else {
      this.player.playVideo();
      // Record when playback started
      this.playbackStartTime = Date.now();
      // Hide play button immediately when playing
      this.showPlayPauseButton.set(false);
      // Don't change side controls visibility
    }

    this.playPause.emit();
  }

  // Update the player when the videoId changes
  updateVideo(): void {
    if (this.player && this.playerReady()) {
      this.isLoading.set(true);

      // Store current mute state before loading new video
      const wasMuted = this.isMuted();

      this.player.loadVideoById(
        this.videoId(),
        0 // startSeconds
      );

      this.isLoading.set(false);

      // Maintain the previous mute state instead of always trying to unmute
      if (wasMuted) {
        this.player.mute();
      } else {
        this.player.unMute();
      }

      // Keep the isMuted signal in sync with the actual state
      this.isMuted.set(wasMuted);

      if (this.isPlaying()) {
        this.player.playVideo();

        // Record when playback started
        this.playbackStartTime = Date.now();
        // Hide play button immediately when playing
        this.showPlayPauseButton.set(false);
      } else {
        this.player.pauseVideo();
        // Show play button when paused
        this.showPlayPauseButton.set(true);
      }
    }
  }

  private initializeControlsVisibility(): void {
    // Emit initial state
    this.controlsVisibilityChange.emit(this.showControls());

    const mouseMove$ = fromEvent(document, 'mousemove');
    const mouseLeave$ = fromEvent(document, 'mouseleave');

    merge(mouseMove$, mouseLeave$)
      .pipe(
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        // Always show side controls on mouse movement
        this.showControls.set(true);
        this.resetHideControlsTimer();
      });
  }

  private resetHideControlsTimer(): void {
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }

    // Show controls and emit the change
    if (!this.showControls()) {
      this.showControls.set(true);
      this.controlsVisibilityChange.emit(true);
    }

    this.hideControlsTimer = setTimeout(() => {
      this.showControls.set(false);
      this.controlsVisibilityChange.emit(false);
    }, 3000);
  }

  toggleMute(event: MouseEvent): void {
    event.stopPropagation();
    if (this.player && this.playerReady()) {
      if (this.isMuted()) {
        // Fade in volume
        this.fadeInVolume();
      } else {
        this.player.mute();
        this.isMuted.set(true);
      }
    }
  }

  // Fade in volume from 0 to 100 over a short period
  private fadeInVolume(): void {
    if (!this.player) return;

    this.player.unMute();
    this.isMuted.set(false);

    // Start at volume 0
    this.player.setVolume(0);

    let volume = 0;
    const fadeInterval = setInterval(() => {
      volume += 10;
      if (volume <= 100) {
        this.player?.setVolume(volume);
      } else {
        clearInterval(fadeInterval);
      }
    }, 50); // Increase volume every 50ms (total fade time: ~500ms)
  }

  toggleLike(event: MouseEvent): void {
    event.stopPropagation();
    this.liked.update(value => !value);
  }

  handleComment(event: MouseEvent): void {
    // Handle comment action
    console.log('Comment action triggered');
  }

  handleShare(event: MouseEvent): void {
    // Implement share functionality
    console.log('Share video', this.video());
  }

  handleNextVideo(event: MouseEvent): void {
    this.nextVideo.emit();
  }

  handlePreviousVideo(event: MouseEvent): void {
    this.previousVideo.emit();
  }
}
