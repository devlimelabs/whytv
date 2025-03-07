// video-carousel.component.ts
import { Component, Input, OnInit, HostListener, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

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
  selector: 'app-video-carousel',
  templateUrl: './video-carousel.component.html',
  styleUrls: ['./video-carousel.component.scss'],
  animations: [
    trigger('carouselAnimation', [
      transition('* => *', [
        animate('0.5s ease-in-out')
      ])
    ])
  ]
})
export class VideoCarouselComponent implements OnInit {
  @Input() channels: VideoChannel[] = [];
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  
  @Output() channelSelected = new EventEmitter<VideoChannel>();
  
  @ViewChild('carousel') carousel!: ElementRef;
  
  selectedIndex = 0;
  cellCount = 0;
  theta = 0;
  cellSize = 210; // Width or height depending on orientation
  carouselRadius = 0;
  isAnimating = false;
  touchStartX = 0;
  touchStartY = 0;
  
  ngOnInit() {
    this.cellCount = this.channels.length;
    this.theta = 360 / this.cellCount;
    this.calculateRadius();
    
    // Initialize with a slight delay to ensure DOM is ready
    setTimeout(() => {
      this.rotateCarousel();
    }, 100);
  }
  
  @HostListener('window:resize')
  onResize() {
    this.calculateRadius();
    this.rotateCarousel();
  }
  
  calculateRadius() {
    // Use the formula from the guide
    this.carouselRadius = Math.round((this.cellSize / 2) / 
      Math.tan(Math.PI / this.cellCount));
  }
  
  rotateCarousel() {
    if (!this.carousel) return;
    
    const angle = this.theta * this.selectedIndex * -1;
    const transformValue = this.orientation === 'horizontal' 
      ? `translateZ(${-this.carouselRadius}px) rotateY(${angle}deg)`
      : `translateZ(${-this.carouselRadius}px) rotateX(${-angle}deg)`;
    
    this.carousel.nativeElement.style.transform = transformValue;
  }
  
  previous() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.selectedIndex--;
    this.rotateCarousel();
    setTimeout(() => this.isAnimating = false, 500);
  }
  
  next() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.selectedIndex++;
    this.rotateCarousel();
    setTimeout(() => this.isAnimating = false, 500);
  }
  
  selectChannel(channel: VideoChannel, index: number) {
    this.selectedIndex = index;
    this.rotateCarousel();
    this.channelSelected.emit(channel);
  }
  
  isCurrentChannel(channel: VideoChannel): boolean {
    return this.channels.indexOf(channel) === this.selectedIndex;
  }
  
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }
  
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = this.touchStartX - touchEndX;
    const deltaY = this.touchStartY - touchEndY;
    
    // Determine swipe direction based on orientation
    if (this.orientation === 'horizontal') {
      if (Math.abs(deltaX) > 50) { // Minimum swipe distance
        deltaX > 0 ? this.next() : this.previous();
      }
    } else {
      if (Math.abs(deltaY) > 50) {
        deltaY > 0 ? this.next() : this.previous();
      }
    }
  }
}
