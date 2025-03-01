import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

import { channelsStore } from '../../states/channels.state';
import { Channel } from '../../states/video-player.state';

@Component({
  selector: 'app-channel-carousel',
  standalone: true,
  imports: [CommonModule, CarouselModule, LucideAngularModule],
  templateUrl: './channel-carousel.component.html',
  styleUrls: ['./channel-carousel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelCarouselComponent {
  // Inject the channels store
  private channelsState = inject(channelsStore);
  
  // Icons
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;
  
  // UI state
  visible = signal(true);
  
  // Configuration for the carousel
  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 7,
      numScroll: 1
    },
    {
      breakpoint: '1199px',
      numVisible: 6,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 5,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 4,
      numScroll: 1
    },
    {
      breakpoint: '576px',
      numVisible: 3,
      numScroll: 1
    }
  ];
  
  // Use the channels from the store
  get channels() {
    return this.channelsState.channels();
  }
  
  // Get the current channel for highlighting
  get currentChannel() {
    return this.channelsState.currentChannel();
  }
  
  // Select a channel when clicked
  selectChannel(channel: Channel) {
    this.channelsState.setCurrentChannel(channel);
  }
  
  // Check if this is the current channel (for styling)
  isCurrentChannel(channel: Channel): boolean {
    return this.currentChannel?.id === channel.id;
  }
  
  // Toggle visibility of the carousel
  toggleVisibility() {
    this.visible.update(value => !value);
  }
}