import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { SpeedDialModule } from 'primeng/speeddial';

import { UIStateService } from '../../services/ui-state.service';
import { ChannelsState } from '../../states/channels.state';
import { videoPlayerState } from '../../states/video-player.state';
import { SideActionsComponent } from './components/side-actions/side-actions.component';
import { WhyTvChannelCarouselComponent } from './components/whytv-channel-carousel/carousel.component';
import { WhytvPlayerComponent } from './components/whytv-player/whytv-player.component';

@Component({
  imports: [
    CommonModule,
    SpeedDialModule,
    ButtonModule,
    LucideAngularModule,
    WhyTvChannelCarouselComponent,
    WhytvPlayerComponent,
    SideActionsComponent
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly playerState = inject(videoPlayerState);
  readonly channelsState = inject(ChannelsState);
  readonly uiState = inject(UIStateService);

  // Track if mouse is over carousel to prevent auto-hide
  private isOverCarousel = signal(false);
  private hideTimeout: any;

  handleHoverZoneEnter() {
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    // Show the channel rail
    if (!this.uiState.channelRailVisible()) {
      this.uiState.showChannelRail();
    }
  }

  handleHoverZoneLeave(event: MouseEvent) {
    // Only hide if we're not moving to the carousel itself
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('whytv-channel-carousel')) {
      return;
    }

    // Set a small delay before hiding to prevent flickering
    this.hideTimeout = setTimeout(() => {
      if (!this.isOverCarousel()) {
        this.uiState.hideChannelRail();
      }
    }, 300);
  }

  handleCarouselMouseEnter() {
    this.isOverCarousel.set(true);
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  handleCarouselMouseLeave() {
    this.isOverCarousel.set(false);
    // Hide the carousel after a delay
    this.hideTimeout = setTimeout(() => {
      this.uiState.hideChannelRail();
    }, 300);
  }

  ngOnDestroy() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  // @TODO: Future enhancement - Re-enable SpeedDial for mobile UI
  // The SpeedDial menu provides a better mobile experience but was temporarily
  // disabled to avoid duplication with SideActionsComponent. 
  // All action handling is now centralized in SideActionsComponent.
}
