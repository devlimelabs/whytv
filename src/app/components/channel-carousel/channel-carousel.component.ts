import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChevronLeft, ChevronRight, LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CarouselModule } from 'primeng/carousel';

import { ChannelService } from '../../services/channel/channel.service';
import { channelsStore } from '../../states/channels.state';
import { Channel, videoPlayerState } from '../../states/video-player.state';

@Component({
  selector: 'app-channel-carousel',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CarouselModule,
    CommonModule,
    LucideAngularModule,
    NgOptimizedImage
  ],
  templateUrl: './channel-carousel.component.html',
  styleUrls: ['./channel-carousel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelCarouselComponent {
  // Inject the stores
  readonly channelsState = inject(channelsStore);
  private channelsSvc = inject(ChannelService);
  readonly playerState = inject(videoPlayerState);
  private router = inject(Router);
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
    this.router.navigate(['./'], { queryParams: { channelId: channel.id } });
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
