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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findIndex, range } from 'lodash';
import _map from 'lodash/map';
import { ButtonModule } from 'primeng/button';

import { showHideVertical } from '../../../../../animations/show-hide-vertical.animation';
import { ChannelService } from '../../../../services/channel/channel.service';
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
    FormsModule,
    RouterLink,

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
  readonly destroyRef = inject(DestroyRef);
  carouselElement = viewChild<ElementRef<HTMLElement>>('carousel');
  hovering = signal(false);

  carouselCells = viewChildren<ElementRef>('carouselChannel');

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

  constructor() {
    this.channelSvc.channelSet$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(channel => {
      this.selectedIndex.update(currentIndex => findIndex(this.channelsState.channels(), { id: channel.id }));
      this.updateCellPositions();
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
    }, 0);
  }

  private updateCellPositions(): void {
    // Get all carousel cells
    const cellElements = this.carouselCells().map(cell => cell.nativeElement);

    // Use a fixed radius value that matches the updated CSS
    const fixedRadius = 800;

    // Calculate the angle between items based on the number of channels
    // Adjust buffer to find the right balance of spacing
    const angleBuffer = this.channelsState.channels().length > 5 ? 8 : 5;
    const adjustedTheta = this.theta() + angleBuffer;

    // Set transform and opacity for each cell
    _map(cellElements, (cell: Element, i: number) => {
      if (i < this.cellCount()) {
        // Visible cell
        this.renderer.setStyle(cell, 'opacity', '1');
        const cellAngle = adjustedTheta * i;

        // Calculate the angular distance from the selected item
        const selectedIndex = this.selectedIndex();
        const angularDistance = Math.abs((i - selectedIndex + this.cellCount()) % this.cellCount());
        const isNearSelected = angularDistance <= 4 || angularDistance >= this.cellCount() - 4;

        // Only show items that are near the selected item
        if (isNearSelected) {
          this.renderer.setStyle(cell, 'opacity', '1');
          this.renderer.setStyle(
            cell,
            'transform',
            `${this.rotateFn()}(${cellAngle}deg) translateZ(${fixedRadius}px)`
          );
        } else {
          // Hide items that are far from the selected item
          this.renderer.setStyle(cell, 'opacity', '0.2');
          this.renderer.setStyle(
            cell,
            'transform',
            `${this.rotateFn()}(${cellAngle}deg) translateZ(${fixedRadius}px) scale(0.8)`
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
    // Calculate the angle between items based on the number of channels
    // Adjust buffer to find the right balance of spacing
    const angleBuffer = this.channelsState.channels().length > 5 ? 8 : 5;
    const adjustedTheta = this.theta() + angleBuffer;

    const angle = adjustedTheta * this.selectedIndex() * -1;

    // Apply a small offset to center the selected item
    // This helps adjust for any slight misalignment
    const offset = 0;

    this.renderer.setStyle(
      this.carouselElement()?.nativeElement,
      'transform',
      `translateZ(-800px) ${this.rotateFn()}(${angle + offset}deg)`
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
}


