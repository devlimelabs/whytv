import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { patchState } from '@ngrx/signals';
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

import { videoPlayerState } from '../../states/video-player.state';

@Component({
  selector: 'app-side-actions',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './side-actions.component.html',
  styleUrl: './side-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class SideActionsComponent implements OnInit {
  // Animation state for initial entrance
  initialAnimation = signal(true);

  // State
  readonly playerState = inject(videoPlayerState);

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

  // Inputs
  isMuted = input<boolean>(false);
  liked = input<boolean>(false);
  showControls = input<boolean>(true);
  carouselVisible = input<boolean>(false);

  // Outputs
  likeToggle = output<MouseEvent>();
  muteToggle = output<MouseEvent>();
  commentToggle = output<MouseEvent>();
  shareToggle = output<MouseEvent>();
  nextVideo = output<MouseEvent>();
  previousVideo = output<MouseEvent>();
  toggleCarousel = output<MouseEvent>();
  toggleChannelRail = output<MouseEvent>();  // New output for channel rail toggle
  createChannel = output<MouseEvent>();

  // Helper method to update user activity in the state
  private markUserActive(): void {
    patchState(this.playerState, {
      userIsActive: true,
      showControls: true,
      hideUIOverlays: false
    });
  }

  handleLikeToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.likeToggle.emit(event);
  }

  handleMuteToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.muteToggle.emit(event);
  }

  handleCommentToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.commentToggle.emit(event);
  }

  handleShareToggle(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.shareToggle.emit(event);
  }

  handleNextVideo(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.nextVideo.emit(event);
  }

  handlePreviousVideo(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.previousVideo.emit(event);
  }

  handleToggleCarousel(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.toggleCarousel.emit(event);
  }

  handleCreateChannel(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.createChannel.emit(event);
  }

  handleToggleChannelRail(event: MouseEvent) {
    event.preventDefault();
    this.markUserActive();
    this.toggleChannelRail.emit(event);
  }

  ngOnInit(): void {
    // Set initial animation state
    setTimeout(() => {
      this.initialAnimation.set(false);
    }, 100);
  }
}
