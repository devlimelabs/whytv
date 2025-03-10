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
import { patchState } from '@ngrx/signals';

import { ChannelService } from '../../../../services/channel/channel.service';
import { VideoPlayerService } from '../../../../services/video-player.service';
import { ChannelsState } from '../../../../states/channels.state';
import { videoPlayerState } from '../../../../states/video-player.state';

@Component({
  selector: 'app-whytv-player',
  imports: [
    CommonModule,
    YouTubePlayerModule
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

  constructor() {
    this.videoPlayerSvc.play$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.playVideo();
      });

    this.videoPlayerSvc.pause$.subscribe(() => {
      this.pauseVideo();
    });
  }
  ngAfterViewInit() {
    // Initial setup

  }

  onPlaybackQualityChange(event: YT.OnPlaybackQualityChangeEvent) {
    console.log('Playback quality changed', event);
  }

  onPlaybackRateChange(event: YT.OnPlaybackRateChangeEvent) {
    console.log('Playback rate changed', event);
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
    console.log(`Player state changed to ${stateNames[event.data] || event.data}`);

    switch (event.data) {
      case YT.PlayerState.PLAYING:
        console.log('Video is now playing');

        this.startProgressTimer();

        patchState(this.videoPlayerState, {
          playing: true,
          paused: false
        });

        break;

      case YT.PlayerState.PAUSED:
        console.log('Video is now paused');

        this.stopProgressTimer();

        patchState(this.videoPlayerState, {
          playing: false,
          paused: true
        });

        break;

      case YT.PlayerState.ENDED:
        console.log('Video has ended');

       // get next video
       this.channelSvc.nextVideo();

        break;

      case YT.PlayerState.BUFFERING:
        console.log('Video is buffering');
        break;

      case YT.PlayerState.CUED:
        console.log('Video is cued and ready to play');

        break;

      case YT.PlayerState.UNSTARTED:
        console.log('Video is unstarted - attempting to play');
        setTimeout(() => {
          try {
            this.youtubePlayer()?.playVideo();
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
  }

  onPlayerApi(event: YT.PlayerEvent) {
    console.log('Player API event', event);
  }

  startProgressTimer() {
    this.progressTimer = setInterval(() => {
      this.currentTime = this.youtubePlayer()?.getCurrentTime() ?? 0;
    }, 1000);
  }

  stopProgressTimer() {
    clearInterval(this.progressTimer);
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
      this.youtubePlayer()?.unMute();
    } else {
      this.youtubePlayer()?.mute();
    }
    this.isMuted = !this.isMuted;
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
