import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { patchState, signalState } from '@ngrx/signals';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  List,
  LucideAngularModule,
  MessageCircle,
  Plus,
  Share2,
  Tv,
  Volume2,
  VolumeX,
  X,
} from 'lucide-angular';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SpeedDialModule } from 'primeng/speeddial';
import { BehaviorSubject, Subscription, timer } from 'rxjs';

import { WhyTvChannelCarouselComponent } from '../../custom-carousel/carousel.component';
import { channelsStore } from '../../states/channels.state';
import { videoPlayerState } from '../../states/video-player.state';

@Component({
  imports: [
    CommonModule,
    SpeedDialModule,
    ButtonModule,
    RouterOutlet,
    LucideAngularModule,
    WhyTvChannelCarouselComponent
],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  readonly playerState = inject(videoPlayerState);
  readonly channelsState = inject(channelsStore);
  #userActive = new BehaviorSubject<boolean>(true);
  readonly userActive$ = this.#userActive.asObservable();
  userActivitySub!: Subscription;
  readonly destroyRef = inject(DestroyRef);

  @HostListener('mousemove', ['$event'])
  @HostListener('click', ['$event'])
  @HostListener('touchstart', ['$event'])
  userActivityHandler(event: any) {
    this.markUserActive();
    patchState(this.state, {
      videoCarouselVisible: true
    });
  }


  state = signalState({
    videoCarouselVisible: false,
    videoId: 'dQw4w9WgXcQ',
    channelCarouselVisible: false
  });

  // Lucide icons
  protected readonly Heart = Heart;
  protected readonly MessageCircle = MessageCircle;
  protected readonly Share2 = Share2;
  protected readonly Volume2 = Volume2;
  protected readonly VolumeX = VolumeX;
  protected readonly ChevronUp = ChevronUp;
  protected readonly ChevronDown = ChevronDown;
  protected readonly List = List;
  protected readonly X = X;
  protected readonly Plus = Plus;
  protected readonly Tv = Tv;



  // SpeedDial items
  items: MenuItem[] = [
    {
      label: 'Videos',
      icon: PrimeIcons.LIST,
      command: (event) => this.toggleVideoCarousel(event)
    },
    {
      label: this.playerState.liked() ? 'Unlike' : 'Like',
      icon: PrimeIcons.HEART,
      command: (event) => this.handleLikeToggle(event)
    },
    {
      label: 'Comment',
      icon: PrimeIcons.COMMENT,
      command: (event) => this.handleCommentToggle(event)
    },
    {
      label: 'Share',
      icon: PrimeIcons.SHARE_ALT,
      command: (event) => this.handleShareToggle(event)
    },
    {
      label: 'Next Video',
      icon: PrimeIcons.CHEVRON_UP,
      toggleCallback: this.handleNextVideo
    },
    {
      label: 'Previous Video',
      icon: PrimeIcons.CHEVRON_DOWN,
      toggleCallback: this.handlePreviousVideo
    },
    {
      label: this.playerState.muted() ? 'Unmute' : 'Mute',
      icon: this.playerState.muted() ? PrimeIcons.VOLUME_OFF : PrimeIcons.VOLUME_UP,
      toggleCallback: this.handleMuteToggle
    },
    {
      label: 'Channel Rail',
      icon: PrimeIcons.DESKTOP,
      toggleCallback: this.handleToggleChannelRail
    },
    {
      label: 'Create Channel',
      icon: PrimeIcons.PLUS,
      toggleCallback: this.handleCreateChannel
    }
  ];

  ngOnInit(): void { }

  // Helper method to update user activity in the state
  private markUserActive(): void {
    patchState(this.playerState, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });

    if (this.userActivitySub) {
      this.userActivitySub.unsubscribe();
    }


    this.userActivitySub = timer(0, 2000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        patchState(this.playerState, {
          userIsActive: true,
          showControls: true,
          hideUIOverlays: false
        });
      });

  }

  toggleVideoCarousel(event: any) {
    event.preventDefault();
    this.markUserActive();
    patchState(this.state, {
      videoCarouselVisible: !this.state().videoCarouselVisible
    });
  }

  handleLikeToggle(event: any) {
    event.preventDefault();
    this.markUserActive();
    patchState(this.playerState, {
      liked: !this.playerState.liked()
    });
    // Update the items array to reflect the new liked state
    this.updateItemLabel('Like', this.playerState.liked() ? 'Unlike' : 'Like');
    this.updateItemIcon('Like', 'pi pi-heart');
  }

  handleCommentToggle(event: any) {
    event.preventDefault();
    this.markUserActive();
    // Implement comment toggle logic
  }

  handleShareToggle(event: any) {
    event.preventDefault();
    this.markUserActive();
    // Implement share toggle logic
  }

  handleNextVideo(event: any) {
    event.preventDefault();
    this.markUserActive();
    // Implement next video logic
  }

  handlePreviousVideo(event: any) {
    event.preventDefault();
    this.markUserActive();
    // Implement previous video logic
  }

  handleMuteToggle(event: any) {
    event.preventDefault();
    this.markUserActive();
    patchState(this.playerState, {
      muted: !this.playerState.muted()
    });
    // Update the items array to reflect the new muted state
    this.updateItemLabel('Mute', this.playerState.muted() ? 'Unmute' : 'Mute');
    this.updateItemIcon('Mute', this.playerState.muted() ? 'pi pi-volume-off' : 'pi pi-volume-up');
  }

  handleToggleChannelRail(event: any) {
    event.preventDefault();
    this.markUserActive();
    this.toggleChannelCarousel();
  }

  handleCreateChannel(event: any) {
    event.preventDefault();
    this.markUserActive();
    // Implement create channel logic
  }

  toggleChannelCarousel() {
    patchState(this.state, {
      channelCarouselVisible: !this.state().channelCarouselVisible
    });
  }

  // Helper method to update item labels
  private updateItemLabel(itemLabel: string, newLabel: string): void {
    const itemIndex = this.items.findIndex(item =>
      item.label === itemLabel || item.label === (itemLabel === 'Like' ? 'Unlike' : 'Unmute'));

    if (itemIndex !== -1) {
      this.items[itemIndex].label = newLabel;
    }
  }

  // Helper method to update item icons
  private updateItemIcon(itemLabel: string, iconClass: string): void {
    const itemIndex = this.items.findIndex(item =>
      item.label === itemLabel || item.label === (itemLabel === 'Like' ? 'Unlike' : 'Unmute'));

    if (itemIndex !== -1) {
      this.items[itemIndex].icon = iconClass;
    }
  }
}
