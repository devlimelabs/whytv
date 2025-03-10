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

  carouselCells = viewChildren<ElementRef>('#carouselChannel');

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
  theta = computed(() => 360 / this.cellCount());
  cellSize = computed(() => this.isHorizontal() ? this.cellWidth() : this.cellHeight());
  radius = computed(() => Math.round(this.cellSize() / 2 / Math.tan(Math.PI / this.cellCount())));


  cellsArray = computed(() => range(1, this.cellCount() + 1));

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


    // Rotate carousel to show selected index
    this.selectedIndex.set(findIndex(this.channelsState.channels(), { id: this.channelsState.currentChannel()?.id }));
    this.updateCellPositions();
    console.log(this.channelsState.channels(), this.channelId());
  }

  private updateCellPositions(): void {
    // Get all carousel cells
    const cellElements = this.carouselCells().map(cell => cell.nativeElement);

    // Set transform and opacity for each cell
    _map(cellElements, (cell: Element, i: number) => {
      if (i < this.cellCount()) {
        // Visible cell
        this.renderer.setStyle(cell, 'opacity', '1');
        const cellAngle = this.theta() * i;
        this.renderer.setStyle(
          cell,
          'transform',
          `${this.rotateFn()}(${cellAngle}deg) translateZ(${this.radius()}px)`
        );
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
    const angle = this.theta() * this.selectedIndex() * -1;
    console.log(this.carouselElement()?.nativeElement);
    this.renderer.setStyle(
      this.carouselElement()?.nativeElement,
      'transform',
      `translateZ(${-this.radius()}px) ${this.rotateFn()}(${angle}deg)`
    );
  }

  loadChannel(channel: Channel): void {
    this.channelSvc.setCurrentChannel(channel);
  }

  // Event handlers
  onPreviousClick(): void {
    this.selectedIndex.update(val => val - 1);
    this.updateCellPositions();
  }

  onNextClick(): void {
    this.selectedIndex.update(val => val + 1);
    this.updateCellPositions();
  }
}


