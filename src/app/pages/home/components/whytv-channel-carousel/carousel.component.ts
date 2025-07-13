import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnInit,
  Renderer2,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { patchState, signalState } from '@ngrx/signals';
import { findIndex, range } from 'lodash';
import _map from 'lodash/map';
import { ButtonModule } from 'primeng/button';
import { fromEvent } from 'rxjs';
import { tap } from 'rxjs/operators';

import { showHideVertical } from '../../../../../animations/show-hide-vertical.animation';
import { ChannelService } from '../../../../services/channel/channel.service';
import { UserActivityService } from '../../../../services/user-activity.service';
import { ChannelsState } from '../../../../states/channels.state';
import { Channel } from '../../../../states/video-player.state';

@Component({
  selector: 'whytv-channel-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  animations: [
    showHideVertical()
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhyTvChannelCarouselComponent implements AfterViewInit, OnInit {
  private renderer = inject(Renderer2);
  private route = inject(ActivatedRoute);
  readonly channelsState = inject(ChannelsState);
  readonly channelSvc = inject(ChannelService);
  readonly userActivitySvc = inject(UserActivityService);
  readonly destroyRef = inject(DestroyRef);
  carouselElement = viewChild<ElementRef<HTMLElement>>('carousel');
  hovering = signal(false);

  carouselCells = viewChildren<ElementRef>('carouselChannel');

  // Local component state
  state = signalState({
    isUserActive: true
  });

  // Signals for reactive state
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  channelId = computed(() => this.channelsState.currentChannel()?.id);
  selectedIndex = linkedSignal(() => {
    return findIndex(this.channelsState.channels(), { id: this.channelId() });
  });
  cellCount = computed(() => this.channelsState.channels().length);
  isHorizontal = computed(() => this.orientation() === 'horizontal');
  rotateFn = computed(() => this.isHorizontal() ? 'rotateY' : 'rotateX');
// Get dimensions
  cellWidth = computed(() => this.carouselElement()?.nativeElement?.offsetWidth ?? 0);
  cellHeight = computed(() => this.carouselElement()?.nativeElement?.offsetHeight ?? 0);
  theta = computed(() => 360 / this.channelsState.channels().length);
  cellSize = computed(() => this.isHorizontal() ? this.cellWidth() : this.cellHeight());

  // Keep this as a reference, but we're using a fixed radius value in the methods
  radius = computed(() => {
    const count = this.channelsState.channels().length;
    if (count <= 1) return 0;

    // Original formula for calculating the radius
    return Math.round(this.cellSize() / 2 / Math.tan(Math.PI / count));
  });

  cellsArray = computed(() => range(1, this.channelsState.channels().length + 1));

  // Add these properties for touch handling
  private startX = 0;
  private startY = 0;
  private threshold = 50; // Minimum distance to trigger swipe
  private touchInProgress = false;

  constructor() {
    this.channelSvc.channelSet$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(channel => {
      this.selectedIndex.update(currentIndex => findIndex(this.channelsState.channels(), { id: channel.id }));
      this.updateCellPositions();
    });

    // Subscribe to user activity events
    this.userActivitySvc.activity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isActive => {
        patchState(this.state, { isUserActive: isActive });
      });
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    // Wait for the next tick to ensure all elements are rendered
    setTimeout(() => {
      // Rotate carousel to show selected index
      this.selectedIndex.set(findIndex(this.channelsState.channels(), { id: this.channelsState.currentChannel()?.id }));
      this.updateCellPositions();

      // Initialize touch events
      this.initTouchEvents();
    }, 0);
  }

  private updateCellPositions(): void {
    // Get all carousel cells
    const cellElements = this.carouselCells().map(cell => cell.nativeElement);

    // Use a fixed radius value that matches the updated CSS
    const fixedRadius = 800;

    // Calculate the angle between items based on the number of channels
    // Use a consistent angle calculation to prevent overlapping
    const totalChannels = this.channelsState.channels().length;
    const baseAngle = 360 / totalChannels;

    // Set transform and opacity for each cell
    _map(cellElements, (cell: Element, i: number) => {
      if (i < this.cellCount()) {
        // Calculate the angle for this cell
        const cellAngle = baseAngle * i;

        // Calculate the angular distance from the selected item
        const selectedIndex = this.selectedIndex();
        const angularDistance = Math.min(
          Math.abs((i - selectedIndex + totalChannels) % totalChannels),
          Math.abs((selectedIndex - i + totalChannels) % totalChannels)
        );

        // Determine visibility based on distance from selected item
        const isNearSelected = angularDistance <= 3;

        // Apply appropriate styling based on proximity to selected item
        if (isNearSelected) {
          this.renderer.setStyle(cell, 'opacity', '1');
          this.renderer.setStyle(
            cell,
            'transform',
            `${this.rotateFn()}(${cellAngle}deg) translateZ(${fixedRadius}px)`
          );
        } else {
          // Fade out items that are far from the selected item
          const opacity = Math.max(0.2, 1 - (angularDistance * 0.15));
          this.renderer.setStyle(cell, 'opacity', opacity.toString());

          // Scale down distant items slightly to create depth
          const scale = Math.max(0.7, 1 - (angularDistance * 0.05));
          this.renderer.setStyle(
            cell,
            'transform',
            `${this.rotateFn()}(${cellAngle}deg) translateZ(${fixedRadius}px) scale(${scale})`
          );
        }
      } else {
        // Hidden cell
        this.renderer.setStyle(cell, 'opacity', '0');
        this.renderer.setStyle(cell, 'transform', 'none');
      }
    });

    // Call rotateCarousel after all cells have been positioned
    this.rotateCarousel();
  }

  private rotateCarousel(): void {
    // Use the same base angle calculation as in updateCellPositions
    const totalChannels = this.channelsState.channels().length;
    const baseAngle = 360 / totalChannels;

    // Calculate the rotation angle based on selected index
    const angle = baseAngle * this.selectedIndex() * -1;

    this.renderer.setStyle(
      this.carouselElement()?.nativeElement,
      'transform',
      `translateZ(-800px) ${this.rotateFn()}(${angle}deg)`
    );
  }

  loadChannel(channel: Channel): void {
    // Set the current channel in the service
    this.channelSvc.setCurrentChannel(channel);

    // The channel change should trigger the carousel to rotate via the subscription in constructor
    // But let's make sure it's immediate for the click experience
    const selectedIdx = findIndex(this.channelsState.channels(), { id: channel.id });
    if (selectedIdx !== -1) {
      this.selectedIndex.set(selectedIdx);
      this.updateCellPositions();
    }
  }

  // Event handlers
  onPreviousClick(): void {
    this.selectedIndex.update(currentIndex => {
      // Handle wraparound - if at first item, go to last item
      if (currentIndex <= 0) {
        return this.cellCount() - 1;
      }
      return currentIndex - 1;
    });
    this.updateCellPositions();
  }

  onNextClick(): void {
    this.selectedIndex.update(currentIndex => {
      // Handle wraparound - if at last item, go to first item
      if (currentIndex >= this.cellCount() - 1) {
        return 0;
      }
      return currentIndex + 1;
    });
    this.updateCellPositions();
  }

  private initTouchEvents(): void {
    const element = this.carouselElement()?.nativeElement;
    if (!element) return;

    // Touch start event
    fromEvent<TouchEvent>(element, 'touchstart')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(event => {
          if (event.touches.length === 1) {
            this.startX = event.touches[0].clientX;
            this.startY = event.touches[0].clientY;
            this.touchInProgress = true;
          }
        })
      )
      .subscribe();

    // Touch end event
    fromEvent<TouchEvent>(element, 'touchend')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(event => {
          if (!this.touchInProgress) return;

          const endX = event.changedTouches[0].clientX;
          const endY = event.changedTouches[0].clientY;

          // Calculate distance and direction
          const deltaX = endX - this.startX;
          const deltaY = endY - this.startY;

          // Determine if horizontal or vertical swipe based on orientation
          if (this.isHorizontal()) {
            if (Math.abs(deltaX) >= this.threshold) {
              if (deltaX > 0) {
                this.onPreviousClick(); // Swipe right → previous
              } else {
                this.onNextClick(); // Swipe left → next
              }
            }
          } else {
            if (Math.abs(deltaY) >= this.threshold) {
              if (deltaY > 0) {
                this.onPreviousClick(); // Swipe down → previous
              } else {
                this.onNextClick(); // Swipe up → next
              }
            }
          }

          this.touchInProgress = false;
        })
      )
      .subscribe();
  }
}


