import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findIndex, range } from 'lodash';
import _map from 'lodash/map';
import { ButtonModule } from 'primeng/button';
import { map } from 'rxjs';

import { showHideVertical } from '../../animations/show-hide-vertical.animation';
import { channelsStore } from '../states/channels.state';
import { Channel } from '../states/video-player.state';

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
  readonly channelsStore = inject(channelsStore);

  carouselElement = viewChild<ElementRef<HTMLElement>>('carousel');
  hovering = signal(false);

  carouselCells = viewChildren<ElementRef<HTMLElement>>('.carousel__cell');

  // Signals for reactive state
  data = input<Channel[]>([]);
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  channelId = toSignal(this.route.queryParams.pipe(map(params => params['channelId'])));

  selectedIndex = linkedSignal(() => {
    return findIndex(this.data(), { id: this.channelId() });
  });
  cellCount = computed(() => this.data().length);
  isHorizontal = computed(() => this.orientation() === 'horizontal');
  rotateFn = computed(() => this.isHorizontal() ? 'rotateY' : 'rotateX');
// Get dimensions
  cellWidth = linkedSignal(() => this.carouselElement()?.nativeElement?.offsetWidth ?? 0);
  cellHeight = linkedSignal(() => this.carouselElement()?.nativeElement?.offsetHeight ?? 0);
  theta = computed(() => 360 / this.cellCount());
  cellSize = computed(() => this.isHorizontal() ? this.cellWidth() : this.cellHeight());
  radius = computed(() => Math.round(this.cellSize() / 2 / Math.tan(Math.PI / this.cellCount())));


  cellsArray = computed(() => range(1, this.cellCount() + 1));

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    // Initialize carousel after view is initialized
    // Update cell positions
    this.updateCellPositions();

    // Rotate carousel to show selected index
    this.rotateCarousel();
    console.log(this.data(), this.channelId());
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
  }

  private rotateCarousel(): void {
    const angle = this.theta() * this.selectedIndex() * -1;
    this.renderer.setStyle(
      this.carouselElement()?.nativeElement,
      'transform',
      `translateZ(${-this.radius()}px) ${this.rotateFn()}(${angle}deg)`
    );
  }

  // Event handlers
  onPreviousClick(): void {
    this.selectedIndex.update(val => val - 1);
    this.rotateCarousel();
  }

  onNextClick(): void {
    this.selectedIndex.update(val => val + 1);
    this.rotateCarousel();
  }
}


