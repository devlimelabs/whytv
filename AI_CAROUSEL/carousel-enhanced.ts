// Add these methods to the VideoCarouselComponent class

import { AfterViewInit, Renderer2 } from '@angular/core';

// Update the class declaration to implement AfterViewInit
export class VideoCarouselComponent implements OnInit, AfterViewInit {
  // Add Renderer2 to constructor
  constructor(private renderer: Renderer2) {}
  
  // Existing properties and methods...
  
  // Add these new properties
  isAutoRotating = false;
  autoRotateInterval: any;
  isDragging = false;
  startAngle = 0;
  currentAngle = 0;
  
  ngAfterViewInit() {
    // Set up initial cell positions
    this.updateCellPositions();
    
    // Add class to show the carousel is ready
    if (this.carousel) {
      this.renderer.addClass(this.carousel.nativeElement, 'initialized');
    }
  }
  
  updateCellPositions() {
    if (!this.carousel) return;
    
    const cells = this.carousel.nativeElement.querySelectorAll('.carousel__cell');
    const angleInc = 360 / cells.length;
    
    cells.forEach((cell: HTMLElement, i: number) => {
      const angle = angleInc * i;
      const transformValue = this.orientation === 'horizontal' 
        ? `rotateY(${angle}deg) translateZ(${this.carouselRadius}px)`
        : `rotateX(${angle}deg) translateZ(${this.carouselRadius}px)`;
      
      this.renderer.setStyle(cell, 'transform', transformValue);
      this.renderer.setStyle(cell, 'opacity', '1');
      
      // Add orientation class for potential CSS targeting
      if (this.orientation === 'horizontal') {
        this.renderer.addClass(cell, 'horizontal');
        this.renderer.removeClass(cell, 'vertical');
      } else {
        this.renderer.addClass(cell, 'vertical');
        this.renderer.removeClass(cell, 'horizontal');
      }
    });
  }
  
  // Override the existing rotateCarousel method
  rotateCarousel() {
    if (!this.carousel) return;
    
    const angle = this.theta * this.selectedIndex * -1;
    const transformValue = this.orientation === 'horizontal' 
      ? `translateZ(${-this.carouselRadius}px) rotateY(${angle}deg)`
      : `translateZ(${-this.carouselRadius}px) rotateX(${-angle}deg)`;
    
    this.renderer.setStyle(this.carousel.nativeElement, 'transform', transformValue);
    this.currentAngle = angle;
  }
  
  // Method to handle orientation change
  setOrientation(orientation: 'horizontal' | 'vertical') {
    this.orientation = orientation;
    // Need to recalculate and update positions when orientation changes
    this.updateCellPositions();
    this.rotateCarousel();
  }
  
  // Enhanced mouse and touch interaction
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.startDrag(event.clientX, event.clientY);
    
    // Stop auto-rotation when user interacts
    this.stopAutoRotate();
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.drag(event.clientX, event.clientY);
  }
  
  @HostListener('document:mouseup')
  onMouseUp() {
    this.endDrag();
  }
  
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
    
    // Store for simple tap detection
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    
    // Stop auto-rotation when user interacts
    this.stopAutoRotate();
  }
  
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    const touch = event.touches[0];
    this.drag(touch.clientX, touch.clientY);
    
    // Prevent page scrolling when dragging the carousel
    event.preventDefault();
  }
  
  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    // Calculate if this was a tap or a drag
    const touch = event.changedTouches[0];
    const deltaX = Math.abs(this.touchStartX - touch.clientX);
    const deltaY = Math.abs(this.touchStartY - touch.clientY);
    
    // If it's a small movement, consider it a tap
    if (deltaX < 10 && deltaY < 10) {
      // Find the tapped element
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = element?.closest('.carousel__cell');
      
      if (cell) {
        const index = Array.from(this.carousel.nativeElement.querySelectorAll('.carousel__cell')).indexOf(cell);
        if (index !== -1) {
          this.selectChannel(this.channels[index], index);
        }
      }
    }
    
    this.endDrag();
  }
  
  private startDrag(clientX: number, clientY: number) {
    this.isDragging = true;
    this.startAngle = this.currentAngle;
    this.touchStartX = clientX;
    this.touchStartY = clientY;
  }
  
  private drag(clientX: number, clientY: number) {
    if (!this.isDragging) return;
    
    const deltaX = clientX - this.touchStartX;
    const deltaY = clientY - this.touchStartY;
    
    let dragAngle = 0;
    if (this.orientation === 'horizontal') {
      dragAngle = deltaX * 0.5; // Adjust sensitivity
    } else {
      dragAngle = deltaY * 0.5; // Adjust sensitivity
    }
    
    const newAngle = this.startAngle + dragAngle;
    const transformValue = this.orientation === 'horizontal' 
      ? `translateZ(${-this.carouselRadius}px) rotateY(${newAngle}deg)`
      : `translateZ(${-this.carouselRadius}px) rotateX(${-newAngle}deg)`;
    
    this.renderer.setStyle(this.carousel.nativeElement, 'transform', transformValue);
    this.currentAngle = newAngle;
  }
  
  private endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    // Snap to nearest cell
    const anglePerCell = 360 / this.cellCount;
    const normalizedAngle = this.currentAngle % 360;
    const cellIndex = Math.round(normalizedAngle / anglePerCell) % this.cellCount;
    
    // Ensure positive index
    this.selectedIndex = (cellIndex < 0) ? this.cellCount + cellIndex : cellIndex;
    this.rotateCarousel();
    
    // Emit selected channel
    this.channelSelected.emit(this.channels[this.selectedIndex]);
  }
  
  // Auto-rotation methods
  startAutoRotate(intervalMs = 3000) {
    if (this.isAutoRotating) return;
    
    this.isAutoRotating = true;
    this.autoRotateInterval = setInterval(() => {
      this.selectedIndex = (this.selectedIndex + 1) % this.cellCount;
      this.rotateCarousel();
    }, intervalMs);
  }
  
  stopAutoRotate() {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = null;
    }
    this.isAutoRotating = false;
  }
  
  // Keyboard navigation
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Only handle keys if the component has focus
    if (document.activeElement !== this.carousel?.nativeElement && 
        !this.carousel?.nativeElement.contains(document.activeElement)) {
      return;
    }
    
    switch (event.key) {
      case 'ArrowLeft':
        if (this.orientation === 'horizontal') this.previous();
        break;
      case 'ArrowRight':
        if (this.orientation === 'horizontal') this.next();
        break;
      case 'ArrowUp':
        if (this.orientation === 'vertical') this.previous();
        break;
      case 'ArrowDown':
        if (this.orientation === 'vertical') this.next();
        break;
    }
  }
  
  // Method to go to a specific index
  goToIndex(index: number) {
    if (index < 0 || index >= this.cellCount) return;
    
    this.selectedIndex = index;
    this.rotateCarousel();
  }
  
  // Focus and blur handlers for keyboard accessibility
  @HostListener('focus')
  onFocus() {
    // Add keyboard instructions or visual indicator
    this.carousel.nativeElement.setAttribute('tabindex', '0');
  }
  
  @HostListener('blur')
  onBlur() {
    // Remove keyboard instructions
  }
  
  // For Angular OnDestroy lifecycle
  ngOnDestroy() {
    this.stopAutoRotate();
  }
}
