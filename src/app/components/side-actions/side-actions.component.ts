import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Heart, LucideAngularModule, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-angular';

@Component({
  selector: 'app-side-actions',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './side-actions.component.html',
  styleUrl: './side-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideActionsComponent {
  protected readonly Heart = Heart;
  protected readonly MessageCircle = MessageCircle;
  protected readonly Share2 = Share2;
  protected readonly Volume2 = Volume2;
  protected readonly VolumeX = VolumeX;

  isMuted = signal(false);
  liked = signal(false);
  showControls = signal(true);

  toggleLike(event: MouseEvent) {
    event.stopPropagation();
    this.liked.update(value => !value);
  }

  toggleMute(event: MouseEvent) {
    event.stopPropagation();
    this.isMuted.update(value => !value);
  }
}
