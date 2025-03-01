import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { LucideAngularModule, ChevronUp, ChevronDown, X } from 'lucide-angular';

import { activeChannelStore } from '../../states/active-channel.state';
import { channelsStore } from '../../states/channels.state';
import { Video } from '../../states/video-player.state';

@Component({
  selector: 'app-video-carousel',
  standalone: true,
  imports: [CommonModule, CarouselModule, LucideAngularModule],
  templateUrl: './video-carousel.component.html',
  styleUrls: ['./video-carousel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoCarouselComponent {
  // Inject the stores
  private activeChannelState = inject(activeChannelStore);
  private channelsState = inject(channelsStore);
  
  // Icons
  protected readonly ChevronUp = ChevronUp;
  protected readonly ChevronDown = ChevronDown;
  protected readonly X = X;
  
  // UI state - now controlled by the parent component
  visible = input<boolean>(false);
  
  // Output to close the carousel
  toggleVisibility = output<void>();
  
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
  
  // Handle close button click
  close() {
    this.toggleVisibility.emit();
  }
  
  // Format duration for display
  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}