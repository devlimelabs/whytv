import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { SpeedDialModule } from 'primeng/speeddial';

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



  // @TODO: Future enhancement - Re-enable SpeedDial for mobile UI
  // The SpeedDial menu provides a better mobile experience but was temporarily
  // disabled to avoid duplication with SideActionsComponent. 
  // All action handling is now centralized in SideActionsComponent.
}
