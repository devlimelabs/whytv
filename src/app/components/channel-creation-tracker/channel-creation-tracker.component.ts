import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject, takeUntil } from 'rxjs';

import { ChannelService } from '../../services/channel/channel.service';
import { ChannelStatusUpdate, FirestoreService } from '../../services/firestore.service';

interface ChannelCreationProgress {
  id: string;
  channelName: string;
  status: string;
  description?: string;
  startTime: Date;
}

@Component({
  selector: 'app-channel-creation-tracker',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule
  ],
  templateUrl: './channel-creation-tracker.component.html',
  styleUrl: './channel-creation-tracker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ChannelCreationTrackerComponent implements OnInit, OnDestroy {
  private firestoreService = inject(FirestoreService);
  private channelService = inject(ChannelService);
  private destroy$ = new Subject<void>();

  state = signalState({
    activeChannels: [] as ChannelCreationProgress[],
    isVisible: false
  });

  ngOnInit() {
    // Subscribe to channel status updates
    this.firestoreService.channelStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => this.handleChannelStatusUpdate(update));

    // Subscribe to new channel creation events
    this.channelService.channelCreationStarted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(channelData => this.addChannelToTracking(channelData));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addChannelToTracking(channelData: { id: string; description: string }) {
    const newChannel: ChannelCreationProgress = {
      id: channelData.id,
      channelName: 'Creating channel...',
      status: 'pending',
      description: channelData.description,
      startTime: new Date()
    };

    patchState(this.state, {
      activeChannels: [...this.state.activeChannels(), newChannel],
      isVisible: true
    });
  }

  private handleChannelStatusUpdate(update: ChannelStatusUpdate) {
    const currentChannels = this.state.activeChannels();
    const channelIndex = currentChannels.findIndex(ch => ch.id === update.id);

    if (channelIndex === -1) return;

    const updatedChannels = [...currentChannels];
    updatedChannels[channelIndex] = {
      ...updatedChannels[channelIndex],
      channelName: update.channelName,
      status: update.status
    };

    // Remove channel if it's live (completed)
    if (update.status === 'live') {
      updatedChannels.splice(channelIndex, 1);
    }

    patchState(this.state, {
      activeChannels: updatedChannels,
      isVisible: updatedChannels.length > 0
    });

    // Refresh channel list when a channel goes live
    if (update.status === 'live') {
      this.channelService.loadChannels();
    }
  }

  getStatusMessage(status: string): string {
    const statusMessages: Record<string, string> = {
      'pending': 'Initializing channel...',
      'new': 'Starting processing...',
      'processing queries': 'Generating search queries...',
      'queries ready': 'Searching for videos...',
      'select_videos': 'Selecting best videos...',
      'videos_selected': 'Finalizing playlist...',
      'live': 'Channel ready! 🎉'
    };
    return statusMessages[status] || 'Processing...';
  }

  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      'pending': '⏳',
      'new': '🔄',
      'processing queries': '🔍',
      'queries ready': '📺',
      'select_videos': '✨',
      'videos_selected': '🎬',
      'live': '🎉'
    };
    return statusIcons[status] || '⏳';
  }

  dismissChannel(channelId: string) {
    const currentChannels = this.state.activeChannels();
    const updatedChannels = currentChannels.filter(ch => ch.id !== channelId);
    
    patchState(this.state, {
      activeChannels: updatedChannels,
      isVisible: updatedChannels.length > 0
    });
  }

  dismissAll() {
    patchState(this.state, {
      activeChannels: [],
      isVisible: false
    });
  }
}