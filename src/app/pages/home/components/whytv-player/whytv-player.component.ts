/**
 * WhytvPlayerComponent - YouTube Player Integration
 * 
 * This component serves as the single source of truth for video player state and
 * acts as the bridge between YouTube's event-driven API and our signal-based state.
 * It's the only component that interacts with the YouTube Player API.
 * 
 * Pattern used here:
 * - RxJS Observables: For event streams from VideoPlayerService (play$, pause$, volume$)
 * - Signals: For reactive state management (playing, paused, muted states)
 * - Service methods: Uses special VideoPlayerService methods to update state in response to YouTube player events
 * 
 * All other components should interact with the player through VideoPlayerService,
 * never through direct state updates.
 */
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { YouTubePlayer, YouTubePlayerModule } from '@angular/youtube-player';

import { ChannelService } from '../../../../services/channel/channel.service';
import { VideoPlayerService } from '../../../../services/video-player.service';
import { ChannelsState } from '../../../../states/channels.state';
import { videoPlayerState } from '../../../../states/video-player.state';
import { VideoControlsComponent } from '../video-controls/video-controls.component';

@Component({
  selector: 'app-whytv-player',
  imports: [
    CommonModule,
    YouTubePlayerModule,
    VideoControlsComponent
  ],
  templateUrl: './whytv-player.component.html',
  styleUrl: './whytv-player.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class WhytvPlayerComponent implements AfterViewInit {
  readonly videoPlayerState = inject(videoPlayerState);
  readonly videoPlayerSvc = inject(VideoPlayerService);
  readonly channelSvc = inject(ChannelService);
  readonly channelsSate = inject(ChannelsState);
  protected windowHeight = signal<number>(window.innerHeight);
  protected windowWidth = signal<number>(window.innerWidth);
  readonly destroyRef = inject(DestroyRef);
  // Listen for window resize to adjust player dimensions
  @HostListener('window:resize')
  onResize() {
    this.windowHeight.set(window.innerHeight);
    this.windowWidth.set(window.innerWidth);
  }

  youtubePlayer = viewChild<YouTubePlayer>('player');

  // videoId = input('dQw4w9WgXcQ');
  videoId = computed(() => this.channelsSate?.currentVideo()?.youtubeId ?? 'dQw4w9WgXcQ');

  playerVars = {
    autohide: 1,
    autoplay: 1,
    controls: 0, // Hide native controls
    rel: 0,
    showinfo: 0,
    mute: 1,
    playsinline: 1
  };

  // State variables
  currentTime = 0;
  duration = 0;
  isMuted = false;
  volume = 100;
  availableRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  // Timer for progress updates
  private progressTimer: any;
  private lastEmittedTime = 0;

  constructor() {
    this.videoPlayerSvc.play$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.playVideo());

    this.videoPlayerSvc.pause$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pauseVideo());

    // Subscribe to volume changes
    this.videoPlayerSvc.volume$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((volume) => {
        this.volume = volume;
        if (volume === 0) {
          this.youtubePlayer()?.mute();
          this.isMuted = true;
          this.videoPlayerSvc.onMuted();
        } else {
          this.youtubePlayer()?.unMute();
          this.youtubePlayer()?.setVolume(volume);
          this.isMuted = false;
          this.videoPlayerSvc.onUnmuted();
        }
      });
  }
  ngAfterViewInit() {
    // Initial setup

  }

  onPlaybackQualityChange(event: YT.OnPlaybackQualityChangeEvent) {
  }

  onPlaybackRateChange(event: YT.OnPlaybackRateChangeEvent) {
  }

  onPlayerReady(event: YT.PlayerEvent) {
    this.youtubePlayer()?.playVideo();
    this.duration = this.youtubePlayer()?.getDuration() ?? 0;
    this.availableRates = this.youtubePlayer()?.getAvailablePlaybackRates() ?? [];
    this.startProgressTimer();
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
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.startProgressTimer();

        // Use service method to update state
        this.videoPlayerSvc.updatePlayingState(true, false);

        break;

      case YT.PlayerState.PAUSED:
        this.stopProgressTimer();

        // Use service method to update state
        this.videoPlayerSvc.updatePlayingState(false, true);

        break;

      case YT.PlayerState.ENDED:
       // get next video
       this.channelSvc.nextVideo();

        break;

      case YT.PlayerState.BUFFERING:
        break;

      case YT.PlayerState.CUED:
        break;

      case YT.PlayerState.UNSTARTED:
        setTimeout(() => {
          try {
            this.youtubePlayer()?.playVideo();
          } catch (error) {
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
  }

  onPlayerApi(event: YT.PlayerEvent) {
  }

  startProgressTimer() {
    this.stopProgressTimer(); // Clear any existing timer
    
    // Update time every 250ms for smooth progress
    this.progressTimer = setInterval(() => {
      this.emitTimeUpdate();
    }, 250);
  }

  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private emitTimeUpdate() {
    const player = this.youtubePlayer();
    if (player) {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      
      // Only emit if time has changed significantly (avoid flooding)
      if (Math.abs(currentTime - this.lastEmittedTime) >= 0.1 || currentTime === 0) {
        this.lastEmittedTime = currentTime;
        this.videoPlayerSvc.emitTimeUpdate(currentTime, duration);
      }

      // Also emit buffer updates
      const buffered = player.getVideoLoadedFraction() * duration;
      this.videoPlayerSvc.emitBufferUpdate(buffered);
    }
  }

  private playVideo() {
    this.youtubePlayer()?.playVideo();
  }

  private pauseVideo() {
    this.youtubePlayer()?.pauseVideo();
  }

  seekToPosition(event: Event) {
    const position = +(event.target as HTMLInputElement).value;
    const seekTime = (position / 100) * this.duration;
    this.youtubePlayer()?.seekTo(seekTime, true);
  }

  toggleMute() {
    if (this.isMuted) {
      this.videoPlayerSvc.volume(this.volume > 0 ? this.volume : 100);
    } else {
      this.videoPlayerSvc.volume(0);
    }
  }

  setVolume(event: Event) {
    const value = +(event.target as HTMLInputElement).value;
    this.volume = value;
    this.youtubePlayer()?.setVolume(value);
  }

  setPlaybackRate(event: Event) {
    const rate = +(event.target as HTMLSelectElement).value;
    this.youtubePlayer()?.setPlaybackRate(rate);
  }

  requestFullscreen() {
    this.youtubePlayer()?.requestFullscreen();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  }
}
