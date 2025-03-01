import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal, OnInit } from '@angular/core';
import {
    Heart,
    LucideAngularModule,
    MessageCircle,
    Share2,
    Volume2,
    VolumeX,
    ChevronUp,
    ChevronDown,
    List,
    X,
    Plus
} from 'lucide-angular';

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
  createChannel = output<MouseEvent>();

  handleLikeToggle(event: MouseEvent) {
    event.stopPropagation();
    this.likeToggle.emit(event);
  }

  handleMuteToggle(event: MouseEvent) {
    event.stopPropagation();
    this.muteToggle.emit(event);
  }

  handleCommentToggle(event: MouseEvent) {
    event.stopPropagation();
    this.commentToggle.emit(event);
  }

  handleShareToggle(event: MouseEvent) {
    event.stopPropagation();
    this.shareToggle.emit(event);
  }

  handleNextVideo(event: MouseEvent) {
    event.stopPropagation();
    this.nextVideo.emit(event);
  }

  handlePreviousVideo(event: MouseEvent) {
    event.stopPropagation();
    this.previousVideo.emit(event);
  }

  handleToggleCarousel(event: MouseEvent) {
    event.stopPropagation();
    this.toggleCarousel.emit(event);
  }
  
  handleCreateChannel(event: MouseEvent) {
    event.stopPropagation();
    this.createChannel.emit(event);
  }
  
  ngOnInit(): void {
    // Set initial animation state
    setTimeout(() => {
      this.initialAnimation.set(false);
    }, 100);
  }
}
