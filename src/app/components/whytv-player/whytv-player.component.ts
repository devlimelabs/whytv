import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { YouTubePlayer, YouTubePlayerModule } from '@angular/youtube-player';
import { patchState } from '@ngrx/signals';

import { videoPlayerState } from '../../states/video-player.state';

@Component({
  selector: 'app-whytv-player',
  imports: [
    CommonModule,
    YouTubePlayerModule
  ],
  templateUrl: './whytv-player.component.html',
  styleUrl: './whytv-player.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhytvPlayerComponent implements AfterViewInit {
  readonly videoPlayerState = inject(videoPlayerState);
  protected windowHeight = signal<number>(window.innerHeight);
  protected windowWidth = signal<number>(window.innerWidth);

  // Listen for window resize to adjust player dimensions
  @HostListener('window:resize')
  onResize() {
    this.windowHeight.set(window.innerHeight);
    this.windowWidth.set(window.innerWidth);
  }


  youtubePlayer = viewChild<YouTubePlayer>('player');

  // videoId = input('dQw4w9WgXcQ');
  videoId = input<string>();


  playerVars = {
    autoplay: 0,
    controls: 0, // Hide native controls
    rel: 0,
    showinfo: 0,
    mute: 0,
    modestbranding: 1,
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

  ngAfterViewInit() {
    // Initial setup
  }

  onPlayerReady(event: YT.PlayerEvent) {
    this.youtubePlayer()?.playVideo();
    this.duration = this.youtubePlayer()?.getDuration() ?? 0;
    this.availableRates = this.youtubePlayer()?.getAvailablePlaybackRates() ?? [];
    this.startProgressTimer();
  }

  onStateChange(event: YT.OnStateChangeEvent) {
    if (event.data === YT.PlayerState.PLAYING) {
      this.startProgressTimer();
      patchState(this.videoPlayerState, {
        playing: true

      });
    } else {
      this.stopProgressTimer();
    }
  }

  startProgressTimer() {
    this.progressTimer = setInterval(() => {
      this.currentTime = this.youtubePlayer()?.getCurrentTime() ?? 0;
    }, 1000);
  }

  stopProgressTimer() {
    clearInterval(this.progressTimer);
  }

  playVideo() {
    this.youtubePlayer()?.playVideo();
  }

  pauseVideo() {
    this.youtubePlayer()?.pauseVideo();
  }

  stopVideo() {
    this.youtubePlayer()?.stopVideo();
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
