import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  Fullscreen,
  LucideAngularModule,
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { videoPlayerState } from '../../../../states/video-player.state';
import { ChannelsState } from '../../../../states/channels.state';
import { VideoPlayerService } from '../../../../services/video-player.service';
import { UserActivityVisibilityDirective } from '../../../../directives/user-activity-visibility.directive';

@Component({
  selector: 'app-video-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SliderModule,
    SelectModule,
    TooltipModule,
    LucideAngularModule,
    UserActivityVisibilityDirective
  ],
  templateUrl: './video-controls.component.html',
  styleUrl: './video-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoControlsComponent {
  private videoPlayerService = inject(VideoPlayerService);
  private playerState = inject(videoPlayerState);
  private channelsState = inject(ChannelsState);
  private destroyRef = inject(DestroyRef);

  // Icons
  protected readonly Play = Play;
  protected readonly Pause = Pause;
  protected readonly Volume2 = Volume2;
  protected readonly VolumeX = VolumeX;
  protected readonly Fullscreen = Fullscreen;
  protected readonly Maximize = Maximize;
  protected readonly Minimize = Minimize;
  protected readonly Settings = Settings;

  // State from stores
  playing = this.playerState.playing;
  paused = this.playerState.paused;
  muted = this.playerState.muted;
  currentVideo = computed(() => this.channelsState.currentVideo());

  // Local state for controls
  currentTime = signal(0);
  duration = signal(0);
  buffered = signal(0);
  volume = signal(100);
  playbackSpeed = signal(1);
  showSpeedMenu = signal(false);
  isFullscreen = signal(false);
  progressSliderValue = signal(0);

  // Available playback speeds
  speedOptions = [
    { label: '0.25x', value: 0.25 },
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: 'Normal', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 }
  ];

  // Computed values
  formattedCurrentTime = computed(() => this.formatTime(this.currentTime()));
  formattedDuration = computed(() => this.formatTime(this.duration()));
  progressPercentage = computed(() => {
    const duration = this.duration();
    return duration > 0 ? (this.currentTime() / duration) * 100 : 0;
  });
  bufferedPercentage = computed(() => {
    const duration = this.duration();
    return duration > 0 ? (this.buffered() / duration) * 100 : 0;
  });

  constructor() {
    // Subscribe to time updates from the player
    this.videoPlayerService.timeUpdate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ currentTime, duration }) => {
        this.currentTime.set(currentTime);
        this.duration.set(duration);
        this.progressSliderValue.set(currentTime);
      });

    // Subscribe to buffered updates
    this.videoPlayerService.bufferUpdate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(buffered => {
        this.buffered.set(buffered);
      });

    // Check fullscreen state
    const handleFullscreenChange = () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Clean up listener
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    });
  }

  handlePlayPause() {
    if (this.playing()) {
      this.videoPlayerService.pause();
    } else {
      this.videoPlayerService.play();
    }
  }

  handleMute() {
    if (this.muted()) {
      // Unmute - restore previous volume or default to 50
      const volumeToRestore = this.volume() > 0 ? this.volume() : 50;
      this.videoPlayerService.volume(volumeToRestore);
    } else {
      // Mute - set volume to 0
      this.videoPlayerService.volume(0);
    }
  }

  handleVolumeChange(value: number) {
    this.volume.set(value);
    this.videoPlayerService.volume(value);
  }

  handleSeek(value: number) {
    this.videoPlayerService.seek(value);
    this.currentTime.set(value);
  }

  handleSpeedChange(speed: number) {
    this.playbackSpeed.set(speed);
    this.videoPlayerService.rate(speed);
    this.showSpeedMenu.set(false);
  }

  handleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  private formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}