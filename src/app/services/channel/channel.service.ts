import { inject, Injectable, OnDestroy } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { patchState } from '@ngrx/signals';
import { addDoc, collection } from 'firebase/firestore';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject } from 'rxjs';

import { CreateChannelDialogComponent } from '../../components/create-channel-dialog/create-channel-dialog.component';
import { ChannelsState } from '../../states/channels.state';
import { Channel } from '../../states/video-player.state';
import { FirestoreService } from '../firestore.service';

@Injectable({
  providedIn: 'root'
})
export class ChannelService implements OnDestroy {
  private firestore = inject(Firestore);
  private messageSvc = inject(MessageService);
  private channelsStore = inject(ChannelsState);
  private firestoreService = inject(FirestoreService);
  private dialogService = inject(DialogService);
  #channelSet = new Subject<Channel>();

  // Track active subscriptions
  private destroy$ = new Subject<void>();
  private activeSubscription: (() => void) | null = null;
  private dialogRef: DynamicDialogRef | null = null;

  readonly channelSet$ = this.#channelSet.asObservable();

  /**
   * Open the create channel dialog
   * @returns A promise that resolves when the dialog is closed
   */
  openCreateChannelDialog(): Promise<boolean> {
    // Close any existing dialog
    if (this.dialogRef) {
      this.dialogRef.close();
    }

    // Open the dialog
    this.dialogRef = this.dialogService.open(CreateChannelDialogComponent, {
      header: 'Create Channel',
      width: '25rem',
      contentStyle: {
        'max-height': '80vh',
        'overflow': 'auto',
        'padding': '1.5rem',
        'width': '100%'
      },
      baseZIndex: 10000,
      modal: true,
      dismissableMask: true,
      closeOnEscape: true,
      styleClass: 'create-channel-dialog p-dialog-md'
    });

    // Return a promise that resolves when the dialog is closed
    return this.dialogRef.onClose.toPromise();
  }

  /**
   * Create a new channel with the provided description, provider and model
   * @param channelDescription The description to use for generating channel content
   * @param provider The AI provider to use (openai, anthropic, google, grok)
   * @param model The specific AI model to use
   */
  async createChannel(
    channelDescription: string,
    provider: string = 'openai',
    model: string = 'gpt-4o'
  ): Promise<void> {
    // Validate description
    if (!channelDescription || channelDescription.trim().length === 0) {
      this.messageSvc.add({
        severity: 'error',
        summary: 'Invalid Input',
        detail: 'Please provide a channel description.'
      });
      return;
    }

    // Ensure description has enough content for AI to work with
    if (channelDescription.trim().length < 10) {
      this.messageSvc.add({
        severity: 'error',
        summary: 'Description Too Short',
        detail: 'Please provide a more detailed description (at least 10 characters).'
      });
      return;
    }

    const channel = {
      description: channelDescription.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      channelName: 'New Channel', // Will be replaced by the backend
      // AI provider and model information
      provider: provider,
      model: model,
      // Add these fields to ensure consistent document structure
      channelNumber: null,
      queriesCount: 0,
      totalVideosFound: 0,
      selectedVideosCount: 0,
      deletedVideosCount: 0
    };

    try {
      const channelsRef = collection(this.firestore, 'channels');
      const docRef = await addDoc(channelsRef, channel);
      const channelId = docRef.id;

      this.messageSvc.add({
        severity: 'success',
        summary: 'Channel Processing',
        detail: 'Channel created successfully! Starting processing...'
      });

      // Set up a subscription to listen for channel status changes
      // this.subscribeToChannelStatus(channelId);

    } catch (error) {
      console.error('Error creating channel:', error);
      this.messageSvc.add({
        severity: 'error',
        summary: 'Channel Creation Failed',
        detail: 'Failed to create channel. Please try again.'
      });
    }
  }

  /**
     * Load all available channels from Firestore
     */
  async loadChannels() {
    let channels: any[] = [];
    patchState(this.channelsStore, { isLoading: true, error: null });

    try {
      channels = await this.firestoreService.getChannels();

      if (channels.length > 0) {
        patchState(this.channelsStore, {
          channels,
          currentChannel: channels[0],
          currentVideoIndex: 0,
          isLoading: false
        });
      } else {
        patchState(this.channelsStore, {
          channels: [],
          isLoading: false
        });
      }

      this.messageSvc.add({
        severity: 'success',
        summary: 'Channels Loaded',
        detail: 'Channels loaded successfully!'
      });
    } catch (error) {
      console.error('Error loading channels:', error);
      patchState(this.channelsStore, {
        isLoading: false,
        error: 'Failed to load channels'
      });
    }

    return channels;
  }
  /**
   * Load a specific channel when it's ready and select it
   * @param channelId The ID of the channel to load
   */
  private async loadAndSelectLiveChannel(channelId: string): Promise<void> {
    try {
      // Refresh the channel list to make sure it includes the new channel
      await this.loadChannels();

      // Get the full channel list
      const channelList = this.channelsStore.channels();

      // Find the new channel in the list
      const newChannel = channelList.find(channel => channel.id === channelId);

      // If found, set it as the current channel
      if (newChannel) {
        patchState(this.channelsStore, {
          currentChannel: newChannel,
          currentVideoIndex: 0
        });
      }
    } catch (error) {
      console.error('Error loading new channel:', error);
      this.messageSvc.add({
        severity: 'error',
        summary: 'Channel Loading Failed',
        detail: 'Failed to load channel. Please try again.'
      });
    }
  }

  /**
     * Set the active channel
     */
  setCurrentChannel(channel: Channel) {
    patchState(this.channelsStore, {
      currentChannel: channel
    });
    this.#channelSet.next(channel);
  }

  /**
   * Go to the next video in the current channel
   * @returns true if successful, false if at the end
   */
  nextVideo(): void {
    const channel = this.channelsStore.currentChannel();
    const index = this.channelsStore.currentVideoIndex();
    const count = channel?.videos?.length || 0;

    if (count > 0 && index < count - 1) {
      patchState(this.channelsStore, { currentVideoIndex: index + 1 });
    } else {
      patchState(this.channelsStore, { currentVideoIndex: 0 });
    }

    this.messageSvc.add({
      severity: 'info',
      summary: 'Next Video',
      life: 2000
    });
  }

  /**
   * Go to the previous video in the current channel
   * @returns true if successful, false if at the beginning
   */
  previousVideo(): void {
    const index = this.channelsStore.currentVideoIndex();

    if (index > 0) {
      patchState(this.channelsStore, { currentVideoIndex: index - 1 });
    }

    this.messageSvc.add({
      severity: 'info',
      summary: 'Previous Video',
      life: 2000
    });
  }

  /**
   * Clean up subscriptions on service destroy
   */
  ngOnDestroy(): void {
    if (this.activeSubscription) {
      this.activeSubscription();
    }
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}

export async function loadChannels(): Promise<void> {
  const channelService = inject(ChannelService);
  await channelService.loadChannels();
}
