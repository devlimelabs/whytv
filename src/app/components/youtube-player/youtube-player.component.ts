import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef, inject,
    input,
    OnDestroy,
    OnInit,
    output,
    signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Pause, Play, Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-angular';
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
  changeDetection: ChangeDetectionStrategy.OnPush
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

  // Signals
  showControls = signal(true);
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

  // Icons
  protected readonly Play = Play;
  protected readonly Pause = Pause;
  protected readonly Heart = Heart;
  protected readonly MessageCircle = MessageCircle;
  protected readonly Share2 = Share2;
  protected readonly Volume2 = Volume2;
  protected readonly VolumeX = VolumeX;

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

    // Create the player
    this.player = this.youtubeService.createPlayer('youtube-player', {
      height: this.height(),
      width: this.width(),
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
      event.target.playVideo();
    }

    // Set initial mute state
    if (this.isMuted()) {
      event.target.mute();
    } else {
      event.target.unMute();
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

  handlePlayPause(): void {
    if (!this.player || !this.playerReady()) return;

    if (this.isPlaying()) {
      this.player.pauseVideo();
    } else {
      this.player.playVideo();
    }

    this.playPause.emit();
  }

  // Update the player when the videoId changes
  updateVideo(): void {
    if (this.player && this.playerReady()) {
      this.player.loadVideoById(this.videoId());

      if (this.isPlaying()) {
        this.player.playVideo();
      } else {
        this.player.pauseVideo();
      }
    }
  }

  private initializeControlsVisibility(): void {
    const mouseMove$ = fromEvent(document, 'mousemove');
    const mouseLeave$ = fromEvent(document, 'mouseleave');

    merge(mouseMove$, mouseLeave$)
      .pipe(
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.showControls.set(true);
        this.resetHideControlsTimer();
      });
  }

  private resetHideControlsTimer(): void {
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
    this.hideControlsTimer = setTimeout(() => {
      this.showControls.set(false);
    }, 3000);
  }

  handleTap(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('button')) {
      this.showControls.set(true);
      this.resetHideControlsTimer();
      this.playPause.emit();
    }
  }

  toggleMute(event: MouseEvent): void {
    event.stopPropagation();
    if (this.player && this.playerReady()) {
      if (this.isMuted()) {
        this.player.unMute();
        this.isMuted.set(false);
      } else {
        this.player.mute();
        this.isMuted.set(true);
      }
    }
  }

  toggleLike(event: MouseEvent): void {
    event.stopPropagation();
    this.liked.update(value => !value);
  }
}
