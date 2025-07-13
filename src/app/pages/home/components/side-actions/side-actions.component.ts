import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { ToastModule } from 'primeng/toast';

import { ChannelService } from '../../../../services/channel/channel.service';
import { UIStateService } from '../../../../services/ui-state.service';
import { UserActivityService } from '../../../../services/user-activity.service';
import { VideoPlayerService } from '../../../../services/video-player.service';
import { UserActivityState } from '../../../../states/user-activity.state';
import { videoPlayerState } from '../../../../states/video-player.state';

@Component({
  selector: 'app-side-actions',
  imports: [
    CommonModule,
    LucideAngularModule,
    ToastModule
  ],
  templateUrl: './side-actions.component.html',
  styleUrl: './side-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class SideActionsComponent implements OnInit {
  // Animation state for initial entrance
  initialAnimation = signal(true);

  // Services
  readonly videoPlayerSvc = inject(VideoPlayerService);
  readonly channelSvc = inject(ChannelService);
  readonly userActivitySvc = inject(UserActivityService);
  readonly userActivityState = inject(UserActivityState);
  readonly uiState = inject(UIStateService);
  readonly destroyRef = inject(DestroyRef);

  // State
  readonly playerState = inject(videoPlayerState);

  // Local component state
  state = signalState({
    isUserActive: true
  });

  // Transition time matches video carousel transition
  transitionStyle = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
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

  constructor() {
    // Subscribe to user activity events
    this.userActivitySvc.activity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isActive => {
        patchState(this.state, { isUserActive: isActive });
      });
  }

  // Helper method to update user activity in the state
  private markUserActive(): void {
    // Update the player state through the service
    this.videoPlayerSvc.setUserActive();

    // Trigger activity in the user activity service
    this.userActivitySvc.triggerActivity();
  }

  handleLikeToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // Use the service method to toggle liked state
    this.videoPlayerSvc.toggleLiked();
  }

  handleMuteToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // Following the pattern where the service triggers actions that the player component responds to
    if (this.playerState.muted()) {
      this.videoPlayerSvc.volume(100); // Unmute by setting volume to 100
    } else {
      this.videoPlayerSvc.volume(0); // Mute by setting volume to 0
    }
    // Note: The actual state update will happen in the player component after the action is performed
  }

  handleCommentToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // Implement comment toggle logic
    // This is a UI-only action so we can patch state directly
  }

  handleShareToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // Implement share toggle logic
    // This is a UI-only action so we can patch state directly
  }

  handleNextVideo(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // Use channel service to go to next video
    this.channelSvc.nextVideo();
  }

  handlePreviousVideo(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // Use channel service to go to previous video
    this.channelSvc.previousVideo();
  }

  handleToggleCarousel(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.uiState.toggleCarousel();
  }

  handleCreateChannel(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();

    // Use the channel service to open the dialog
    this.channelSvc.openCreateChannelDialog().then(result => {
      // Handle the result if needed
    });
  }

  handleToggleChannelRail(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    // TODO: Implement channel rail toggle functionality
    // This should be managed through a proper service or state management
  }

  // Check if we're in fullscreen and user is inactive
  isFullscreenInactive(): boolean {
    return !!document.fullscreenElement && !this.state().isUserActive;
  }

  ngOnInit(): void {
    // Set initial animation state
    setTimeout(() => {
      this.initialAnimation.set(false);
    }, 100);

  }
}
