import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { UserActivityService } from './services/user-activity.service';
import { ChannelCreationTrackerComponent } from './components/channel-creation-tracker/channel-creation-tracker.component';

// Channel Picker removed in favor of side-actions button
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    CarouselModule,
    ToastModule,
    DialogModule,
    DynamicDialogModule,
    ButtonModule,
    FormsModule,
    SelectModule,
    ChannelCreationTrackerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class AppComponent {
  private readonly userActivitySvc = inject(UserActivityService);

  // Use HostListener for better performance and cleaner code
  @HostListener('document:mousemove')
  @HostListener('document:mousedown')
  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:touchstart')
  @HostListener('document:touchmove')
  onUserActivity(): void {
    this.userActivitySvc.triggerActivity();
  }

  constructor() {
    // Ensure the user activity service is initialized
    setTimeout(() => {
      this.userActivitySvc.triggerActivity();
    }, 100);
  }
}
