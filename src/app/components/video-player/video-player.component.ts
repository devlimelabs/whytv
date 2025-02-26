import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Pause, Play } from 'lucide-angular';
import { debounceTime, fromEvent, merge } from 'rxjs';

import { Video } from '../../shared/types/video.types';
import { SideActionsComponent } from '../side-actions/side-actions.component';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css'],
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SideActionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPlayerComponent implements OnInit, OnDestroy {

  private destroyRef = inject(DestroyRef);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Inputs
  video = input.required<Video>();
  isPlaying = input.required<boolean>();

  // Outputs
  playPause = output<void>();

  // Signals
  showControls = signal(true);
  liked = signal(false);
  progress = signal(0);
  isMuted = signal(true);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Private properties
  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;

  // Icons
  protected readonly Play = Play;
  protected readonly Pause = Pause;


  ngOnInit(): void {
    this.initializeControlsVisibility();
  }

  ngOnDestroy(): void {
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
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
      this.playPause.emit();
    }
  }

  toggleMute(event: MouseEvent): void {
    event.stopPropagation();
    if (this.videoElement) {
      const video = this.videoElement.nativeElement;
      video.muted = !video.muted;
      this.isMuted.set(!this.isMuted());
    }
  }

  toggleLike(event: MouseEvent): void {
    event.stopPropagation();
    this.liked.update(value => !value);
  }

  handleTimeUpdate(): void {
    if (this.videoElement) {
      const video = this.videoElement.nativeElement;
      const progress = (video.currentTime / video.duration) * 100;
      this.progress.set(isNaN(progress) ? 0 : progress);
    }
  }

  handleVideoEnded(): void {
    if (this.videoElement) {
      this.videoElement.nativeElement.currentTime = 0;
      this.playPause.emit();
    }
  }

  handleLoadStart(): void {
    // this.isLoading.set(true);
    this.error.set(null);
  }

  handleCanPlay(): void {
    this.isLoading.set(false);
    this.error.set(null);
  }

  handleError(): void {
    this.isLoading.set(false);
    this.error.set('Failed to load video. Please check your connection and try again.');
  }
}
