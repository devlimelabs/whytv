import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CarouselModule } from 'primeng/carousel';
import { LucideAngularModule, ChevronUp, ChevronDown, X } from 'lucide-angular';
import { fromEvent } from 'rxjs';

import { activeChannelStore } from '../../states/active-channel.state';
import { channelsStore } from '../../states/channels.state';
import { Video, videoPlayerState } from '../../states/video-player.state';

@Component({
  selector: 'app-video-carousel',
  standalone: true,
  imports: [CommonModule, CarouselModule, LucideAngularModule],
  templateUrl: './video-carousel.component.html',
  styleUrls: ['./video-carousel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoCarouselComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private hideTimer: number | null = null;
  // Inject the stores
  private activeChannelState = inject(activeChannelStore);
  private channelsState = inject(channelsStore);
  protected playerState = inject(videoPlayerState);
  
  // Icons
  protected readonly ChevronUp = ChevronUp;
  protected readonly ChevronDown = ChevronDown;
  protected readonly X = X;
  
  // UI state - now controlled by the parent component
  visible = input<boolean>(false);
  
  // Output to close the carousel
  toggleVisibility = output<void>();
  
  // Track user interaction
  private isUserInteracting = signal(false);
  
  // Configuration for the carousel
  responsiveOptions = [
    {
      breakpoint: '1199px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '576px',
      numVisible: 1,
      numScroll: 1
    }
  ];
  
  // Get videos from the current channel
  get videos(): Video[] {
    const channel = this.channelsState.currentChannel();
    return channel?.videos || [];
  }
  
  // Get the current video for highlighting
  get currentVideoIndex(): number {
    return this.activeChannelState.currentVideoIndex();
  }
  
  // Select a video when clicked
  selectVideo(index: number) {
    this.activeChannelState.setVideoIndex(index);
  }
  
  // Check if this is the current video (for styling)
  isCurrentVideo(index: number): boolean {
    return this.currentVideoIndex === index;
  }
  
  // We now use side actions to toggle visibility
  // The close method is removed as we want to control this only through side actions
  
  // Format duration for display
  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  ngOnInit(): void {
    // Set up event listeners for mouse and touch events
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isUserInteracting.set(true);
        this.resetHideTimer();
      });
      
    fromEvent(document, 'touchstart')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isUserInteracting.set(true);
        this.resetHideTimer();
      });
  }
  
  // Reset the hide timer whenever there's user interaction
  private resetHideTimer(): void {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    
    // If the carousel is visible, start a timer to hide it
    if (this.visible()) {
      this.hideTimer = window.setTimeout(() => {
        if (!this.isUserInteracting() || this.playerState.playing()) {
          this.toggleVisibility.emit();
        }
        // Reset interaction state
        this.isUserInteracting.set(false);
      }, 2000);
    }
  }
}