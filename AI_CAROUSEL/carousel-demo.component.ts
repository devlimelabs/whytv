import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

import { ChannelCarouselComponent } from './carousel.component';
import { Channel } from './models/channel.model';

@Component({
  selector: 'app-carousel-demo',
  standalone: true,
  imports: [CommonModule, ChannelCarouselComponent],
  template: `
    <div class="channel-carousel-container">
      <h2 class="text-2xl font-bold text-center mb-8">3D Channel Carousel</h2>

      <app-channel-carousel
        [channels]="channels()"
        [orientation]="carouselOrientation()"
        [autoRotate]="autoRotate()"
        [autoRotateInterval]="3000"
        (channelSelected)="onChannelSelected($event)"
      ></app-channel-carousel>

      <div class="flex justify-center gap-4 mt-8">
        <button
          (click)="toggleOrientation()"
          class="px-4 py-2 bg-black/60 border border-white/20 text-white rounded-md hover:bg-black/80 hover:border-white/40 transition-all"
        >
          Switch to {{ carouselOrientation() === 'horizontal' ? 'Vertical' : 'Horizontal' }}
        </button>

        <button
          (click)="toggleAutoRotate()"
          class="px-4 py-2 bg-black/60 border border-white/20 text-white rounded-md hover:bg-black/80 hover:border-white/40 transition-all"
        >
          {{ autoRotate() ? 'Stop' : 'Start' }} Auto-Rotation
        </button>
      </div>

      <div class="mt-8 p-4 bg-black/20 rounded-lg max-w-md mx-auto" *ngIf="selectedChannel()">
        <h3 class="text-xl font-semibold">{{ selectedChannel()?.name }}</h3>
        <p class="text-white/70">{{ selectedChannel()?.videos.length }} videos</p>
      </div>
    </div>
  `,
  styles: [`
    .channel-carousel-container {
      @apply p-8 max-w-full overflow-hidden bg-gray-900 text-white min-h-screen;
    }
  `]
})
export class CarouselDemoComponent {
  channels = signal<Channel[]>([
    {
      id: '1',
      name: 'Music Channel',
      videos: Array(24).fill(0).map((_, i) => ({
        id: `music-${i}`,
        title: `Music Video ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/1/300/200',
            alt: 'Music thumbnail'
          }
        }
      }))
    },
    {
      id: '2',
      name: 'Gaming',
      videos: Array(18).fill(0).map((_, i) => ({
        id: `gaming-${i}`,
        title: `Gaming Video ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/2/300/200',
            alt: 'Gaming thumbnail'
          }
        }
      }))
    },
    {
      id: '3',
      name: 'Podcasts',
      videos: Array(12).fill(0).map((_, i) => ({
        id: `podcast-${i}`,
        title: `Podcast Episode ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/3/300/200',
            alt: 'Podcast thumbnail'
          }
        }
      }))
    },
    {
      id: '4',
      name: 'Tutorials',
      videos: Array(32).fill(0).map((_, i) => ({
        id: `tutorial-${i}`,
        title: `Tutorial ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/4/300/200',
            alt: 'Tutorial thumbnail'
          }
        }
      }))
    },
    {
      id: '5',
      name: 'Cooking',
      videos: Array(15).fill(0).map((_, i) => ({
        id: `cooking-${i}`,
        title: `Recipe ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/5/300/200',
            alt: 'Cooking thumbnail'
          }
        }
      }))
    },
    {
      id: '6',
      name: 'Travel',
      videos: Array(20).fill(0).map((_, i) => ({
        id: `travel-${i}`,
        title: `Travel Vlog ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/6/300/200',
            alt: 'Travel thumbnail'
          }
        }
      }))
    },
    {
      id: '7',
      name: 'Science',
      videos: Array(22).fill(0).map((_, i) => ({
        id: `science-${i}`,
        title: `Science Experiment ${i + 1}`,
        thumbnails: {
          medium: {
            url: 'https://picsum.photos/id/7/300/200',
            alt: 'Science thumbnail'
          }
        }
      }))
    }
  ]);

  carouselOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  autoRotate = signal<boolean>(false);
  selectedChannel = signal<Channel | null>(null);

  onChannelSelected(channel: Channel): void {
    console.log('Channel selected:', channel);
    this.selectedChannel.set(channel);
  }

  toggleOrientation(): void {
    this.carouselOrientation.update(current =>
      current === 'horizontal' ? 'vertical' : 'horizontal'
    );
  }

  toggleAutoRotate(): void {
    this.autoRotate.update(current => !current);
  }
}
