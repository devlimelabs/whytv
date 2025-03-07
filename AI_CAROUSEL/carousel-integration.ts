// example-component.ts
import { Component } from '@angular/core';

interface VideoChannel {
  id: string;
  name: string;
  videos: {
    id: string;
    title: string;
    thumbnails: {
      medium: {
        url: string;
        alt: string;
      }
    }
  }[];
}

@Component({
  selector: 'app-example',
  template: `
    <div class="channel-carousel-container">
      <h2>Featured Channels</h2>
      
      <app-video-carousel
        [channels]="videoChannels"
        [orientation]="carouselOrientation"
        (channelSelected)="onChannelSelected($event)"
      ></app-video-carousel>
      
      <div class="orientation-toggle">
        <button (click)="toggleOrientation()">
          Switch to {{ carouselOrientation === 'horizontal' ? 'Vertical' : 'Horizontal' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .channel-carousel-container {
      padding: 2rem;
      max-width: 100%;
      overflow: hidden;
      background-color: #121212;
      color: white;
    }
    
    h2 {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .orientation-toggle {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
    }
    
    button {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class ExampleComponent {
  videoChannels: VideoChannel[] = [
    {
      id: '1',
      name: 'Music Videos',
      videos: [
        {
          id: '101',
          title: 'Top Hits',
          thumbnails: {
            medium: {
              url: 'https://example.com/music-thumbnail.jpg',
              alt: 'Music video thumbnail'
            }
          }
        },
        // More videos...
      ]
    },
    {
      id: '2',
      name: 'Gaming',
      videos: [
        {
          id: '201',
          title: 'Best Gaming Moments',
          thumbnails: {
            medium: {
              url: 'https://example.com/gaming-thumbnail.jpg',
              alt: 'Gaming video thumbnail'
            }
          }
        },
        // More videos...
      ]
    },
    // Add more channels as needed...
  ];
  
  carouselOrientation: 'horizontal' | 'vertical' = 'horizontal';
  
  onChannelSelected(channel: VideoChannel) {
    console.log('Channel selected:', channel);
    // Handle channel selection (e.g., navigate to channel page)
  }
  
  toggleOrientation() {
    this.carouselOrientation = this.carouselOrientation === 'horizontal' ? 'vertical' : 'horizontal';
  }
}
