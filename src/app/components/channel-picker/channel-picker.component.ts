import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, model, OnDestroy, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ChannelService } from '../../services/channel/channel.service';
import { Channel } from '../../shared/types/video.types';

@Component({
  selector: 'app-channel-picker',
  templateUrl: './channel-picker.component.html',
  styleUrls: ['./channel-picker.component.css'],
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DialogModule,
    ReactiveFormsModule,
    FloatLabelModule,
    FormsModule,
    TextareaModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChannelPickerComponent implements OnInit, OnDestroy {
  private channelService = inject(ChannelService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  channels = input.required<Channel[]>();
  activeChannel = input.required<Channel>();
  visible = model(false);
  channelDescription = model('');

  // Outputs
  channelSelect = output<Channel>();

  // Signals for UI state
  isExpanded = signal(false);
  showControls = signal(true);
  private hideControlsTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed signal to filter out the active channel
  filteredChannels = computed(() => {
    // Filter out the active channel and ensure we have a valid array
    return this.channels().filter(channel =>
      channel && this.activeChannel() && channel.id !== this.activeChannel().id
    );
  });

  ngOnInit(): void {
    // Track mouse movement for smoother hover behavior and controls visibility
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        debounceTime(50),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        // Show controls on mouse movement
        this.showControls.set(true);
        this.resetHideControlsTimer();
      });
  }

  ngOnDestroy(): void {
    // Clean up timer
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
  }

  private resetHideControlsTimer(): void {
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
    this.hideControlsTimer = setTimeout(() => {
      this.showControls.set(false);
    }, 3000);
  }

  openCreateChannelDialog() {
    this.visible.set(true);
  }

  cancelCreateChannel() {
    this.visible.set(false);
  }

  async createChannel(): Promise<void> {
    await this.channelService.createChannel(this.channelDescription());
    this.visible.set(false);
  }
}
